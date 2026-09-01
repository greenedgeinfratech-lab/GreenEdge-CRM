"""
CRM Signals
============
Side effects triggered automatically by model events.

  lead_post_save    — Recalculate score when a lead is saved
  followup_post_save — Notify when a followup is overdue (via Celery in future)

Signal handlers are registered in CRMConfig.ready() via `import crm.signals`.
"""

from django.db.models.signals import post_save
from django.dispatch import receiver

from crm.models import Lead, LeadFollowup


@receiver(post_save, sender=Lead)
def lead_post_save(sender, instance, created, **kwargs):
    """
    After every lead save, schedule a score recalculation if the lead was
    materially changed (not just updated_at). For now runs synchronously;
    switch to Celery task when workers are available.
    """
    # Skip infinite loop — update_fields set means score was already calculated
    update_fields = kwargs.get('update_fields') or []
    if 'lead_score' in (update_fields or []):
        return

    # Only recalculate on create or specific field changes
    if created:
        return  # Score already calculated by LeadService.create_lead

    # Synchronous recalculation (switch to Celery task when workers are available)
    try:
        from crm.services.score_service import ScoreService
        new_score = ScoreService.calculate(instance)
        if new_score != instance.lead_score:
            Lead.objects.filter(pk=instance.pk).update(lead_score=new_score)
    except Exception:
        pass  # Don't break saves if scoring fails


@receiver(post_save, sender=LeadFollowup)
def followup_post_save(sender, instance, created, **kwargs):
    """
    When a new followup is created, check if a notification should fire.
    """
    if not created:
        return

    try:
        lead = instance.lead
        company = lead.company

        # Update lead's last contact date
        from django.utils import timezone
        Lead.objects.filter(pk=lead.pk).update(last_contact_date=timezone.localdate())
    except Exception:
        pass
