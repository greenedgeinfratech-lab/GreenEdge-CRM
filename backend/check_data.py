import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from users.models import Company, User
from customers.models import Customer

print("=" * 60)
print("COMPANIES")
print("=" * 60)
for c in Company.objects.all():
    print(f"ID: {c.id}")
    print(f"Name: {c.name}")
    print()

print("=" * 60)
print("USERS")
print("=" * 60)
for u in User.objects.all():
    print(f"ID: {u.id}")
    print(f"Email: {u.email}")
    print(f"Company: {u.company.name if u.company else 'None'}")
    print()

print("=" * 60)
print("SUPPLIERS (customer_type='business')")
print("=" * 60)
for c in Customer.objects.filter(customer_type='business'):
    print(f"ID: {c.id}")
    print(f"Name: {c.name}")
    print(f"Company: {c.company.name if c.company else 'None'}")
    print(f"Status: {c.status}")
    print()
