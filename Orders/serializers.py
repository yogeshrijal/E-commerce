from decimal import Decimal
from rest_framework.serializers import ModelSerializer
from rest_framework import serializers
from Orders.models import Order, OrderItem,Coupon
from Products.models import ProductSKU
from django.db import transaction
from django.conf import settings
from shipping.models import GlobalShippingrate,ShippingZone
from Payments.models import Payment
from django.utils import timezone

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
    coupon_code=serializers.CharField(write_only=True,required=False,allow_blank=True)
    class Meta:
        model=Order
        fields=['id',  'full_name', 'email', 'contact', 'address', 
            'city', 'postal_code','country', 'total_amount', 'tax', 
            'shipping_cost', 'status', 'order_item', 'created_at','transaction_id','updated_at', 'payment_details','coupon', 'coupon_code','discount_amount']
        read_only_fields=['transaction_id','created_at','updated_at','shipping_cost','tax','total_amount','coupon','discount_amount']

    def validate(self, data):
        coupon_code=data.get('coupon_code')
        item_data=data.get('order_item',[])


        total_sum=Decimal(0.00)
         

        for item in item_data:
            sku=item['sku']
            quantity=item['quantity_at_purchase']
            total_sum+=sku.price*quantity
        
        if coupon_code:
            try:
                coupon=Coupon.objects.get(code=coupon_code)

               

                if not coupon.is_valid(total_sum):
                     now=timezone.now()
                     if not coupon.active:
                         raise serializers.ValidationError('coupon is not active')
                     
                     elif not  coupon.valid_from<=now <=coupon.valid_to:
                         raise serializers.ValidationError('coupon is expired')
                     
                     elif coupon.used_count>=coupon.usage_limit:
                         raise serializers.ValidationError('coupon has already been used maximum time')
                     elif total_sum < coupon.min_purchase_ammount:
                         raise serializers.ValidationError(f'Spend at least {coupon.min_purchase_ammount} to use this code')
                     
                     else:
                         raise serializers.ValidationError('invalid coupon')
                     

                     data['coupon_obj']=coupon
                     data['total_sum']=total_sum


            except Coupon.DoesNotExist:
                raise serializers.ValidationError('coupon does not exsit')
    

        return data


                      
                          

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')

        if request and hasattr(request.user, 'role') and request.user.role == 'seller':
            seller_items = instance.order_item.filter(sku__product__created_by=request.user)
            data['order_item'] = OrderItemSerializer(seller_items, many=True).data
        
        return data

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
        
        coupon_obj=validated_data.pop('coupon_obj', None)
        coupon_code = validated_data.pop('coupon_code', None)
        
      
        if not coupon_obj and coupon_code:
            try:
                coupon_obj = Coupon.objects.get(code=coupon_code)
            except Coupon.DoesNotExist:
                coupon_obj = None

        total_sum=Decimal('0.00')

        with transaction.atomic():
            order=Order.objects.create(
                tax=0,
                shipping_cost=0,
                total_amount=0,
        
                **validated_data
                
            )
         
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

            discount=Decimal('0.00')
            if coupon_obj:
                if coupon_obj.discount_type=='fixed':
                    discount=coupon_obj.discount_value
                else:
                    discount=(coupon_obj.discount_value)/Decimal(100.00)*total_sum
               
                if total_sum >= coupon_obj.min_purchase_ammount:
                     order.coupon=coupon_obj
                     order.discount_amount=discount
                     coupon_obj.used_count+=1
                     coupon_obj.save()
                else:
                    discount = Decimal('0.00')

            shipping_cost=self.get_shipping_cost(order.country)
            order.shipping_cost=shipping_cost

            tax_amount=total_sum*Decimal('0.13')
            order.tax=tax_amount
            order.total_amount=max(Decimal('0.00'), (total_sum+ tax_amount+ shipping_cost) - discount)
            order.save()
            return order        

class CouponSerailizer(ModelSerializer):
    class Meta:
       model=Coupon
       fields=['id', 'code','discount_type','discount_value','min_purchase_ammount','active','valid_from','valid_to','usage_limit','used_count']
       read_only_fields=['used_count']

    def validate(self,data):
        if data['valid_from']>=data['valid_to']:
            raise serializers.ValidationError({'valid_from': 'Start date must be before end date'})
        return data



         
          