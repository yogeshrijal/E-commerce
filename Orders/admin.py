from django.contrib import admin
from Orders.models import Order,OrderItem,Coupon

# Register your models here.
admin.site.register(Order)
admin.site.register(OrderItem)
admin.site.register(Coupon)