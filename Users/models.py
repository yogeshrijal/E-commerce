from django.db import models
from datetime import timedelta
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType

# Create your models here.
class User(AbstractUser):
    ROLE_CHOCIES=[
        ('seller','SELLER'),
         ('customer','CUSTOMER'),
         ('admin','ADMIN'),
    ]
    role=models.CharField(max_length=20,choices=ROLE_CHOCIES,default='customer')
    contact=models.PositiveIntegerField(null=True,blank=True)
    address=models.TextField(blank=True, default='')
    profile_picture=models.ImageField( upload_to='User/', null=True,blank=True)


    def __str__(self):
        return f"{self.username} ({self.role})"
    


class EmailVerificationToken(models.Model):
    user=models.ForeignKey(User, on_delete=models.CASCADE)
    token=models.CharField(max_length=100)
    is_used=models.BooleanField(default=False)
    created_at=models.DateTimeField(default=timezone.now)


    def is_valid(self):
        expire_time=self.created_at + timedelta(days=1)
        return timezone.now() <=expire_time and not self.is_used 
        
    
       
class PasswordResetToken(models.Model):
    user=models.ForeignKey(User,on_delete=models.CASCADE)
    token=models.CharField( max_length=70)
    created_at=models.DateTimeField( default=timezone.now)
    is_used=models.BooleanField(default=False)


    def is_valid(self):
        expire_time=self.created_at + timedelta(minutes=15)
        return timezone.now() <=expire_time and not self.is_used 
    


    def  __str__(self):
        return f"The reset token is {self.user.username}"
    

   

