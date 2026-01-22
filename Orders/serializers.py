from decimal import Decimal
from rest_framework.serializers import ModelSerializer
from rest_framework import serializers
from Orders.models import Order, OrderItem
from Products.models import ProductSKU
from django.db import transaction

class OrderItemSerializer(ModelSerializer):
    class Meta:
        model=OrderItem
        fields=['id','order','sku', 'price_at_purchase','quantity_at_purchase']
        read_only_fields=['price_at_purchase', 'order']
class OrderSerializer(ModelSerializer):
    order_item=OrderItemSerializer(many=True ,required=True)
    class Meta:
        model=Order
        fields=['id',  'full_name', 'email', 'contact', 'address', 
            'city', 'postal_code', 'total_amount', 'tax', 
            'shipping_cost', 'status', 'order_item', 'created_at','transaction_id','updated_at']
        read_only_fields=['transaction_id','created_at','updated_at','shipping_cost','tax','total_amount']
    def validate_order_item(self,value):
        if not value:
            raise serializers.ValidationError('atleast one item should be present')
        return value
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

            tax_amount=total_sum*Decimal('0.13')
            order.tax=tax_amount
            order.total_amount=total_sum+tax_amount
            order.save()
            return order        

    
            





         
          