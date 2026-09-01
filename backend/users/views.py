from django.conf import settings
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny, BasePermission
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import UserSerializer
from .models import LoginHistory, UserSession

class CookieTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        # First log the attempt
        email = request.data.get('email', '')
        client_ip = request.META.get('REMOTE_ADDR')
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        
        try:
            response = super().post(request, *args, **kwargs)
            
            # If successful, get tokens
            access_token = response.data.get('access')
            refresh_token = response.data.get('refresh')
            
            # Remove tokens from response body for security
            del response.data['access']
            del response.data['refresh']
            
            # Set cookies
            response.set_cookie(
                'access_token',
                access_token,
                max_age=settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds(),
                httponly=True,
                samesite='Lax',
                secure=not settings.DEBUG, # True in production
            )
            response.set_cookie(
                'refresh_token',
                refresh_token,
                max_age=settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds(),
                httponly=True,
                samesite='Lax',
                secure=not settings.DEBUG,
            )
            
            response.data['message'] = "Login successful"
            
            # Log successful login
            # Note: At this point, we don't have the user object directly from simplejwt without decoding the token or querying the DB.
            # But we can query the user based on the email.
            from .models import User
            user = User.objects.filter(email=email).first()
            if user:
                LoginHistory.objects.create(
                    user=user,
                    email_attempted=email,
                    ip_address=client_ip,
                    browser=user_agent,
                    is_success=True
                )
                
                # Create User Session
                # Decode the access token to get JTI
                from rest_framework_simplejwt.tokens import AccessToken
                token_obj = AccessToken(access_token)
                UserSession.objects.create(
                    user=user,
                    token_jti=token_obj['jti'],
                    ip_address=client_ip,
                    browser=user_agent,
                )
            
            return response
            
        except InvalidToken as e:
            LoginHistory.objects.create(
                email_attempted=email,
                ip_address=client_ip,
                browser=user_agent,
                is_success=False,
                failure_reason="Invalid credentials"
            )
            raise e

class CookieTokenRefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        # simplejwt expects 'refresh' in the request data, but we store it in a cookie.
        refresh_token = request.COOKIES.get('refresh_token')
        
        if refresh_token:
            request.data['refresh'] = refresh_token
            
        try:
            response = super().post(request, *args, **kwargs)
            
            access_token = response.data.get('access')
            if access_token:
                response.set_cookie(
                    'access_token',
                    access_token,
                    max_age=settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds(),
                    httponly=True,
                    samesite='Lax',
                    secure=not settings.DEBUG,
                )
                del response.data['access']
                
            # If token rotation is enabled, simplejwt might return a new refresh token
            new_refresh_token = response.data.get('refresh')
            if new_refresh_token:
                response.set_cookie(
                    'refresh_token',
                    new_refresh_token,
                    max_age=settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds(),
                    httponly=True,
                    samesite='Lax',
                    secure=not settings.DEBUG,
                )
                del response.data['refresh']
                
            response.data['message'] = "Token refreshed successfully"
            return response
            
        except TokenError as e:
            raise InvalidToken(e.args[0])

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.COOKIES.get('refresh_token')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            
            response = Response({"message": "Logout successful"}, status=status.HTTP_200_OK)
            response.delete_cookie('access_token')
            response.delete_cookie('refresh_token')
            
            # Update user session
            from django.utils import timezone
            sessions = UserSession.objects.filter(user=request.user, is_active=True)
            for session in sessions:
                session.is_active = False
                session.logout_time = timezone.now()
                session.save()
                
            return response
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


# ----------------- Sub-Phase 3.2 ViewSets -----------------

from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import (
    Company, CostCenter, Team, Branch, Department, Designation,
    Permission, Role, EmployeeProfile, EmployeeDocument, AttendanceRecord, SalaryRecord
)
from .serializers import (
    CompanySerializer, CostCenterSerializer, TeamSerializer, BranchSerializer,
    DepartmentSerializer, DesignationSerializer, PermissionSerializer, RoleSerializer,
    EmployeeProfileSerializer, EmployeeDocumentSerializer, AttendanceRecordSerializer, SalaryRecordSerializer
)


