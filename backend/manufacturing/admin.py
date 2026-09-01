from django.contrib import admin
from .models import ProductionJob, JobActivity


@admin.register(ProductionJob)
class ProductionJobAdmin(admin.ModelAdmin):
    list_display = ['job_no', 'title', 'product_name', 'status', 'priority', 'due_date', 'company']
    list_filter  = ['status', 'priority', 'company']
    search_fields = ['job_no', 'title', 'product_name']
    ordering = ['-created_at']


@admin.register(JobActivity)
class JobActivityAdmin(admin.ModelAdmin):
    list_display = ['job', 'activity_type', 'timestamp', 'created_by']
    list_filter  = ['activity_type']
    ordering = ['-timestamp']
