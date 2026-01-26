from rest_framework.serializers import ModelSerializer
from shipping.models import ShippingZone,GlobalShippingrate



class ShippingZoneSerializer(ModelSerializer):
    class Meta:
        model=ShippingZone
        fields='__all__'


class GlobalShippingrateSerializer(ModelSerializer):
    class Meta:
       model=GlobalShippingrate
       fields='__all__'
