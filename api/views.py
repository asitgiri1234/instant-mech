from rest_framework import mixins, viewsets

from .models import Mechanic, Service, ServiceRequest
from .serializers import (
    MechanicSerializer,
    ServiceRequestSerializer,
    ServiceSerializer,
)


class MechanicViewSet(viewsets.ModelViewSet):
    """Full CRUD: list, retrieve, create, update, partial update, destroy."""

    queryset = Mechanic.objects.all()
    serializer_class = MechanicSerializer


class ServiceViewSet(viewsets.ReadOnlyModelViewSet):
    """Read only: list and retrieve."""

    queryset = Service.objects.all()
    serializer_class = ServiceSerializer


class ServiceRequestViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    viewsets.GenericViewSet,
):
    """List, retrieve and create only - deliberately no update or delete."""

    queryset = ServiceRequest.objects.all()
    serializer_class = ServiceRequestSerializer
