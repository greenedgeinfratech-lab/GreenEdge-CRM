import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from common.models import BaseModel, TenantBaseModel

class Company(BaseModel):
    name = models.CharField(max_length=255)
    legal_name = models.CharField(max_length=255, null=True, blank=True)
    registration_number = models.CharField(max_length=100, null=True, blank=True) # Could be GST/Reg
    tax_id = models.CharField(max_length=100, null=True, blank=True) # GSTIN
    pan_number = models.CharField(max_length=20, null=True, blank=True)
    cin_number = models.CharField(max_length=50, null=True, blank=True)
    msme_registration = models.CharField(max_length=100, null=True, blank=True)
    
    website = models.URLField(null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    phone = models.CharField(max_length=50, null=True, blank=True)
    
    address = models.TextField(null=True, blank=True)
    city = models.CharField(max_length=100, null=True, blank=True)
    state = models.CharField(max_length=100, null=True, blank=True)
    country = models.CharField(max_length=100, null=True, blank=True)
    pincode = models.CharField(max_length=20, null=True, blank=True)
    
    timezone = models.CharField(max_length=50, default='UTC')
    currency = models.CharField(max_length=10, default='USD')
    financial_year = models.CharField(max_length=20, null=True, blank=True)
    default_gst_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    
    status = models.CharField(max_length=50, default='Active')
    logo = models.ImageField(upload_to='company_logos/', null=True, blank=True)
    
    def __str__(self):
        return self.name

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
            
        return self.create_user(email, password, **extra_fields)

class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = None
    email = models.EmailField('email address', unique=True)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, null=True, blank=True, related_name='users')
    
    phone_number = models.CharField(max_length=20, null=True, blank=True)
    profile_picture = models.ImageField(upload_to='profile_pictures/', null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []
    objects = CustomUserManager()
    
    def __str__(self):
        return self.email

class UserSession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions')
    token_jti = models.CharField(max_length=255, unique=True, help_text="JWT Token ID")
    login_time = models.DateTimeField(auto_now_add=True)
    logout_time = models.DateTimeField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    browser = models.CharField(max_length=255, null=True, blank=True)
    device = models.CharField(max_length=255, null=True, blank=True)
    os = models.CharField(max_length=255, null=True, blank=True)
    city = models.CharField(max_length=255, null=True, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.user.email} - {self.login_time}"

class LoginHistory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='login_history')
    email_attempted = models.CharField(max_length=255)
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    browser = models.CharField(max_length=255, null=True, blank=True)
    device = models.CharField(max_length=255, null=True, blank=True)
    is_success = models.BooleanField(default=False)
    failure_reason = models.CharField(max_length=255, null=True, blank=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        status = "Success" if self.is_success else "Failed"
        return f"{self.email_attempted} - {status} at {self.timestamp}"

# ----------------- Sub-Phase 3.2 Organization Entities -----------------

class CostCenter(TenantBaseModel):
    code = models.CharField(max_length=50)
    name = models.CharField(max_length=255)
    
    class Meta:
        unique_together = ('company', 'code')

class Team(TenantBaseModel):
    code = models.CharField(max_length=50)
    name = models.CharField(max_length=255)

    class Meta:
        unique_together = ('company', 'code')

class Branch(TenantBaseModel):
    code = models.CharField(max_length=50)
    name = models.CharField(max_length=255)
    address = models.TextField(null=True, blank=True)
    city = models.CharField(max_length=100, null=True, blank=True)
    state = models.CharField(max_length=100, null=True, blank=True)
    gst_registration = models.CharField(max_length=100, null=True, blank=True)
    phone = models.CharField(max_length=50, null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    manager = models.ForeignKey('EmployeeProfile', on_delete=models.SET_NULL, null=True, blank=True, related_name='managed_branches')

    class Meta:
        unique_together = ('company', 'code')

class Department(TenantBaseModel):
    code = models.CharField(max_length=50)
    name = models.CharField(max_length=255)

    class Meta:
        unique_together = ('company', 'name')

class Designation(TenantBaseModel):
    code = models.CharField(max_length=50)
    name = models.CharField(max_length=255)

    class Meta:
        unique_together = ('company', 'name')

class Permission(models.Model):
    """
    Global system permissions available to be assigned to roles.
    e.g., 'crm.view', 'invoices.create'
    """
    code = models.CharField(max_length=100, unique=True)
    module = models.CharField(max_length=100)
    description = models.CharField(max_length=255)
    
    def __str__(self):
        return self.code

class Role(TenantBaseModel):
    name = models.CharField(max_length=100)
    description = models.TextField(null=True, blank=True)
    permissions = models.ManyToManyField(Permission, related_name='roles', blank=True)

    class Meta:
        unique_together = ('company', 'name')

class EmployeeProfile(TenantBaseModel):
    EMPLOYMENT_STATUS_CHOICES = [
        ('Active', 'Active'),
        ('On Leave', 'On Leave'),
        ('Terminated', 'Terminated'),
        ('Resigned', 'Resigned'),
        ('Probation', 'Probation'),
    ]
    WORK_LOCATION_CHOICES = [
        ('Office', 'Office'),
        ('Remote', 'Remote'),
        ('Hybrid', 'Hybrid'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='employee_profile', null=True, blank=True)
    employee_code = models.CharField(max_length=50)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField()
    mobile = models.CharField(max_length=20, null=True, blank=True)
    gender = models.CharField(max_length=20, null=True, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    joining_date = models.DateField(null=True, blank=True)
    
    employment_type = models.CharField(max_length=100, null=True, blank=True) # Will use Master Data later
    employment_status = models.CharField(max_length=50, choices=EMPLOYMENT_STATUS_CHOICES, default='Active')
    work_location = models.CharField(max_length=50, choices=WORK_LOCATION_CHOICES, default='Office')
    
    cost_center = models.ForeignKey(CostCenter, on_delete=models.SET_NULL, null=True, blank=True)
    team = models.ForeignKey(Team, on_delete=models.SET_NULL, null=True, blank=True)
    branch = models.ForeignKey(Branch, on_delete=models.SET_NULL, null=True, blank=True)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True)
    designation = models.ForeignKey(Designation, on_delete=models.SET_NULL, null=True, blank=True)
    role = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True, blank=True)
    
    reporting_manager = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='subordinates')
    approval_manager = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='approval_subordinates')
    
    emergency_contact = models.TextField(null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    notes = models.TextField(null=True, blank=True)
    
    class Meta:
        unique_together = ('company', 'employee_code')


class AttendanceRecord(TenantBaseModel):
    """A daily attendance entry for an employee."""
    STATUS_CHOICES = [
        ('Present', 'Present'),
        ('Absent', 'Absent'),
        ('Half Day', 'Half Day'),
        ('Leave', 'Leave'),
        ('Holiday', 'Holiday'),
    ]

    employee = models.ForeignKey(EmployeeProfile, on_delete=models.CASCADE, related_name='attendance_records')
    date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Present')
    check_in = models.TimeField(null=True, blank=True)
    check_out = models.TimeField(null=True, blank=True)
    notes = models.TextField(null=True, blank=True)

    class Meta:
        ordering = ['-date', 'employee__first_name']
        unique_together = ('company', 'employee', 'date')


class SalaryRecord(TenantBaseModel):
    """Monthly payroll record. Net salary is derived from the salary components."""
    PAYMENT_STATUS_CHOICES = [
        ('Draft', 'Draft'),
        ('Processed', 'Processed'),
        ('Paid', 'Paid'),
    ]

    employee = models.ForeignKey(EmployeeProfile, on_delete=models.CASCADE, related_name='salary_records')
    month = models.DateField(help_text='Use the first day of the payroll month.')
    basic_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    allowances = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    deductions = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    net_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='Draft')
    paid_on = models.DateField(null=True, blank=True)
    notes = models.TextField(null=True, blank=True)

    class Meta:
        ordering = ['-month', 'employee__first_name']
        unique_together = ('company', 'employee', 'month')

    def save(self, *args, **kwargs):
        self.net_salary = self.basic_salary + self.allowances - self.deductions
        super().save(*args, **kwargs)

class EmployeeDocument(TenantBaseModel):
    employee = models.ForeignKey(EmployeeProfile, on_delete=models.CASCADE, related_name='documents')
    document_type = models.CharField(max_length=100) # e.g., Offer Letter, ID Proof
    file_path = models.CharField(max_length=255) # Path in FileUploadService
    
    def __str__(self):
        return f"{self.employee.employee_code} - {self.document_type}"
