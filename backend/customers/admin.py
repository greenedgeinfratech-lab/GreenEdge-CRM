from django.contrib import admin
from customers.models import Customer, CustomerContact

@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ['customer_number', 'name', 'company_name', 'mobile', 'email', 'status', 'created_at']
    search_fields = ['customer_number', 'name', 'company_name', 'mobile', 'email']
    list_filter = ['status', 'customer_type', 'company']

@admin.register(CustomerContact)
class CustomerContactAdmin(admin.ModelAdmin):
    list_display = ['customer', 'name', 'designation', 'mobile', 'email', 'is_primary']
    list_filter = ['customer', 'is_primary']
