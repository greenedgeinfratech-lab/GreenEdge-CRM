from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView


def health_check(request):
    """Simple health check endpoint for Railway."""
    return JsonResponse({'status': 'ok'})


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    
    # Health check (no auth required)
    path('api/v1/health/', health_check, name='health-check'),
    
    # Apps URLs
    path('api/v1/', include('users.urls')),
    path('api/v1/dashboard/', include('dashboard.urls')),
    path('api/v1/crm/', include('crm.urls')),
    path('api/v1/', include('customers.urls')),
    path('api/v1/manufacturing/', include('manufacturing.urls')),
    path('api/v1/support/', include('support.urls')),
]
