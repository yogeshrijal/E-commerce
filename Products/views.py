from rest_framework.decorators import permission_classes
from django.shortcuts import render
from django.db.models import Avg,Count
from  rest_framework import viewsets,permissions
from Products.models import Product,Category
from Products.serializers import ProductSerializer,CategorySerializer
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import AllowAny , IsAdminUser,IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from Products.permission import IsSeller,IsSellerorAdmin
from rest_framework.filters import OrderingFilter
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status


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
    filter_backends=[OrderingFilter]
    ordering_fields=['base_price','created_at','stock','name','avg_rating']
    search_fields=['category','description','category__name']
    ordering=['-name']

  

    def get_queryset(self):
        user=self.request.user
        queryset = Product.objects.annotate(
            avg_rating=Avg('reviews__rating'),
            review_count=Count('reviews')
        )
        if user.is_authenticated and user.role=='admin':
           return queryset
        
        if user.is_authenticated and user.role=='seller':
            return queryset.filter(created_by=user)


        return queryset.filter(is_active=True)  


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
    
    @action(detail=False,methods=['get'] , permission_classes=[AllowAny])
    def compare(self,request):
        ids_param=request.query_params.get('id')
        if not ids_param:
            return Response({'error':'no id or invalid id'}, status=status.HTTP_400_BAD_REQUEST)
        

        try:
            Product_ids=[int(x) for x in ids_param.split(',')]
        
        except ValueError:
            return Response({'error':'the producut must be seperated by comma'}, status=status.HTTP_400_BAD_REQUEST)
        

        product=self.get_queryset().filter(id__in=Product_ids,is_active=True)

        if not product.exists():
            return Response({'error':'product not found'},status=status.HTTP_404_NOT_FOUND)
        
        unique_categories=product.values_list('category',flat=True).distinct()

        if unique_categories.count()>1:
            return Response({'error':'you can compare only one category'},status=status.HTTP_400_BAD_REQUEST)
        
        serailizer=self.get_serializer(product,many=True)
        return Response(serailizer.data)




       









        
    
        
    
    

        







