from Payments.models import Payment
from rest_framework.serializers import ModelSerializer
from Orders.models import Order
from rest_framework import serializers
import uuid




class PaymentSerializer(ModelSerializer):
        class Meta:
            model=Payment
            fields=['order','user','method','amount','status','gateway_transaction_id','raw_json','created_at','transaction_uuid','pidx']
            read_only_fields=['user','amount','status','gateway_transaction_id','raw_json','created_at','pidx']


        def validate_order(self,order):
                user=self.context['request'].user
                
                if order.customer!=user:
                    raise serializers.ValidationError('this is not your order')
                

                if  Payment.objects.filter(order=order,status='completed').exists():
                    raise serializers.ValidationError('you have already paid')
                
                return order
        

        def create(self, validated_data):
            request=self.context.get('request')
            order=validated_data['order']
            
            # Use transaction_uuid from frontend if provided, otherwise generate one
            transaction_uuid = validated_data.get('transaction_uuid')
            if not transaction_uuid:
                transaction_uuid = f"{order.id}-{uuid.uuid4()}"

            final_ammount=getattr(order,'total_amount',0)


            payement=Payment.objects.create(
                user=request.user,
                amount=final_ammount,
                transaction_uuid=transaction_uuid,
                status='pending',
                **{k: v for k, v in validated_data.items() if k != 'transaction_uuid'}
            )

            return payement



class EsewaVerificationSerializer(serializers.Serializer):
        transaction_uuid=serializers.CharField(required=True)
        total_amount=serializers.DecimalField(max_digits=10,decimal_places=2)
        transaction_code=serializers.CharField(required=True)


class KhaltiVerificationSerializer(serializers.Serializer):
      pidx=serializers.CharField(required=True)
      transaction_uuid=serializers.CharField(required=False)
        




