from django.contrib import admin
from .models import SupportTicket, TicketComment


@admin.register(SupportTicket)
class SupportTicketAdmin(admin.ModelAdmin):
    list_display  = ['ticket_no', 'title', 'customer_name', 'priority', 'status', 'assigned_to', 'company']
    list_filter   = ['status', 'priority', 'company']
    search_fields = ['ticket_no', 'title', 'customer_name', 'customer_email']
    ordering      = ['-created_at']


@admin.register(TicketComment)
class TicketCommentAdmin(admin.ModelAdmin):
    list_display = ['ticket', 'created_by', 'is_internal', 'created_at']
    list_filter  = ['is_internal']
    ordering     = ['-created_at']
