import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from users.models import Company, User, Role
from crm.models import LeadStage
from rest_framework_simplejwt.tokens import RefreshToken

# 1. Create a Company
company = Company.objects.create(
    name="Test QA Company",
    timezone="Asia/Kolkata",
    currency="INR"
)

from users.models import Permission

# 2. Create a Role with CRM permissions
role = Role.objects.create(
    company=company,
    name="CRM Admin"
)

perm_codes = ["crm.view_lead", "crm.add_lead", "crm.change_lead", "crm.delete_lead", "crm.manage_settings"]
perms = []
for code in perm_codes:
    p, _ = Permission.objects.get_or_create(code=code, defaults={'module': 'crm'})
    perms.append(p)
role.permissions.set(perms)

# 3. Create a User
user = User.objects.create_user(
    email="qa@greenedge.local",
    password="qa_password",
    company=company
)

# 4. Create Employee Profile
from users.models import EmployeeProfile
emp = EmployeeProfile.objects.create(
    company=company,
    user=user,
    employee_code="QA-001",
    first_name="QA",
    last_name="Tester",
    email="qa@greenedge.local",
    role=role
)

# 4. Generate JWT Tokens for testing
refresh = RefreshToken.for_user(user)
access_token = str(refresh.access_token)

print(f"ACCESS_TOKEN={access_token}")
print(f"COMPANY_ID={company.id}")
print(f"USER_ID={user.id}")

# 5. Check if stages exist, if not we will let API auto-seed them during testing
