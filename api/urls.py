from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import MechanicViewSet, ServiceRequestViewSet, ServiceViewSet

router = DefaultRouter()
router.register(r"mechanics", MechanicViewSet)
router.register(r"services", ServiceViewSet)
router.register(r"service-requests", ServiceRequestViewSet)

urlpatterns = [
    path("", include(router.urls)),
]
