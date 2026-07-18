"""
Lead Service
============
Core business logic for Lead CRUD, stage transitions, assignment,
starred toggle, and bulk operations.

All methods are @classmethod / @staticmethod — stateless, testable.
Views delegate all business logic here.
"""

from django.db import transaction
from django.utils import timezone
from django.core.exceptions import ValidationError

from common.models import ActivityLog, AuditLog, DocumentSequence
from crm.models import Lead, LeadAssignmentHistory
from .score_service import ScoreService
from .timeline_service import TimelineService
from .duplicate_service import DuplicateService


class LeadService:

    # ─── Creation ────────────────────────────────────────────────────────────

    @classmethod
    @transaction.atomic
    def create_lead(cls, company, user, data: dict, override_duplicate: bool = False) -> Lead:
        """
        Creates a new lead with:
        - Lead number generation via DocumentSequence
        - Duplicate detection (mobile / email / company_name)
        - Auto-assign to default stage
        - Score calculation
        - Timeline event
        - ActivityLog entry
        """

        # ── Duplicate check ─────────────────────────────────────────────────
        duplicate_result = DuplicateService.check(company, data)
        if duplicate_result['has_duplicate'] and not override_duplicate:
            raise ValidationError({
                'duplicate': duplicate_result['message'],
                'existing_lead_id': str(duplicate_result['lead_id']),
                'can_override': True,
            })

        # ── Auto-assign default stage ────────────────────────────────────────
        if not data.get('stage'):
            from crm.models import LeadStage
            default_stage = LeadStage.objects.filter(
                company=company, is_default=True, is_active=True
            ).first() or LeadStage.objects.filter(
                company=company, is_active=True
            ).order_by('sequence').first()
            if default_stage:
                data['stage'] = default_stage

        # ── Generate lead number ─────────────────────────────────────────────
        lead_number = cls._generate_lead_number(company)

        # ── Create lead ──────────────────────────────────────────────────────
        lead = Lead.objects.create(
            company=company,
            lead_number=lead_number,
            created_by=user,
            updated_by=user,
            **{k: v for k, v in data.items() if k not in ('tags',)}
        )

        # M2M tags
        tags = data.get('tags', [])
        if tags:
            lead.tags.set(tags)

        # ── Flag duplicate if override ───────────────────────────────────────
        if duplicate_result['has_duplicate'] and override_duplicate:
            lead.is_duplicate = True
            lead.duplicate_of_id = duplicate_result['lead_id']
            lead.save(update_fields=['is_duplicate', 'duplicate_of'])

        # ── Score ────────────────────────────────────────────────────────────
        score = ScoreService.calculate(lead)
        lead.lead_score = score
        lead.save(update_fields=['lead_score'])

        # ── Timeline & Activity ──────────────────────────────────────────────
        TimelineService.lead_created(lead, user)
        ActivityLog.objects.create(
            company=company,
            user=user,
            activity_type='lead_created',
            description=f"Lead {lead.lead_number} ({lead.full_name}) created",
            related_model='Lead',
            related_object_id=lead.id,
        )

        return lead

    # ─── Update ──────────────────────────────────────────────────────────────

    @classmethod
    @transaction.atomic
    def update_lead(cls, lead: Lead, user, data: dict) -> Lead:
        """
        Partial update of lead fields.
        Writes AuditLog for changed fields.
        Recalculates score after update.
        """
        changed_fields = []
        old_values = {}

        tags = data.pop('tags', None)

        for field, new_value in data.items():
            old_value = getattr(lead, field, None)
            if str(old_value) != str(new_value):
                old_values[field] = str(old_value)
                setattr(lead, field, new_value)
                changed_fields.append(field)

        if changed_fields:
            lead.updated_by = user
            lead.save(update_fields=changed_fields + ['updated_at', 'updated_by'])

            AuditLog.objects.create(
                company=lead.company,
                user=user,
                action='UPDATE',
                model_name='Lead',
                object_id=lead.id,
                changes={field: {'old': old_values[field], 'new': str(getattr(lead, field))} for field in changed_fields},
            )

            TimelineService.lead_updated(lead, user, changed_fields)

        if tags is not None:
            lead.tags.set(tags)

        # Recalculate score
        lead.lead_score = ScoreService.calculate(lead)
        lead.save(update_fields=['lead_score'])

        return lead

    # ─── Stage Transition ────────────────────────────────────────────────────

    @classmethod
    @transaction.atomic
    def change_stage(cls, lead: Lead, user, new_stage, lost_reason=None, lost_notes: str = '') -> Lead:
        """
        Validated pipeline stage movement.
        - Won/Lost transitions update status and timestamps.
        - Lost requires a lost_reason.
        - Creates Timeline + ActivityLog + AuditLog entries.
        """
        from crm.models import LeadStage

        if lead.stage_id == getattr(new_stage, 'id', new_stage):
            raise ValidationError("Lead is already in this stage.")

        # Lost requires a reason
        if new_stage.is_lost and not lost_reason:
            raise ValidationError({'lost_reason': 'A lost reason is required when marking a lead as Lost.'})

        old_stage_name = lead.stage.name if lead.stage else 'None'
        old_status = lead.status

        lead.stage = new_stage
        update_fields = ['stage', 'updated_at', 'updated_by']
        lead.updated_by = user

        if new_stage.is_won:
            lead.mark_won()
        elif new_stage.is_lost:
            lead.lost_reason = lost_reason
            lead.lost_notes = lost_notes
            lead.mark_lost()
        else:
            lead.status = Lead.Status.IN_PROGRESS
            update_fields.append('status')
            lead.save(update_fields=update_fields)

        TimelineService.stage_changed(lead, user, old_stage_name, new_stage.name)
        ActivityLog.objects.create(
            company=lead.company,
            user=user,
            activity_type='stage_changed',
            description=f"Lead {lead.lead_number} moved from {old_stage_name} → {new_stage.name}",
            related_model='Lead',
            related_object_id=lead.id,
        )
        AuditLog.objects.create(
            company=lead.company,
            user=user,
            action='UPDATE',
            model_name='Lead',
            object_id=lead.id,
            changes={'stage': {'old': old_stage_name, 'new': new_stage.name},
                     'status': {'old': old_status, 'new': lead.status}},
        )

        # Recalculate score (stage contributes to score)
        lead.lead_score = ScoreService.calculate(lead)
        lead.save(update_fields=['lead_score'])

        return lead

    # ─── Assignment ──────────────────────────────────────────────────────────

    @classmethod
    @transaction.atomic
    def assign_lead(cls, lead: Lead, user, new_employee, reason: str = '') -> Lead:
        """
        Reassign a lead to a different employee.
        Writes LeadAssignmentHistory + Timeline + Notification.
        """
        from dashboard.services.notification_service import NotificationService

        old_employee = lead.assigned_to

        # History
        LeadAssignmentHistory.objects.create(
            lead=lead,
            from_employee=old_employee,
            to_employee=new_employee,
            changed_by=user,
            reason=reason,
        )

        lead.assigned_to = new_employee
        lead.updated_by = user
        lead.save(update_fields=['assigned_to', 'updated_at', 'updated_by'])

        TimelineService.lead_assigned(lead, user, old_employee, new_employee)

        # Notify new assignee
        if new_employee and hasattr(new_employee, 'user'):
            NotificationService.create_notification(
                user=new_employee.user,
                company=lead.company,
                title='Lead Assigned',
                message=f"Lead {lead.lead_number} ({lead.full_name}) has been assigned to you.",
                notification_type='lead',
                related_url=f'/crm/{lead.id}',
                related_module='crm',
                related_object_id=lead.id,
            )

        return lead

    # ─── Star Toggle ─────────────────────────────────────────────────────────

    @staticmethod
    def toggle_star(lead: Lead, user) -> Lead:
        lead.is_starred = not lead.is_starred
        lead.save(update_fields=['is_starred', 'updated_at'])
        return lead

    # ─── Soft Delete ─────────────────────────────────────────────────────────

    @staticmethod
    @transaction.atomic
    def delete_lead(lead: Lead, user):
        ActivityLog.objects.create(
            company=lead.company,
            user=user,
            activity_type='lead_deleted',
            description=f"Lead {lead.lead_number} ({lead.full_name}) deleted",
            related_model='Lead',
            related_object_id=lead.id,
        )
        lead.soft_delete()

    # ─── Bulk Actions ────────────────────────────────────────────────────────

    @classmethod
    @transaction.atomic
    def bulk_assign(cls, lead_ids: list, company, user, employee) -> int:
        """Reassign multiple leads in one transaction."""
        leads = Lead.objects.filter(id__in=lead_ids, company=company, is_active=True)
        count = leads.count()
        for lead in leads:
            cls.assign_lead(lead, user, employee)
        return count

    @classmethod
    @transaction.atomic
    def bulk_change_stage(cls, lead_ids: list, company, user, stage) -> int:
        leads = Lead.objects.filter(id__in=lead_ids, company=company, is_active=True)
        count = leads.count()
        for lead in leads:
            cls.change_stage(lead, user, stage)
        return count

    @staticmethod
    @transaction.atomic
    def bulk_delete(lead_ids: list, company, user) -> int:
        leads = Lead.objects.filter(id__in=lead_ids, company=company, is_active=True)
        count = leads.count()
        for lead in leads:
            lead.soft_delete()
        return count

    # ─── Helpers ─────────────────────────────────────────────────────────────

    @staticmethod
    def _generate_lead_number(company) -> str:
        try:
            seq_obj, _ = DocumentSequence.objects.get_or_create(
                company=company,
                entity_name='Lead',
                defaults={'prefix': 'LD', 'padding_length': 4, 'current_value': 0}
            )
            seq_obj.current_value += 1
            seq_obj.save(update_fields=['current_value'])
            padded = str(seq_obj.current_value).zfill(seq_obj.padding_length)
            prefix = seq_obj.prefix or 'LD'
            return f"{prefix}-{padded}"
        except Exception:
            import uuid
            return f"LD-{uuid.uuid4().hex[:8].upper()}"
