from django.contrib import admin
from shipping.models import ShippingZone,GlobalShippingrate

# Register your models here.
admin.site.register(ShippingZone)
admin.site.register(GlobalShippingrate)

