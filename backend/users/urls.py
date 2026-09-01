from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CookieTokenObtainPairView, CookieTokenRefreshView, LogoutView, CurrentUserView,
    CompanyViewSet, CostCenterViewSet, TeamViewSet, BranchViewSet, DepartmentViewSet,
    DesignationViewSet, RoleViewSet, PermissionViewSet, EmployeeProfileViewSet, EmployeeDocumentViewSet,
    AttendanceRecordViewSet, SalaryRecordViewSet
)

router = DefaultRouter()
router.register(r'companies', CompanyViewSet, basename='company')
router.register(r'cost-centers', CostCenterViewSet, basename='costcenter')
router.register(r'teams', TeamViewSet, basename='team')
router.register(r'branches', BranchViewSet, basename='branch')
router.register(r'departments', DepartmentViewSet, basename='department')
router.register(r'designations', DesignationViewSet, basename='designation')
router.register(r'roles', RoleViewSet, basename='role')
router.register(r'permissions', PermissionViewSet, basename='permission')
router.register(r'employees', EmployeeProfileViewSet, basename='employeeprofile')
router.register(r'employee-documents', EmployeeDocumentViewSet, basename='employeedocument')
router.register(r'attendance', AttendanceRecordViewSet, basename='attendance')
router.register(r'salaries', SalaryRecordViewSet, basename='salary')

urlpatterns = [
    path('auth/login/', CookieTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', CookieTokenRefreshView.as_view(), name='token_refresh'),
    path('auth/logout/', LogoutView.as_view(), name='auth_logout'),
    path('auth/me/', CurrentUserView.as_view(), name='auth_me'),
    path('', include(router.urls)),
]