class IsCompanyAdministrator(BasePermission):
    """Allows payroll access to staff/superusers and company roles named Admin."""
    message = 'Salary management is available to administrators only.'

    def has_permission(self, request, view):
        if request.user.is_staff or request.user.is_superuser:
            return True
        role = getattr(getattr(request.user, 'employee_profile', None), 'role', None)
        return bool(role and role.name.strip().lower() in {'admin', 'administrator'})

class TenantModelViewSet(viewsets.ModelViewSet):
    """
    Base viewset that automatically filters queries by the current user's company
    and assigns the company upon creation.
    """
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    
    def get_queryset(self):
        # Allow superusers to see everything if needed, or strictly enforce tenant
        if not self.request.user.company:
            return self.queryset.none()
        return self.queryset.filter(company=self.request.user.company)

    def perform_create(self, serializer):
        serializer.save(company=self.request.user.company, created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


class CompanyViewSet(viewsets.ModelViewSet):
    """
    Companies are slightly different because a user belongs to one.
    Regular users can only view/edit their own company.
    """
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if not self.request.user.company:
            return Company.objects.none()
        return Company.objects.filter(id=self.request.user.company.id)


class CostCenterViewSet(TenantModelViewSet):
    queryset = CostCenter.objects.all()
    serializer_class = CostCenterSerializer
    search_fields = ['name', 'code']
    ordering_fields = ['name', 'code', 'created_at']

class TeamViewSet(TenantModelViewSet):
    queryset = Team.objects.all()
    serializer_class = TeamSerializer
    search_fields = ['name', 'code']
    ordering_fields = ['name', 'code', 'created_at']

class BranchViewSet(TenantModelViewSet):
    queryset = Branch.objects.all()
    serializer_class = BranchSerializer
    search_fields = ['name', 'code', 'city', 'state']
    ordering_fields = ['name', 'code', 'created_at']
    filterset_fields = ['is_active', 'state']

class DepartmentViewSet(TenantModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    search_fields = ['name', 'code']
    ordering_fields = ['name', 'code', 'created_at']
    filterset_fields = ['is_active']

class DesignationViewSet(TenantModelViewSet):
    queryset = Designation.objects.all()
    serializer_class = DesignationSerializer
    search_fields = ['name', 'code']
    ordering_fields = ['name', 'code', 'created_at']
    filterset_fields = ['is_active']

class RoleViewSet(TenantModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    filterset_fields = ['is_active']

class PermissionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Permissions are global master data.
    """
    queryset = Permission.objects.all()
    serializer_class = PermissionSerializer
    permission_classes = [IsAuthenticated]
    search_fields = ['code', 'module', 'description']
    filterset_fields = ['module']

class EmployeeProfileViewSet(TenantModelViewSet):
    queryset = EmployeeProfile.objects.select_related('department', 'designation', 'branch', 'role')
    serializer_class = EmployeeProfileSerializer
    search_fields = ['employee_code', 'first_name', 'last_name', 'email', 'mobile']
    ordering_fields = ['first_name', 'employee_code', 'joining_date']
    filterset_fields = ['is_active', 'employment_status', 'branch', 'department', 'designation']

    def perform_create(self, serializer):
        from common.services import NumberingService
        if not serializer.validated_data.get('employee_code'):
            employee_code = NumberingService.generate_next_number(self.request.user.company, 'Employee')
            serializer.save(company=self.request.user.company, created_by=self.request.user, employee_code=employee_code)
        else:
            super().perform_create(serializer)

class EmployeeDocumentViewSet(TenantModelViewSet):
    queryset = EmployeeDocument.objects.all()
    serializer_class = EmployeeDocumentSerializer
    filterset_fields = ['employee', 'document_type']


class AttendanceRecordViewSet(TenantModelViewSet):
    queryset = AttendanceRecord.objects.select_related('employee')
    serializer_class = AttendanceRecordSerializer
    permission_classes = [IsAuthenticated, IsCompanyAdministrator]
    filterset_fields = ['employee', 'date', 'status']
    ordering_fields = ['date', 'created_at']


class SalaryRecordViewSet(TenantModelViewSet):
    queryset = SalaryRecord.objects.select_related('employee')
    serializer_class = SalaryRecordSerializer
    permission_classes = [IsAuthenticated, IsCompanyAdministrator]
    filterset_fields = ['employee', 'month', 'payment_status']
    ordering_fields = ['month', 'created_at']
