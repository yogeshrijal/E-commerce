from django.db import models

from django.contrib.auth.models import AbstractUser

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
    
       


