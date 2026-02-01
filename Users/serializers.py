from rest_framework.serializers import ModelSerializer
from Users.models import User,PasswordResetToken
from rest_framework import serializers
from django.core.mail import send_mail
import uuid
from django.conf import settings


class UserSerializer(ModelSerializer):
    class Meta:
       model=User
       fields=['id','username', 'email', 'role', 'contact', 'address', 'profile_picture']
       read_only_fields=['role']


class RegsiterUserSerializer(ModelSerializer):
    class Meta:
       model=User
       fields=['username','password','role','email','contact']

    def create(self,validated_data):
        user=User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            role=validated_data['role'],
            email=validated_data['email'],
            contact=validated_data['contact']
        )
        return user
class  PasswordResetTokenSerializers(ModelSerializer):
    email=serializers.EmailField( write_only=True, required=True)

    class Meta:
        model=PasswordResetToken
        fields=['token','created_at','email']
        read_only_fields=['token','created_at']
    

    def validate_email(self,value):
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError("this email doesnot exist")
        return value
    def create(self, validated_data):
        email_data=validated_data.pop('email')
        user_instance=User.objects.get(email=email_data)
        token_string = str(uuid.uuid4())
        reset_token_instance=PasswordResetToken.objects.create(
            user=user_instance,
            token=token_string
        )
        reset_link = f"http://127.0.0.1:8000/reset-password-confirm/?token={token_string}"
        send_mail(
            subject="Password Reset Request",
            message=f"Click the link below to reset your password:\n\n{reset_link}",
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[email_data],
            fail_silently=False,
        )

        return reset_token_instance
class PasswordResetSerializer(serializers.Serializer):
    token=serializers.CharField(write_only=True)
    new_password=serializers.CharField(write_only=True)
    confirm_password=serializers.CharField(write_only=True)


    def validate(self, data):
        if data['new_password']!=data['confirm_password']:
            raise serializers.ValidationError('password doesnot match')

        token_value=data['token']
        try:
            reset_token=PasswordResetToken.objects.get(token=token_value)

        except PasswordResetToken.DoesNotExist:
            raise serializers.ValidationError({'error':'invalid token'})



        if not reset_token.is_valid():
            raise serializers.ValidationError('token has exipred')

        data['reset_token_object']=reset_token  


        return data
    
    def save(self):
        reset_token=self.validated_data['reset_token_object']
        new_password=self.validated_data['new_password']


        user=reset_token.user
        user.set_password(new_password)
        user.save()

        reset_token.is_used=True
        reset_token.save()

        return user
    


        
