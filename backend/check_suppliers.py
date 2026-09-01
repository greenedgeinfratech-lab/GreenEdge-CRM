import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from users.models import Company, User
from customers.models import Customer

# Get the user's company
user = User.objects.get(email="qa@greenedge.local")
company = user.company

print(f"User: {user.email}")
print(f"Company: {company.name}")
print()

print(f"Total customers in company: {Customer.objects.filter(company=company).count()}")
print(f"Active customers in company: {Customer.objects.filter(company=company, is_active=True).count()}")
print(f"Business suppliers (active): {Customer.objects.filter(company=company, is_active=True, customer_type='business').count()}")
print(f"Business suppliers (all): {Customer.objects.filter(company=company, customer_type='business').count()}")
print()

print("Business suppliers (active, from user's company):")
for c in Customer.objects.filter(company=company, is_active=True, customer_type='business'):
    print(f"  - {c.name} (id: {c.id}, is_active: {c.is_active})")
print()

print("Business suppliers (all, from user's company):")
for c in Customer.objects.filter(company=company, customer_type='business'):
    print(f"  - {c.name} (id: {c.id}, is_active: {c.is_active})")
