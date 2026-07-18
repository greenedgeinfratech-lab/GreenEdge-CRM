from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema

from .services.dashboard_service import DashboardService
from .services.task_service import TaskService
from .services.notification_service import NotificationService
from .services.search_service import SearchService
from .serializers import TaskSerializer, TaskCreateSerializer, NotificationSerializer
from .models import Task, Notification


class DashboardView(APIView):
    """
    GET /api/v1/dashboard/
    Returns the complete dashboard payload in a single request.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Get complete dashboard data",
        description="Single endpoint that returns all dashboard widget data. "
                    "Performs one DB round-trip per widget service. "
                    "Each widget section fails independently.",
        tags=["Dashboard"],
    )
    def get(self, request):
        if not request.user.company:
            return Response(
                {"detail": "No company associated with this account."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        data = DashboardService.get_dashboard(request.user)
        return Response(data)


# ---------- Task Endpoints ----------

class TaskListCreateView(APIView):
    """GET /api/v1/dashboard/tasks/ — list tasks for current user"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        company = request.user.company
        if not company:
            return Response({'tasks': []})
        filter_type = request.query_params.get('filter', 'all')
        tasks = TaskService.get_tasks_for_user(request.user, company, filter_type)
        serializer = TaskSerializer(tasks, many=True)
        return Response({'tasks': serializer.data})

    def post(self, request):
        company = request.user.company
        if not company:
            return Response({'detail': 'No company.'}, status=status.HTTP_400_BAD_REQUEST)
        serializer = TaskCreateSerializer(data=request.data)
        if serializer.is_valid():
            task = TaskService.create_task(request.user, company, serializer.validated_data)
            return Response(TaskSerializer(task).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TaskDetailView(APIView):
    """PATCH/DELETE /api/v1/dashboard/tasks/<id>/"""
    permission_classes = [IsAuthenticated]

    def patch(self, request, task_id):
        company = request.user.company
        try:
            task = TaskService.update_task(task_id, request.user, company, request.data)
            return Response(TaskSerializer(task).data)
        except Task.DoesNotExist:
            return Response({'detail': 'Task not found.'}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, task_id):
        company = request.user.company
        TaskService.delete_task(task_id, request.user, company)
        return Response(status=status.HTTP_204_NO_CONTENT)


class TaskCompleteView(APIView):
    """POST /api/v1/dashboard/tasks/<id>/complete/"""
    permission_classes = [IsAuthenticated]

    def post(self, request, task_id):
        company = request.user.company
        try:
            task = TaskService.complete_task(task_id, request.user, company)
            return Response(TaskSerializer(task).data)
        except Task.DoesNotExist:
            return Response({'detail': 'Task not found.'}, status=status.HTTP_404_NOT_FOUND)


# ---------- Notification Endpoints ----------

class NotificationListView(APIView):
    """GET /api/v1/dashboard/notifications/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        company = request.user.company
        if not company:
            return Response({'notifications': [], 'unread_count': 0})
        limit = int(request.query_params.get('limit', 15))
        notifications = NotificationService.get_recent(request.user, company, limit)
        unread = NotificationService.get_unread_count(request.user, company)
        return Response({
            'notifications': NotificationSerializer(notifications, many=True).data,
            'unread_count': unread,
        })


class NotificationMarkReadView(APIView):
    """POST /api/v1/dashboard/notifications/<id>/read/"""
    permission_classes = [IsAuthenticated]

    def post(self, request, notification_id):
        company = request.user.company
        NotificationService.mark_read(notification_id, request.user, company)
        return Response({'detail': 'Marked as read.'})


class NotificationMarkAllReadView(APIView):
    """POST /api/v1/dashboard/notifications/read-all/"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        company = request.user.company
        if company:
            NotificationService.mark_all_read(request.user, company)
        return Response({'detail': 'All notifications marked as read.'})


# ---------- Global Search ----------

class GlobalSearchView(APIView):
    """GET /api/v1/dashboard/search/?q=..."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = request.query_params.get('q', '').strip()
        company = request.user.company
        if not query or not company:
            return Response({'results': {}})
        results = SearchService.search(query, company, request.user)
        return Response({'query': query, 'results': results})
