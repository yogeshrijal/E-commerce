from django.shortcuts import render
from rest_framework import viewsets,mixins,status
from Users.models import User,PasswordResetToken
from Users.serializers import UserSerializer,RegsiterUserSerializer,PasswordResetTokenSerializers,PasswordResetSerializer,EmailVerificationToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import  IsAuthenticated ,AllowAny
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.decorators import action

 
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
    
class UserRegistrationViewset(mixins.CreateModelMixin,viewsets.GenericViewSet):
    queryset=EmailVerificationToken.objects.all()
    serializer_class=RegsiterUserSerializer

    def create(self, request, *args, **kwargs):
         super().create(request, *args, **kwargs)
         return Response(
             {"message":"email verfication is sent"},
             status=status.HTTP_201_CREATED
         )
    
    

class EmailVerifyViewSet(viewsets.GenericViewSet):
    queryset=EmailVerificationToken.objects.all()
    @action(detail=False,methods=['get'])
    def verfy(self,request):
        token_value=request.query_params.get('token')
        if not token_value:
            return Response({'error':'token value not found'},status=status.HTTP_400_BAD_REQUEST)
        
        try:
            token_obj=EmailVerificationToken.objects.get(token=token_value)

            if not token_obj.is_valid():
                return Response({'error:token is not valid'},status=status.HTTP_404_NOT_FOUND)
            
            user=token_obj.user
            user.is_active=True
            user.save()

            token_obj.delete()

            return Response({'message':'your account is verfied sucessfully'},status=status.HTTP_201_CREATED)
        
        except EmailVerificationToken.DoesNotExist:
            return Response({'error':'the token is not valid or already used'},status=status.HTTP_400_BAD_REQUEST)
            


        
class PasswordResetTokenViewSet(mixins.CreateModelMixin,viewsets.GenericViewSet):
    queryset=PasswordResetToken.objects.all()
    serializer_class=PasswordResetTokenSerializers


    def create(self, request, *args, **kwargs):
        super().create(request, *args, **kwargs)
        return Response(
            {"message": "Password reset link sent to your email."}, 
            status=status.HTTP_201_CREATED
        )
class ResetPasswordViewset(viewsets.GenericViewSet):
    serializer_class=PasswordResetSerializer
    
    def create(self, request, *args, **kwargs):
        
        data = request.data.copy()
        if not data.get('token'):
            get_token = request.query_params.get('token')
            if get_token:
                data['token'] = get_token

        
        
        serializer = self.get_serializer(data=data)
         
        
        serializer.is_valid(raise_exception=True)
        serializer.save() 
        return Response(
         {"message": "Password has been reset successfully."}, 
                status=status.HTTP_200_OK
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    
      

    


        
