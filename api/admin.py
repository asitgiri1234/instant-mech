from django.contrib import admin

from .models import Mechanic, ServiceRequest

admin.site.register(Mechanic)
admin.site.register(ServiceRequest)
