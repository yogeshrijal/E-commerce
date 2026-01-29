from django.db import models
from Orders.models import Order
from django.conf import settings
from django.utils import timezone

# Create your models here.
class Payment(models.Model):
    PAYMENT_CHOICES=[
        ('esewa','eSewa'),
        ('cod','Cash on Delivery')
    ]

    TRANSACTION_STATUS=[
        ('pending','Pending'),
        ('completed','Completed'),
        ('failed','Failed'),
    
    ]

    order=models.ForeignKey(Order,  on_delete=models.CASCADE,related_name='payment_details')
    user=models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    method=models.CharField( max_length=50, choices=PAYMENT_CHOICES)
    amount=models.DecimalField(max_digits=10,decimal_places=2)
    status=models.CharField(max_length=20,choices=TRANSACTION_STATUS)
    gateway_transaction_id=models.CharField(max_length=100,unique=True,blank=True,null=True)
    raw_json=models.JSONField(null=True,blank=True)
    created_at=models.DateTimeField(default=timezone.now)
    transaction_uuid=models.CharField(max_length=100,unique=True,blank=True,null=True)


    def  __str__(self):
        return f'order {self.order.id}-{self.method}({self.status})'
    
    
    






