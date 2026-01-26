from django.shortcuts import render
from rest_framework import viewsets
from shipping.models import ShippingZone,GlobalShippingrate
from shipping.serializers import ShippingZoneSerializer,GlobalShippingrateSerializer
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import IsAdminUser 

# Create your views here.
class ShippingZoneViewset(viewsets.ModelViewSet):
    queryset=ShippingZone.objects.all()
    serializer_class=ShippingZoneSerializer
    authentication_classes=[JWTAuthentication]
    permission_classes=[IsAdminUser]


class GlobalShippingSerializerViewset(viewsets.ModelViewSet):
    queryset=GlobalShippingrate.objects.all()
    serializer_class=GlobalShippingrateSerializer 
    authentication_classes=[JWTAuthentication]
    permission_classes=[IsAdminUser]   



    def get_object(self):
        obj, created = GlobalShippingrate.objects.get_or_create(id=1)
        return obj

