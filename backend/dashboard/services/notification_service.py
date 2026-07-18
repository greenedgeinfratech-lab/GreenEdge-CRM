"""
Notification Service
====================
Manages user notifications within a company.
Notification model lives in this app.
"""

from django.utils import timezone
from ..models import Notification


class NotificationService:

    @staticmethod
    def get_unread_count(user, company) -> int:
        return Notification.objects.filter(
            user=user, company=company, is_read=False
        ).count()

    @staticmethod
    def get_recent(user, company, limit=15) -> list:
        return list(
            Notification.objects.filter(user=user, company=company)
            .order_by('-created_at')[:limit]
        )

    @staticmethod
    def mark_read(notification_id, user, company):
        Notification.objects.filter(
            id=notification_id, user=user, company=company
        ).update(is_read=True, read_at=timezone.now())

    @staticmethod
    def mark_all_read(user, company):
        Notification.objects.filter(
            user=user, company=company, is_read=False
        ).update(is_read=True, read_at=timezone.now())

    @staticmethod
    def create_notification(user, company, title, message,
                            notification_type='info', related_url=None,
                            related_module=None, related_object_id=None) -> Notification:
        return Notification.objects.create(
            user=user,
            company=company,
            title=title,
            message=message,
            notification_type=notification_type,
            related_url=related_url,
            related_module=related_module,
            related_object_id=related_object_id,
        )

    @staticmethod
    def get_summary(user, company) -> dict:
        """Returns unread count + last 5 notifications for dashboard header."""
        unread = NotificationService.get_unread_count(user, company)
        recent = NotificationService.get_recent(user, company, limit=5)
        return {
            'unread_count': unread,
            'recent': recent,
        }
