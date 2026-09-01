from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    
    # Apps URLs
    path('api/v1/', include('users.urls')),
    path('api/v1/dashboard/', include('dashboard.urls')),
    path('api/v1/crm/', include('crm.urls')),
    path('api/v1/', include('customers.urls')),
    path('api/v1/manufacturing/', include('manufacturing.urls')),
    path('api/v1/support/', include('support.urls')),
]
