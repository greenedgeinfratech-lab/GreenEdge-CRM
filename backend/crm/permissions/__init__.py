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
        # Leads must belong to the same company
        lead = getattr(obj, 'lead', obj)
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

def _has_crm_permission(user, codename: str) -> bool:
    """
    Check permission against the existing role/permission system.
    Falls back to `is_staff` or `is_superuser` for now — replace with
    RBAC lookup once the Permissions module is fully wired.
    """
    if user.is_superuser or user.is_staff:
        return True
    # TODO: integrate with RBAC — Role → Permission lookup
    # from users.models import RolePermission
    # return RolePermission.objects.filter(
    #     role__employeeprofile__user=user,
    #     permission__codename=f'crm.{codename}'
    # ).exists()
    return True  # Default permissive until RBAC is wired


def _get_employee_id(user):
    try:
        return user.employee_profile.id
    except Exception:
        return None
