import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from users.models import Company, User, Role
from crm.models import LeadStage
from rest_framework_simplejwt.tokens import RefreshToken

# 1. Create a Company
try:
    company = Company.objects.get(name="Test QA Company")
    print(f"✓ Using company: {company.name}")
except Company.DoesNotExist:
    company = Company.objects.create(
        name="Test QA Company",
        timezone="Asia/Kolkata",
        currency="INR"
    )
    print(f"✓ Created company: {company.name}")
except Company.MultipleObjectsReturned:
    company = Company.objects.filter(name="Test QA Company").first()
    print(f"✓ Using company: {company.name}")

from users.models import Permission

# 2. Get or create a Role with CRM permissions
try:
    role = Role.objects.get(company=company, name="CRM Admin")
    print(f"✓ Using role: {role.name}")
except Role.DoesNotExist:
    role = Role.objects.create(company=company, name="CRM Admin")
    print(f"✓ Created role: {role.name}")

perm_codes = ["crm.view_lead", "crm.add_lead", "crm.change_lead", "crm.delete_lead", "crm.manage_settings"]
perms = []
for code in perm_codes:
    p, _ = Permission.objects.get_or_create(code=code, defaults={'module': 'crm'})
    perms.append(p)
role.permissions.set(perms)

# 3. Create a User
user, user_created = User.objects.get_or_create(
    email="qa@greenedge.local",
    defaults={
        'company': company,
        'password': 'qa_password',  # This will be hashed by the create_user method
    }
)
if user_created:
    user.set_password('qa_password')
    user.save()
    print(f"✓ Created user: {user.email}")
else:
    print(f"⊘ User already exists: {user.email}")

# 4. Get or create Employee Profile
from users.models import EmployeeProfile
try:
    emp = EmployeeProfile.objects.get(user=user)
    print(f"✓ Using employee: {emp.first_name} {emp.last_name}")
except EmployeeProfile.DoesNotExist:
    emp = EmployeeProfile.objects.create(
        company=company,
        user=user,
        employee_code="QA-001",
        first_name="QA",
        last_name="Tester",
        email="qa@greenedge.local",
        role=role
    )
    print(f"✓ Created employee: {emp.first_name} {emp.last_name}")

# 4. Generate JWT Tokens for testing
refresh = RefreshToken.for_user(user)
access_token = str(refresh.access_token)

print(f"ACCESS_TOKEN={access_token}")
print(f"COMPANY_ID={company.id}")
print(f"USER_ID={user.id}")

# 5. Create test suppliers (customers with customer_type='business')
from customers.models import Customer
from common.services import NumberingService

supplier_data = [
    {
        'name': 'Acme Manufacturing Ltd.',
        'company_name': 'ACME',
        'customer_type': 'business',
        'status': 'active',
        'mobile': '9876543210',
        'email': 'contact@acme.com',
        'city': 'Mumbai',
        'state': 'Maharashtra',
        'gst_number': '27AABCT1234H1Z0',
        'address': '123 Industrial Area, Mumbai',
    },
    {
        'name': 'Global Supplies Co.',
        'company_name': 'Global Supplies',
        'customer_type': 'business',
        'status': 'active',
        'mobile': '9876543211',
        'email': 'sales@globalsupplies.com',
        'city': 'Bangalore',
        'state': 'Karnataka',
        'gst_number': '29AABCT5678H2Z0',
        'address': '456 Business Park, Bangalore',
    },
    {
        'name': 'Prime Traders',
        'company_name': 'Prime Trading',
        'customer_type': 'business',
        'status': 'active',
        'mobile': '9876543212',
        'email': 'info@primetraders.com',
        'city': 'Delhi',
        'state': 'Delhi',
        'gst_number': '07AABCT9012H3Z0',
        'address': '789 Market Street, Delhi',
    },
    {
        'name': 'Quality Imports Ltd.',
        'company_name': 'Quality Imports',
        'customer_type': 'business',
        'status': 'active',
        'mobile': '9876543213',
        'email': 'procurement@qualityimports.com',
        'city': 'Pune',
        'state': 'Maharashtra',
        'gst_number': '27AABCT3456H4Z0',
        'address': '321 Trade Zone, Pune',
    },
    {
        'name': 'Tech Distributors Inc.',
        'company_name': 'Tech Distributors',
        'customer_type': 'business',
        'status': 'active',
        'mobile': '9876543214',
        'email': 'support@techdist.com',
        'city': 'Hyderabad',
        'state': 'Telangana',
        'gst_number': '36AABCT7890H5Z0',
        'address': '654 Tech Park, Hyderabad',
    },
]

for data in supplier_data:
    supplier, created = Customer.objects.get_or_create(
        company=company,
        email=data['email'],
        defaults={
            'name': data['name'],
            'company_name': data['company_name'],
            'customer_type': data['customer_type'],
            'status': data['status'],
            'mobile': data['mobile'],
            'city': data['city'],
            'state': data['state'],
            'gst_number': data['gst_number'],
            'address': data['address'],
            'created_by': user,
            'updated_by': user,
            'assigned_to': emp,
        }
    )
    
    if created:
        # Generate customer number
        supplier.customer_number = NumberingService.generate_number(
            company=company,
            entity_name='Customer',
            prefix='CUST',
        )
        supplier.save(update_fields=['customer_number'])
        print(f"✓ Created supplier: {supplier.name} ({supplier.customer_number})")
    else:
        print(f"⊘ Supplier already exists: {supplier.name}")

# 6. Check if stages exist, if not we will let API auto-seed them during testing
