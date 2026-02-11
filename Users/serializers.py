from rest_framework.serializers import ModelSerializer
from Users.models import User,PasswordResetToken,EmailVerificationToken
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
        token_string=str(uuid.uuid4())
        EmailVerificationToken.objects.create(
            user=user,
            token=token_string
            )
        
        verify_link = f"http://localhost:5173/verify-email?token={token_string}"
        email_message = f"""
Hi {user.username},

Welcome to EMarket! Please verify your email address by clicking the link below:

{verify_link}

If you didn't create an account, you can safely ignore this email.
"""
        send_mail(
            subject='Email verification for login ',
            message=email_message,
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[user.email],
            fail_silently=False

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
        reset_link = f"http://localhost:5173/reset-password?token={token_string}"
        
        # Create detailed email message
        email_message = f"""
Hello,

You recently requested to reset your password for your EMarket account. Click the link below to reset it:

{reset_link}

This password reset link will expire in 1 hour for security reasons.

If you did not request a password reset, please ignore this email or contact support if you have concerns. Your password will remain unchanged.

For your security:
- Never share your password with anyone
- Use a strong password with a mix of letters, numbers, and symbols
- Don't reuse passwords from other websites

Thank you,
The EMarket Team

---
This is an automated message, please do not reply to this email.
"""
        
        send_mail(
            subject="Password Reset Request - EMarket",
            message=email_message,
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
    


        
