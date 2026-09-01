"""
Import / Export Service
========================
Handles bulk CSV import and export of leads.

Import:
  - Reads CSV rows
  - Validates each row
  - Detects and handles duplicates (skips or flags)
  - Uses bulk_create for performance
  - Returns a detailed result report

Export:
  - Streams CSV response with full lead data
  - Applies current filters (same queryset as list view)
"""

import csv
import io
from django.db import transaction
from django.http import StreamingHttpResponse


# ── CSV Column Mapping ────────────────────────────────────────────────────────

EXPORT_COLUMNS = [
    ('lead_number',       'Lead Number'),
    ('first_name',        'First Name'),
    ('last_name',         'Last Name'),
    ('company_name',      'Company'),
    ('mobile',            'Mobile'),
    ('alternate_mobile',  'Alt Mobile'),
    ('email',             'Email'),
    ('city',              'City'),
    ('state',             'State'),
    ('country',           'Country'),
    ('estimated_value',   'Estimated Value (₹)'),
    ('priority',          'Priority'),
    ('status',            'Status'),
    ('stage',             'Stage'),
    ('source',            'Source'),
    ('assigned_to',       'Assigned To'),
    ('lead_score',        'Score'),
    ('next_followup_date', 'Next Follow-up'),
    ('product_interested', 'Product'),
    ('requirements',      'Requirements'),
    ('created_at',        'Created At'),
]

IMPORT_REQUIRED_FIELDS = ['first_name', 'mobile']
IMPORT_FIELD_MAP = {
    'First Name': 'first_name',
    'first_name': 'first_name',
    'FirstName': 'first_name',
    'Name': 'first_name',
    'Last Name': 'last_name',
    'last_name': 'last_name',
    'LastName': 'last_name',
    'Company': 'company_name',
    'company_name': 'company_name',
    'Company Name': 'company_name',
    'Mobile': 'mobile',
    'mobile': 'mobile',
    'Mobile Number': 'mobile',
    'Phone': 'mobile',
    'Phone Number': 'mobile',
    'Alt Mobile': 'alternate_mobile',
    'alternate_mobile': 'alternate_mobile',
    'Email': 'email',
    'email': 'email',
    'City': 'city',
    'city': 'city',
    'State': 'state',
    'state': 'state',
    'Country': 'country',
    'country': 'country',
    'Estimated Value': 'estimated_value',
    'estimated_value': 'estimated_value',
    'Priority': 'priority',
    'priority': 'priority',
    'Product': 'product_interested',
    'product_interested': 'product_interested',
    'Requirements': 'requirements',
    'requirements': 'requirements',
}


class ImportExportService:

    # ── Export ────────────────────────────────────────────────────────────────

    @staticmethod
    def export_csv(queryset) -> StreamingHttpResponse:
        """
        Stream a CSV file with all leads from queryset.
        Uses Python's csv module — does NOT load all rows into memory at once.
        """
        headers = [col[1] for col in EXPORT_COLUMNS]

        def _get_cell(lead, field):
            value = getattr(lead, field, '')
            if field == 'stage':
                return getattr(lead.stage, 'name', '') if lead.stage else ''
            if field == 'source':
                return getattr(lead.source, 'name', '') if lead.source else ''
            if field == 'assigned_to':
                emp = lead.assigned_to
                if emp:
                    return f"{getattr(emp, 'first_name', '')} {getattr(emp, 'last_name', '')}".strip()
                return ''
            if hasattr(value, 'isoformat'):
                return value.isoformat()
            return str(value) if value is not None else ''

        def _rows():
            yield headers
            for lead in queryset.select_related('stage', 'source', 'assigned_to').iterator(chunk_size=500):
                yield [_get_cell(lead, field) for field, _ in EXPORT_COLUMNS]

        class EchoWriter:
            def write(self, value):
                return value

        pseudo_buffer = EchoWriter()

        def _stream():
            writer = csv.writer(pseudo_buffer)
            for row in _rows():
                yield writer.writerow(row)

        response = StreamingHttpResponse(_stream(), content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="leads_export.csv"'
        return response

    # ── Import ────────────────────────────────────────────────────────────────

    @classmethod
    def import_csv(cls, company, user, file_obj) -> dict:
        """
        Parse a CSV file and create leads.

        Returns:
        {
            'imported': int,
            'skipped': int,
            'errors': list[{row, reason}],
            'duplicates': list[{row, existing_lead_id}],
        }
        """
        from crm.models import Lead, LeadStage, LeadSource
        from crm.services.duplicate_service import DuplicateService

        decoded = file_obj.read().decode('utf-8-sig')
        reader = csv.DictReader(io.StringIO(decoded))

        # Build lookup caches to avoid N+1 on FK resolution
        stage_cache = {s.name.lower(): s for s in LeadStage.objects.filter(company=company, is_active=True)}
        source_cache = {s.name.lower(): s for s in LeadSource.objects.filter(company=company, is_active=True)}

        # Get or create default stage
        default_stage = (
            LeadStage.objects.filter(company=company, is_default=True, is_active=True).first()
            or LeadStage.objects.filter(company=company, is_active=True).order_by('sequence').first()
        )

        from common.models import DocumentSequence
        seq_obj, _ = DocumentSequence.objects.get_or_create(
            company=company, entity_name='Lead',
            defaults={'prefix': 'LD', 'padding_length': 4, 'current_value': 0}
        )

        to_create = []
        errors = []
        duplicates = []
        skipped = 0

        for row_num, row in enumerate(reader, start=2):
            # Map CSV headers to field names
            data = {}
            for csv_header, field_name in IMPORT_FIELD_MAP.items():
                val = (row.get(csv_header) or '').strip()
                if val:
                    data[field_name] = val

            # Validate required
            missing = [f for f in IMPORT_REQUIRED_FIELDS if not data.get(f)]
            if missing:
                errors.append({'row': row_num, 'reason': f"Missing required fields: {', '.join(missing)}"})
                skipped += 1
                continue

            # Duplicate check
            dup = DuplicateService.check(company, data)
            if dup['has_duplicate']:
                duplicates.append({'row': row_num, 'existing_lead_id': str(dup['lead_id']), 'reason': dup['message']})
                skipped += 1
                continue

            # Resolve FKs
            stage_raw = (row.get('Stage') or '').strip().lower()
            source_raw = (row.get('Source') or '').strip().lower()

            seq_obj.current_value += 1
            padded = str(seq_obj.current_value).zfill(seq_obj.padding_length)
            lead_number = f"{seq_obj.prefix or 'LD'}-{padded}"

            to_create.append(Lead(
                company=company,
                lead_number=lead_number,
                stage=stage_cache.get(stage_raw, default_stage),
                source=source_cache.get(source_raw),
                created_by=user,
                updated_by=user,
                **data,
            ))

        # Bulk create
        with transaction.atomic():
            if to_create:
                seq_obj.save(update_fields=['current_value'])
                Lead.objects.bulk_create(to_create, batch_size=500)

        return {
            'imported': len(to_create),
            'skipped': skipped,
            'errors': errors,
            'duplicates': duplicates,
        }
