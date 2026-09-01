import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from users.models import User, Company
from customers.models import Customer
from crm.models import Lead

print('=== USERS ===')
for u in User.objects.all():
    print(u.email, 'company=', getattr(u.company, 'id', None), getattr(u.company, 'name', None))

print('\n=== COMPANIES ===')
for c in Company.objects.all():
    print(c.id, c.name)

print('\n=== COMPANY DATA ===')
for c in Company.objects.all():
    print('Company', c.id, c.name)
    print('  customers', Customer.objects.filter(company=c).count())
    print('  business customers', Customer.objects.filter(company=c, customer_type='business').count())
    print('  leads', Lead.objects.filter(company=c).count())
    print('')

print('=== SAMPLE LEADS ===')
for lead in Lead.objects.all()[:20]:
    print(lead.id, getattr(lead, 'full_name', getattr(lead, 'name', None)), getattr(lead, 'company', None))
