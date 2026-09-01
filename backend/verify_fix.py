import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from customers.models import Customer
from users.models import User

user = User.objects.get(email='qa@greenedge.local')
print(f'User company ID: {user.company_id}')
suppliers = Customer.objects.filter(company=user.company, customer_type='business')
print(f'Suppliers visible: {suppliers.count()}')
print('\nAll suppliers:')
for s in suppliers.order_by('-created_at'):
    print(f'  - {s.name} ({s.customer_number})')
