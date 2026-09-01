# Generated manually for the Debit Note purchase module.

import uuid
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ('crm', '0011_invoice_invoiceitem'),
        ('users', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='DebitNote',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)), ('updated_at', models.DateTimeField(auto_now=True)),
                ('deleted_at', models.DateTimeField(blank=True, null=True)), ('is_active', models.BooleanField(default=True)),
                ('party_name', models.CharField(max_length=200)), ('address', models.TextField(blank=True, null=True)),
                ('debit_note_no', models.CharField(max_length=50)), ('reference', models.CharField(blank=True, max_length=100, null=True)),
                ('note_date', models.DateField()), ('due_date', models.DateField(blank=True, null=True)),
                ('supplier_ledger', models.CharField(blank=True, max_length=100, null=True)), ('pnl_ledger', models.CharField(blank=True, max_length=100, null=True)),
                ('voucher_no', models.CharField(blank=True, max_length=50, null=True)), ('voucher_date', models.DateField(blank=True, null=True)),
                ('notes', models.TextField(blank=True, null=True)), ('bank_details', models.CharField(blank=True, max_length=200, null=True)),
                ('terms_conditions', models.JSONField(blank=True, default=list)), ('share_email', models.BooleanField(default=False)),
                ('share_whatsapp', models.BooleanField(default=False)), ('print_after_save', models.BooleanField(default=False)),
                ('extra_charge', models.DecimalField(decimal_places=2, default=0, max_digits=12)), ('custom_discount', models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ('total_taxable', models.DecimalField(decimal_places=2, default=0, max_digits=14)), ('total_cgst', models.DecimalField(decimal_places=2, default=0, max_digits=14)),
                ('total_sgst', models.DecimalField(decimal_places=2, default=0, max_digits=14)), ('grand_total', models.DecimalField(decimal_places=2, default=0, max_digits=14)),
                ('company', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='%(app_label)s_%(class)s_related', to='users.company')),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(app_label)s_%(class)s_created', to=settings.AUTH_USER_MODEL)),
                ('updated_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(app_label)s_%(class)s_updated', to=settings.AUTH_USER_MODEL)),
                ('party', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='debit_notes', to='crm.lead')),
            ],
            options={'ordering': ['-created_at']},
        ),
        migrations.CreateModel(
            name='DebitNoteItem',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)), ('updated_at', models.DateTimeField(auto_now=True)),
                ('deleted_at', models.DateTimeField(blank=True, null=True)), ('is_active', models.BooleanField(default=True)),
                ('item_description', models.TextField()), ('hsn_sac', models.CharField(blank=True, max_length=50, null=True)),
                ('qty', models.DecimalField(decimal_places=2, default=1, max_digits=12)), ('unit', models.CharField(default='Nos', max_length=50)),
                ('rate', models.DecimalField(decimal_places=2, default=0, max_digits=12)), ('discount', models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ('taxable', models.DecimalField(decimal_places=2, default=0, max_digits=12)), ('cgst_percent', models.DecimalField(decimal_places=2, default=0, max_digits=5)),
                ('sgst_percent', models.DecimalField(decimal_places=2, default=0, max_digits=5)), ('cgst_amt', models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ('sgst_amt', models.DecimalField(decimal_places=2, default=0, max_digits=12)), ('amount', models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ('company', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='%(app_label)s_%(class)s_related', to='users.company')),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(app_label)s_%(class)s_created', to=settings.AUTH_USER_MODEL)),
                ('updated_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(app_label)s_%(class)s_updated', to=settings.AUTH_USER_MODEL)),
                ('debit_note', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='items', to='crm.debitnote')),
            ],
            options={'ordering': ['id']},
        ),
        migrations.AddConstraint(model_name='debitnote', constraint=models.UniqueConstraint(fields=('company', 'debit_note_no'), name='unique_debit_note_number_per_company')),
    ]
