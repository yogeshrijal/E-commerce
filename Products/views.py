from django.shortcuts import render
from  rest_framework import viewsets,permissions
from Products.models import Product,Category
from Products.serializers import ProductSerializer,CategorySerializer
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import AllowAny , IsAdminUser,IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from Products.permission import IsSeller,IsSellerorAdmin


# Create your views here.
class CategoryViewSet(viewsets.ModelViewSet):
    queryset=Category.objects.all()
    serializer_class=CategorySerializer
    authentication_classes=[JWTAuthentication]

    def get_permissions(self):
        if self.action in ['list','retrieve']:
            return[AllowAny()]
        return[IsAuthenticated()]
    
    def perform_create(self, serializer):
       user=self.request.user
       if user.role!='admin':
           raise PermissionDenied('you dont have permission to edit category')
       serializer.save(created_by=user)
    
class ProductViewSet(viewsets.ModelViewSet):
    serializer_class=ProductSerializer
    authentication_classes=[JWTAuthentication]
    def get_queryset(self):
        user=self.request.user
        if user.is_authenticated and user.role=='admin':
           return Product.objects.all()
        
        if user.is_authenticated and user.role=='seller':
            return Product.objects.filter(created_by=user)


        return Product.objects.filter(is_active=True)  


    def get_permissions(self):
        if self.action in ['list','retrieve'] :
            return [AllowAny()]
        if self.action=='create':
            return [IsSeller()]
        if self.action in['update','partial_update','destroy']:
            return[IsSellerorAdmin()]

        return [IsAuthenticated()]
    
    def  perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


       









        
    
        
    
    

        







