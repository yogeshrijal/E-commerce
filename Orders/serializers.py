from decimal import Decimal
from rest_framework.serializers import ModelSerializer
from rest_framework import serializers
from Orders.models import Order, OrderItem
from Products.models import ProductSKU
from django.db import transaction
from django.conf import settings
from shipping.models import GlobalShippingrate,ShippingZone
from Payments.models import Payment
class OrderItemSerializer(ModelSerializer):
    class Meta:
        model=OrderItem
        fields=['id','order','sku', 'price_at_purchase','quantity_at_purchase']
        read_only_fields=['price_at_purchase', 'order']


class SimplePaymentSerializer(ModelSerializer):
    class Meta:
        model = Payment
        fields = ['id', 'status', 'amount', 'method', 'transaction_uuid']

class OrderSerializer(ModelSerializer):
    order_item=OrderItemSerializer(many=True ,required=True)
    payment_details = SimplePaymentSerializer(many=True, read_only=True)
    class Meta:
        model=Order
        fields=['id',  'full_name', 'email', 'contact', 'address', 
            'city', 'postal_code','country', 'total_amount', 'tax', 
            'shipping_cost', 'status', 'order_item', 'created_at','transaction_id','updated_at', 'payment_details']
        read_only_fields=['transaction_id','created_at','updated_at','shipping_cost','tax','total_amount']
    def validate_order_item(self,value):
        if not value:
            raise serializers.ValidationError('atleast one item should be present')
        return value
    def get_shipping_cost(self,country_name):
        if not country_name:
          country_name='Nepal'
        clean_country=country_name.strip()
        zone=ShippingZone.objects.filter(country_name__iexact=clean_country).first()
        if zone:
            return zone.rate
        
        global_rate=GlobalShippingrate.objects.first()

        if global_rate:
            return global_rate.base_rate
        
        return Decimal('200.00')
    



    def create(self, validated_data):
        item_data=validated_data.pop('order_item')
        with transaction.atomic():
            order=Order.objects.create(
                tax=0,
                shipping_cost=0,
                total_amount=0,
        
                **validated_data
                
            )
            total_sum=Decimal('0.00')

            for item in item_data:
                sku=item['sku']
                quantity=item['quantity_at_purchase']
                if(sku.stock<quantity):
                    raise serializers.ValidationError(f'insufficent stock for{sku.sku_code}')
                
                sku.stock=sku.stock-quantity
                sku.save()
                
                price=sku.price
                total_sum=total_sum+(price*quantity)


                OrderItem.objects.create(
                    order=order,
                    sku=sku,
                    price_at_purchase=price,
                    quantity_at_purchase=quantity


                )
            shipping_cost=self.get_shipping_cost(order.country)
            order.shipping_cost=shipping_cost

            tax_amount=total_sum*Decimal('0.13')
            order.tax=tax_amount
            order.total_amount=total_sum+tax_amount+shipping_cost
            order.save()
            return order        

    
            





         
          