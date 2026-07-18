from rest_framework import serializers
from .models import (
    User, Company, CostCenter, Team, Branch, Department, Designation,
    Permission, Role, EmployeeProfile, EmployeeDocument
)
from common.validators import validate_gstin, validate_pan, validate_cin, validate_mobile, validate_pincode

class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = '__all__'

class RoleSerializer(serializers.ModelSerializer):
    permissions = PermissionSerializer(many=True, read_only=True)
    permission_ids = serializers.PrimaryKeyRelatedField(
        queryset=Permission.objects.all(), 
        source='permissions', 
        many=True, 
        write_only=True,
        required=False
    )
    
    class Meta:
        model = Role
        fields = ['id', 'name', 'description', 'permissions', 'permission_ids', 'created_at', 'updated_at', 'is_active']
        read_only_fields = ['id', 'created_at', 'updated_at']

class CompanySerializer(serializers.ModelSerializer):
    tax_id = serializers.CharField(validators=[validate_gstin], required=False, allow_blank=True)
    pan_number = serializers.CharField(validators=[validate_pan], required=False, allow_blank=True)
    cin_number = serializers.CharField(validators=[validate_cin], required=False, allow_blank=True)
    phone = serializers.CharField(validators=[validate_mobile], required=False, allow_blank=True)
    pincode = serializers.CharField(validators=[validate_pincode], required=False, allow_blank=True)

    class Meta:
        model = Company
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by', 'updated_by']

class CostCenterSerializer(serializers.ModelSerializer):
    class Meta:
        model = CostCenter
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

class TeamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Team
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

class BranchSerializer(serializers.ModelSerializer):
    gst_registration = serializers.CharField(validators=[validate_gstin], required=False, allow_blank=True)
    phone = serializers.CharField(validators=[validate_mobile], required=False, allow_blank=True)

    class Meta:
        model = Branch
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

class DesignationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Designation
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

class EmployeeDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeDocument
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

class EmployeeProfileSerializer(serializers.ModelSerializer):
    mobile = serializers.CharField(validators=[validate_mobile], required=False, allow_blank=True)
    
    # Nested fields for read operations
    department_details = DepartmentSerializer(source='department', read_only=True)
    designation_details = DesignationSerializer(source='designation', read_only=True)
    branch_details = BranchSerializer(source='branch', read_only=True)
    role_details = RoleSerializer(source='role', read_only=True)
    
    documents = EmployeeDocumentSerializer(many=True, read_only=True)

    class Meta:
        model = EmployeeProfile
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

class UserSerializer(serializers.ModelSerializer):
    company = CompanySerializer(read_only=True)
    employee_profile = EmployeeProfileSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'phone_number', 'profile_picture', 'company', 'employee_profile', 'is_active', 'date_joined']
        read_only_fields = ['id', 'email', 'is_active', 'date_joined']
