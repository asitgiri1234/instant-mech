from django.contrib import admin

from .models import Mechanic, Service, ServiceRequest

admin.site.register(Mechanic)
admin.site.register(Service)
admin.site.register(ServiceRequest)
