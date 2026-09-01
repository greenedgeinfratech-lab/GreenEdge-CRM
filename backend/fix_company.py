import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from users.models import User, EmployeeProfile
from users.models import Company
from customers.models import Customer
from crm.models import Lead

user = User.objects.get(email='qa@greenedge.local')
print('Current user company before:', user.company_id)

companies = Company.objects.all()
best = None
best_score = -1
for c in companies:
    leads = Lead.objects.filter(company=c).count()
    customers = Customer.objects.filter(company=c).count()
    score = leads + customers
    print('company', c.id, 'name', c.name, 'leads', leads, 'customers', customers, 'score', score)
    if score > best_score:
        best_score = score
        best = c

print('Best company selected:', best.id, best.name, 'score', best_score)

user.company = best
user.save()
print('Updated user company to', user.company_id)

try:
    emp = EmployeeProfile.objects.get(user=user)
    emp.company = best
    emp.save()
    print('Updated employee profile company to', emp.company_id)
except EmployeeProfile.DoesNotExist:
    print('No EmployeeProfile found for user')

print('Verification:')
print('user company', user.company_id)
print('business customers in user company', Customer.objects.filter(company=user.company, customer_type='business').count())
print('leads in user company', Lead.objects.filter(company=user.company).count())
