"""
Task Service
=============
Full CRUD + summary for dashboard Tasks.
Uses real DB queries — Task model lives in this app.
"""

from django.utils import timezone
from django.db.models import Q
from ..models import Task


class TaskService:

    @staticmethod
    def get_summary(user, company) -> dict:
        """Today's tasks, pending, completed counts for the current user."""
        today = timezone.localdate()
        base_qs = Task.objects.filter(company=company, assigned_to=user)

        today_tasks = base_qs.filter(due_date=today).exclude(status='completed')
        pending = base_qs.filter(status='pending')
        in_progress = base_qs.filter(status='in_progress')
        completed_today = base_qs.filter(status='completed', updated_at__date=today)

        return {
            'today_count': today_tasks.count(),
            'pending_count': pending.count(),
            'in_progress_count': in_progress.count(),
            'completed_today_count': completed_today.count(),
        }

    @staticmethod
    def get_tasks_for_user(user, company, filter_type='all') -> list:
        """
        Returns task list filtered by type.
        filter_type: 'all' | 'today' | 'pending' | 'completed'
        """
        today = timezone.localdate()
        base_qs = Task.objects.filter(company=company, assigned_to=user)

        if filter_type == 'today':
            qs = base_qs.filter(due_date=today).exclude(status='completed')
        elif filter_type == 'pending':
            qs = base_qs.filter(status='pending')
        elif filter_type == 'completed':
            qs = base_qs.filter(status='completed')
        else:
            qs = base_qs.exclude(status='completed').order_by('due_date', 'created_at')[:20]

        return list(qs.select_related('assigned_to', 'created_by'))

    @staticmethod
    def create_task(user, company, data: dict) -> Task:
        return Task.objects.create(
            company=company,
            created_by=user,
            assigned_to=data.get('assigned_to', user),
            title=data['title'],
            description=data.get('description', ''),
            due_date=data.get('due_date'),
            priority=data.get('priority', 'medium'),
            status='pending',
        )

    @staticmethod
    def update_task(task_id, user, company, data: dict) -> Task:
        task = Task.objects.get(id=task_id, company=company)
        for field in ['title', 'description', 'due_date', 'status', 'priority']:
            if field in data:
                setattr(task, field, data[field])
        task.save()
        return task

    @staticmethod
    def complete_task(task_id, user, company) -> Task:
        task = Task.objects.get(id=task_id, company=company)
        task.status = 'completed'
        task.save()
        return task

    @staticmethod
    def delete_task(task_id, user, company):
        Task.objects.filter(id=task_id, company=company).delete()
