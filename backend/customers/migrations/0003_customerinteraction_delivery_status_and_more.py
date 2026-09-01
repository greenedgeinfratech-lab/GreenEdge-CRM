from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [('customers', '0002_customerinteraction')]

    operations = [
        migrations.AddField(
            model_name='customerinteraction', name='delivery_status',
            field=models.CharField(default='not_applicable', max_length=20),
        ),
        migrations.AddField(
            model_name='customerinteraction', name='delivery_error',
            field=models.TextField(blank=True, null=True),
        ),
    ]
