from django.urls import path
from .views import (
    DashboardView,
    TaskListCreateView, TaskDetailView, TaskCompleteView,
    NotificationListView, NotificationMarkReadView, NotificationMarkAllReadView,
    GlobalSearchView,
)

urlpatterns = [
    # Main dashboard (single request)
    path('', DashboardView.as_view(), name='dashboard'),

    # Tasks
    path('tasks/', TaskListCreateView.as_view(), name='dashboard-tasks'),
    path('tasks/<uuid:task_id>/', TaskDetailView.as_view(), name='dashboard-task-detail'),
    path('tasks/<uuid:task_id>/complete/', TaskCompleteView.as_view(), name='dashboard-task-complete'),

    # Notifications
    path('notifications/', NotificationListView.as_view(), name='dashboard-notifications'),
    path('notifications/read-all/', NotificationMarkAllReadView.as_view(), name='dashboard-notifications-read-all'),
    path('notifications/<uuid:notification_id>/read/', NotificationMarkReadView.as_view(), name='dashboard-notification-read'),

    # Global search
    path('search/', GlobalSearchView.as_view(), name='dashboard-search'),
]
