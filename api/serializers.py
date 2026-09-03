from rest_framework import serializers

from .models import Mechanic, Service, ServiceRequest


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = ["id", "name"]


class MechanicSerializer(serializers.ModelSerializer):
    # On write this accepts a plain list of service ids, e.g. "services": [1, 2].
    # On read it is swapped for the nested ServiceSerializer in to_representation
    # below, so responses show the full service objects instead of bare ids.
    services = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Service.objects.all(),
    )

    class Meta:
        model = Mechanic
        fields = "__all__"

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["services"] = ServiceSerializer(instance.services.all(), many=True).data
        return data


class ServiceRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceRequest
        fields = "__all__"
        read_only_fields = ["id", "status", "created_at"]
