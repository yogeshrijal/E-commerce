from Payments.models import Payment
from rest_framework.serializers import ModelSerializer
from Orders.models import Order
from rest_framework import serializers




class PaymentSerializer(ModelSerializer):
    class Meta:
        model=Payment
        fields=['order','user','method','amount','status','gateway_transaction_id','raw_json','created_at']
        read_only_fields=['order','user','amount','status','gateway_transaction_id','raw_json','created_at']


    def validate_order(self,order):
            user=self.context['request'].user
            
            if order.customer!=user:
                raise serializers.ValidationError('this is not your order')
            

            if  Payment.objects.filter(order=order,status='completed').exists():
                raise serializers.ValidationError('you have already paid')
            
            return order
    

    def create(self, validated_data):
         request=self.context.get['request']
         order=validated_data['order']

         final_ammount=getattr(order,'total_amount',0)


         payement=Payment.objects.create(
              user=request.user,
              amount=final_ammount,
              status='pending',
              **validated_data
         )

         return payement



class EsewaVerificationSerializer(serializers.Serializer):
     transaction_uuid=serializers.CharField(required=True)
     total_amount=serializers.DecimalField(max_digits=10,decimal_places=2)
     transaction_code=serializers.CharField(required=True)
     




