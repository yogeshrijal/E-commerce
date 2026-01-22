from django.shortcuts import render
from rest_framework import viewsets
from Users.models import User
from Users.serializers import UserSerializer,RegsiterUserSerializer 
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import  IsAuthenticated ,AllowAny
from rest_framework.exceptions import PermissionDenied
 
# Create your views here.
class UserViewSet(viewsets.ModelViewSet):
    queryset=User.objects.all()

    def get_serializer_class(self):
        if self.action=='create':
            return RegsiterUserSerializer
        return UserSerializer
    def perform_create(self, serializer):
        requested_role=self.request.data.get('role')
        if requested_role=='admin':
            if not self.request.user.is_superuser:
                raise PermissionDenied('only superadmin can create admin role')

        serializer.save()  

    def get_permissions(self):
        if self.action=='create':
            return [AllowAny()]
        return[IsAuthenticated()]
    def get_queryset(self):
       user=self.request.user
       if user.is_authenticated and user.role=='admin':
           return User.objects.all()
       return User.objects.filter(id=user.id)

    
      

    


        
