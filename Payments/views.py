
from django.shortcuts import render
from Payments.serializers import PaymentSerializer,EsewaVerificationSerializer
from Payments.models import Payment
from rest_framework import viewsets
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
import requests
import xml.etree.ElementTree as ET
from rest_framework.response import Response
from rest_framework import status



# Create your views here.
class PaymentViewSet(viewsets.ModelViewSet):
    queryset=Payment.objects.all()
    serializer_class=PaymentSerializer
    authentication_classes=[JWTAuthentication]
    permission_classes=[IsAuthenticated]

    def get_queryset(self):
        return Payment.objects.filter(user=self.request.user)
    
    @action(
        detail=False,
        methods=['post'],
        serializer_class=EsewaVerificationSerializer
        

    )
    def verify_esewa(self,request):
        serializer=self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data=serializer.validated_data
        oid=data['oid']
        amt=data['amt']
        refID=data['refID']
        url = "https://rc-epay.esewa.com.np/api/epay/transaction/status/"



        params={
            'product_code': 'EPAYTEST',
             'total_amount': amt,
            'transaction_uuid': oid,
            
        }
        
        
        try:
            response=requests.get(url,params=params)
            resp_data=response.json()
            status_value=resp_data.get('status')


            if status_value=='COMPLETE':
                payment = Payment.objects.get(order__id=oid, status='pending')
                
                payment.status = 'completed'
                payment.gateway_transaction_id = refID
                payment.save()
                payment.order.status = 'processing' 
                payment.order.save()

                return Response({"status": "Payment Verified"}, status=status.HTTP_200_OK)
            else:
                return Response({"error": "Verification Failed"}, status=status.HTTP_400_BAD_REQUEST)

        except Payment.DoesNotExist:
             return Response({"error": "Pending payment not found for this Order ID"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


