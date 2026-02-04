from django.db import models
from  Products.models import Product
from  django.conf import settings
from django.utils import timezone


# Create your models here.
class Conversation(models.Model):
    customer=models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.CASCADE,related_name='customer_conversation')
    seller=models.ForeignKey(settings.AUTH_USER_MODEL,  on_delete=models.CASCADE,related_name='seller_conversation')
    product=models.ForeignKey(Product, on_delete=models.SET_NULL,null=True)
    created_at=models.DateTimeField(default=timezone.now)



    class Meta:
        unique_together=('customer','seller','product')
        ordering=['-created_at']



    def __str__(self):
        return f"{self.customer}->{self.seller} {self.product}"
    



class Message(models.Model):
    conversation=models.ForeignKey(Conversation, on_delete=models.CASCADE,related_name='messages')
    sender=models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    content=models.TextField()
    is_read=models.BooleanField(default=False)
    created_at=models.DateTimeField(default=timezone.now)
    class Meta:
        ordering=['-created_at']



    def __str__(self):
        return f"message from {self.sender}at-{self.created_at}"
    


        



