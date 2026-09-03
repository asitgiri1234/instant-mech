from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class Service(models.Model):
    name = models.CharField(max_length=80, unique=True)

    def __str__(self):
        return self.name


class Mechanic(models.Model):
    name = models.CharField(max_length=120)
    phone = models.CharField(max_length=15)
    location = models.CharField(max_length=255)
    rating = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(5)],
    )
    is_open = models.BooleanField(default=True)
    services = models.ManyToManyField(Service, related_name="mechanics")

    def __str__(self):
        return self.name


class ServiceRequest(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        ACCEPTED = "ACCEPTED", "Accepted"
        COMPLETED = "COMPLETED", "Completed"
        CANCELLED = "CANCELLED", "Cancelled"

    customer_name = models.CharField(max_length=120)
    customer_phone = models.CharField(max_length=15)
    vehicle_number = models.CharField(max_length=20)
    problem_description = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    mechanic = models.ForeignKey(
        Mechanic,
        on_delete=models.PROTECT,
        related_name="requests",
    )
    service = models.ForeignKey(
        Service,
        on_delete=models.PROTECT,
        related_name="requests",
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.vehicle_number} ({self.get_status_display()})"
