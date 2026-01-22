from django.shortcuts import render
from Orders.serializers import OrderSerializer
from Orders.models import Order
from rest_framework import viewsets
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import BasePermission
from rest_framework.permissions import SAFE_METHODS
from rest_framework.permissions import IsAuthenticated


# Create your views here.


        
class OrderViewSet(viewsets.ModelViewSet):

    serializer_class=OrderSerializer
    authentication_classes=[JWTAuthentication]
    permission_classes=[IsAuthenticated]


    def get_queryset(self):
        
        user=self.request.user
        if user.role=='admin':
            return Order.objects.all()
        
        return Order.objects.filter(customer=user)
    def perform_create(self, serializer):
        serializer.save(customer=self.request.user)
    


