from django.core.management.base import BaseCommand
from users.models import Permission

class Command(BaseCommand):
    help = 'Seeds the database with default system permissions'

    def handle(self, *args, **kwargs):
        permissions = [
            # Settings & Organization
            {'code': 'settings.view', 'module': 'Settings', 'description': 'View company and system settings'},
            {'code': 'settings.manage', 'module': 'Settings', 'description': 'Manage company and system settings'},
            
            {'code': 'branches.view', 'module': 'Organization', 'description': 'View branches'},
            {'code': 'branches.manage', 'module': 'Organization', 'description': 'Create, edit, and delete branches'},
            
            {'code': 'departments.view', 'module': 'Organization', 'description': 'View departments'},
            {'code': 'departments.manage', 'module': 'Organization', 'description': 'Manage departments'},
            
            {'code': 'designations.view', 'module': 'Organization', 'description': 'View designations'},
            {'code': 'designations.manage', 'module': 'Organization', 'description': 'Manage designations'},
            
            # Roles & Permissions
            {'code': 'roles.view', 'module': 'Security', 'description': 'View roles and permissions'},
            {'code': 'roles.manage', 'module': 'Security', 'description': 'Manage roles and assign permissions'},
            
            # Employees
            {'code': 'employees.view', 'module': 'HR', 'description': 'View employee profiles'},
            {'code': 'employees.manage', 'module': 'HR', 'description': 'Manage employee profiles'},
            
            # CRM
            {'code': 'crm.view', 'module': 'CRM', 'description': 'View leads, contacts, and customers'},
            {'code': 'crm.create', 'module': 'CRM', 'description': 'Create CRM entities'},
            {'code': 'crm.edit', 'module': 'CRM', 'description': 'Edit CRM entities'},
            {'code': 'crm.delete', 'module': 'CRM', 'description': 'Delete CRM entities'},
            
            # Sales
            {'code': 'quotations.view', 'module': 'Sales', 'description': 'View quotations'},
            {'code': 'quotations.create', 'module': 'Sales', 'description': 'Create quotations'},
            {'code': 'quotations.approve', 'module': 'Sales', 'description': 'Approve quotations'},
            
            # Inventory
            {'code': 'inventory.view', 'module': 'Inventory', 'description': 'View inventory items and stock'},
            {'code': 'inventory.transfer', 'module': 'Inventory', 'description': 'Transfer stock between branches'},
        ]

        count = 0
        for perm in permissions:
            obj, created = Permission.objects.get_or_create(
                code=perm['code'],
                defaults={
                    'module': perm['module'],
                    'description': perm['description']
                }
            )
            if created:
                count += 1
                
        self.stdout.write(self.style.SUCCESS(f'Successfully seeded {count} new permissions.'))
