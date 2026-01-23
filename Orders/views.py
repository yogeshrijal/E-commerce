from django.shortcuts import render
from Orders.serializers import OrderSerializer
from Orders.models import Order
from rest_framework import viewsets
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import SAFE_METHODS
from rest_framework.permissions import IsAuthenticated
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
    def restore_stock(self,order):
        for item in order.order_item.all():
            sku=item.sku
            sku.stock=sku.stock+item.quantity_at_purchase
            sku.save()



    


    FORWARD_FLOW=['pending','processing','shipped']
    

    def update(self, request, *args, **kwargs):
       
        instance=self.get_object()
        user=self.request.user
        new_status=self.request.data.get('status')
        old_status=instance.status
        if not new_status:
            return super().update(request,*args,**kwargs)
        

        if old_status=='canceled' :
            return Response({"error":"order cannot be canceled at this point"},status=status.HTTP_403_FORBIDDEN)
        
        
        if old_status=='delivered':
            return Response({"error": "already delivered"},status=status.HTTP_403_FORBIDDEN)

            
        if new_status=='delivered' and user.role!='admin':
            return Response({"error":"only admin can mark deliverd"},status=status.HTTP_403_FORBIDDEN)
        

        if new_status=='canceled':
            if instance.status in ['shipped','delivered'] and user.role!= 'admin' :
                 return Response({"error":"cannot cancel at this stage of process"},status=status.HTTP_403_FORBIDDEN)


        

        elif user.role=='seller':
             is_seller_owner=instance.order_item.filter(sku__product__created_by=user).exists()
             if not is_seller_owner:
              return Response(status=status.HTTP_403_FORBIDDEN)
             
             if old_status not in self.FORWARD_FLOW:
                 return Response(status=status.HTTP_403_FORBIDDEN)
             
             current_index=self.FORWARD_FLOW.index(old_status)

             if (
                current_index + 1 >= len(self.FORWARD_FLOW)
                or new_status != self.FORWARD_FLOW[current_index + 1]
               ):
                return Response(
                    {"error": "Seller can only move order forward"},
                    status=status.HTTP_403_FORBIDDEN
                )     


        elif user.role=='customer'and new_status!='canceled':
                 return Response({"error":"user can only  cancel the order"},status=status.HTTP_403_FORBIDDEN)
         
        old_status=instance.status
        response = super().update(request, *args, **kwargs)
        instance.refresh_from_db()

        if old_status!= 'canceled' and instance.status == 'canceled':
            self.restore_stock(instance)
             
        return response


