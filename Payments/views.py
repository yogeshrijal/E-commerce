from django.shortcuts import render
from Payments.serializers import PaymentSerializer, EsewaVerificationSerializer
from Payments.models import Payment
from rest_framework import viewsets, status
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
import requests
from django.conf import settings
DEV_MODE = getattr(settings, 'ESEWA_DEV_MODE', True)


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Payment.objects.filter(user=self.request.user)

    @action(
        detail=False,
        methods=['post'],
        serializer_class=EsewaVerificationSerializer
    )
    def verify_esewa(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        transaction_uuid = data['transaction_uuid'] 
        total_amount = data['total_amount']         
        transaction_code = data['transaction_code']

        url = "https://rc-epay.esewa.com.np/api/epay/transaction/status/"
        raw_uuid=data['transaction_uuid']
        if "-" in str(raw_uuid):
            order_id = str(raw_uuid).split("-")[0]
        else:
            order_id = raw_uuid
        try:
            payment = Payment.objects.get(
                order__id=order_id,
                status='pending'
            )
        except Payment.DoesNotExist:
            return Response(
                {"error": "Pending payment not found for this Order ID"},
                status=status.HTTP_404_NOT_FOUND
            )
        clean_amount = payment.amount
        if clean_amount % 1 == 0:
            clean_amount = int(clean_amount)


        params = {
            'product_code': 'EPAYTEST',
            'total_amount':str(clean_amount),
            'transaction_uuid': transaction_uuid,
        }
        

        try:
            response = requests.get(url, params=params)
            resp_data = response.json()
            status_value = resp_data.get('status', '').upper()

            if status_value == 'COMPLETE':
                payment.status = 'completed'
                payment.gateway_transaction_id = resp_data.get('ref_id') or transaction_code 
                payment.raw_json = resp_data
                payment.save()

                payment.order.status = 'processing'
                payment.order.save()

                return Response(
                    {"status": "Payment Verified"},
                    status=status.HTTP_200_OK
                )

            elif status_value in ['CANCELED','USER_CANCELED','FAILED','EXPIRED','ABANDONED']:
                payment.status = 'failed'
                payment.gateway_transaction_id = resp_data.get('ref_id') or transaction_code 
                payment.raw_json = resp_data
                payment.save()

                payment.order.status = 'canceled'
                payment.order.save()

                return Response(
                    {"status": "Payment Failed"},
                    status=status.HTTP_200_OK
                )
            
            elif status_value == 'PENDING':
           
                return Response(
                    {"error": "Payment is still processing. Please try again in a moment."},
                    status=status.HTTP_202_ACCEPTED
                )
            
            elif status_value == 'NOT_FOUND':
                if DEV_MODE:
                    # In development mode, auto-approve NOT_FOUND transactions for testing
                    print(f"🔧 DEV_MODE: Auto-approving NOT_FOUND transaction {transaction_uuid}")
                    payment.status = 'completed'
                    payment.gateway_transaction_id = f"DEV_{transaction_code}"
                    payment.raw_json = {"dev_mode": True, "original_response": resp_data}
                    payment.save()

                    payment.order.status = 'processing'
                    payment.order.save()

                    return Response(
                        {
                            "status": "Payment Verified",
                            "dev_mode": True,
                            "message": "Development mode: Payment auto-approved"
                        },
                        status=status.HTTP_200_OK
                    )
                else:
                    return Response(
                        {
                            "error": "Transaction not found",
                            "details": "This transaction was not found in eSewa's system. This can happen if: 1) The payment was not completed, 2) Using test credentials with real transactions, or 3) The transaction is too old.",
                            "transaction_uuid": transaction_uuid
                        },
                        status=status.HTTP_404_NOT_FOUND
                    )
            
            else:
                
                return Response(
                    {
                        "error": "Verification Failed",
                        "details": f"Unexpected status: {status_value}",
                        "esewa_response": resp_data
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

