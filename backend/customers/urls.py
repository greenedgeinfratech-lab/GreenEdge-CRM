"""
Customers URL Configuration
============================
All endpoints are under /api/v1/customers/
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from customers.views import CustomerViewSet

router = DefaultRouter()
router.register(r'customers', CustomerViewSet, basename='customers')

urlpatterns = [
    path('', include(router.urls)),
]
