from django.shortcuts import render
from Orders.serializers import OrderSerializer
from Orders.models import Order
from rest_framework import viewsets
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import BasePermission
from rest_framework.permissions import SAFE_METHODS
from rest_framework.permissions import IsAuthenticated
from  Products.models import ProductSKU
from Users.models import User
from rest_framework.response import Response
from rest_framework import status 


# Create your views here.


        
class OrderViewSet(viewsets.ModelViewSet):

    serializer_class=OrderSerializer
    authentication_classes=[JWTAuthentication]
    permission_classes=[IsAuthenticated]


    def get_queryset(self):
        
        user=self.request.user
        if user.role=='admin':
            return Order.objects.all()
        if user.role=='customer':
           return Order.objects.filter(customer=user)
        if user.role=='seller':
            return Order.objects.filter(order_item__sku__product__created_by=user).distinct()
        return Order.objects.none()
    def perform_create(self, serializer):
        serializer.save(customer=self.request.user)


    FORWARD_FLOW=['pending','processing','shipped']
    

    def update(self, request, *args, **kwargs):
       
        instance=self.get_object()
        user=self.request.user
        new_status=self.request.data.get('status')
        current_status=instance.status
        if not new_status:
            return super().update(request,*args,**kwargs)
        

        if current_status=='canceled':
            return Response({"error":"order cannot be canceled at this point"},status=status.HTTP_403_FORBIDDEN)
        
        
        if current_status=='delivered':
            return Response({"error": "already delivered"},status=status.HTTP_403_FORBIDDEN)
        

        if new_status=='canceled':
            if instance.status in ['shipped','delivered']:
                if user.role != 'admin' and current_status == 'shipped':
                 return Response({"error": "cannot cancel at this stage of process"},status=status.HTTP_403_FORBIDDEN)
            return  super().update(request,*args,**kwargs)
    
       
       
       
        if user.role=='admin':
            return super().update(request,*args,**kwargs)

        

        if user.role=='seller':
             is_seller_owner=instance.order_item.filter(sku__product__created_by=user).exists()
             if not is_seller_owner:
              return Response(status=status.HTTP_403_FORBIDDEN)
             
             if current_status not in FORWARD_FLOW:
                 return Response(status=status.HTTP_401_UNAUTHORIZED)
             
             current_index=FORWARD_FLOW.index(current_status)

             if (
                current_index + 1 >= len(FORWARD_FLOW)
                or new_status != FORWARD_FLOW[current_index + 1]
               ):
                return Response(
                    {"error": "Seller can only move order forward"},
                    status=status.HTTP_403_FORBIDDEN
                )
             
         
             return super().update(request,*args,**kwargs)
         

        return Response(status=status.HTTP_403_FORBIDDEN)




