from django.db import models
from django.conf import settings
from Products.models import ProductSKU 
from django.utils import timezone

# Create your models here.
class Order(models.Model):
     STATUS_CHOICES=[
          ('pending','Pending'),
          ('delivered','Delivered'),
          ('processing','Processing'),
          ('shipped','Shipped'),
          ('canceled','Canceled'),
     ]
     customer=models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE , related_name='orders')
     full_name=models.CharField(max_length=25)
     email=models.EmailField()
     address=models.CharField(max_length=25)
     city=models.CharField(max_length=25)
     postal_code=models.CharField(max_length=25)
     contact=models.PositiveIntegerField(null=True,blank=True)
     country=models.CharField(max_length=100,default='Nepal')
     total_amount=models.DecimalField( max_digits=10, decimal_places=2)
     tax=models.DecimalField( max_digits=10, decimal_places=2, default=0.00)
     shipping_cost=models.DecimalField( max_digits=10, decimal_places=2, default=0.00)

     status=models.CharField( max_length=50, choices=STATUS_CHOICES,default='pending')
     transaction_id=models.CharField( max_length=50,blank=True,null=True)
     created_at=models.DateTimeField( default=timezone.now)
     updated_at=models.DateTimeField( auto_now=True)
     class Meta:
        ordering=['-created_at']

     def __str__(self):
        return f"order #{self.id}-{self.customer.username}"
class OrderItem(models.Model):
    order=models.ForeignKey(Order,  on_delete=models.CASCADE,related_name='order_item')
    sku=models.ForeignKey(ProductSKU,on_delete=models.CASCADE,related_name='order_sku')
    price_at_purchase=models.IntegerField()
    quantity_at_purchase=models.PositiveIntegerField(default=1)

    def __str__(self):
      return f"Item: {self.sku.sku_code if self.sku else 'Removed Product'} (Qty: {self.quantity_at_purchase})"
    
    @property
    def total_item_price(self):
       return self.price_at_purchase * self.quantity_at_purchase

    
 




          
     
