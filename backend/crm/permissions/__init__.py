"""
CRM Permissions
===============
Granular permission classes using the existing RBAC system.
All permissions are dual-enforced (backend + frontend).
"""

from rest_framework.permissions import BasePermission


class CRMBasePermission(BasePermission):
    """
    Ensures the user has a company. No company → no CRM access.
    All CRM views inherit from this.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return bool(request.user.company)


class CanViewCRM(CRMBasePermission):
    """crm.view — Read leads, follow-ups, notes, timeline."""

    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        # All authenticated company users may view CRM
        return True

    def has_object_permission(self, request, view, obj):
        # Check company ownership on the object directly, or via lead FK
        obj_company = getattr(obj, 'company_id', None)
        if obj_company and str(obj_company) == str(request.user.company_id):
            return True
        lead = getattr(obj, 'lead', None)
        if lead is None:
            return True  # No lead to check, allow access
        return str(getattr(lead, 'company_id', None)) == str(request.user.company_id)


class CanCreateLead(CRMBasePermission):
    """crm.create"""

    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return _has_crm_permission(request.user, 'create')


class CanEditLead(CRMBasePermission):
    """crm.edit"""

    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return _has_crm_permission(request.user, 'edit')

    def has_object_permission(self, request, view, obj):
        lead = getattr(obj, 'lead', obj)
        if str(getattr(lead, 'company_id', None)) != str(request.user.company_id):
            return False
        # Sales exec can only edit leads assigned to them unless they have global edit
        if _has_crm_permission(request.user, 'edit_all'):
            return True
        return str(getattr(lead, 'assigned_to_id', None)) == str(_get_employee_id(request.user))


class CanDeleteLead(CRMBasePermission):
    """crm.delete"""

    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return _has_crm_permission(request.user, 'delete')


class CanAssignLead(CRMBasePermission):
    """crm.assign — Change the assigned employee."""

    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return _has_crm_permission(request.user, 'assign')


class CanExportCRM(CRMBasePermission):
    """crm.export"""

    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return _has_crm_permission(request.user, 'export')


class CanImportCRM(CRMBasePermission):
    """crm.import"""

    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return _has_crm_permission(request.user, 'import')


class CanConvertLead(CRMBasePermission):
    """crm.convert"""

    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return _has_crm_permission(request.user, 'convert')


# ─── Helpers ────────────────────────────────────────────────────────────────────

PERMISSION_ALIASES = {
    'view': ['crm.view', 'crm.view_lead'],
    'create': ['crm.create', 'crm.add_lead'],
    'edit': ['crm.edit', 'crm.change_lead'],
    'delete': ['crm.delete', 'crm.delete_lead'],
    'assign': ['crm.assign', 'crm.edit', 'crm.change_lead', 'crm.manage_settings'],
    'export': ['crm.export', 'crm.view', 'crm.view_lead', 'crm.manage_settings'],
    'import': ['crm.import', 'crm.create', 'crm.add_lead', 'crm.manage_settings'],
    'convert': ['crm.convert', 'crm.create', 'crm.add_lead', 'crm.edit', 'crm.change_lead', 'crm.manage_settings'],
}


def _has_crm_permission(user, codename: str) -> bool:
    """
    Check permission against the existing RBAC system.

    Lookup chain:
      User → EmployeeProfile → Role → Permissions

    Superusers and staff always pass.
    Users without an employee profile or role are denied.
    """
    if not user or not user.is_authenticated:
        return False

    if user.is_superuser or user.is_staff:
        return True

    try:
        employee = getattr(user, 'employee_profile', None)
        if not employee or not employee.role:
            return False

        target_codes = PERMISSION_ALIASES.get(codename, [f'crm.{codename}', codename])
        return employee.role.permissions.filter(code__in=target_codes).exists()
    except Exception:
        return False


def _get_employee_id(user):
    try:
        return user.employee_profile.id
    except Exception:
        return None

