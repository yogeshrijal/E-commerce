from django.db import models
from  Orders.models import Order
from Products.models import Product,ProductSKU
from django.conf import settings
from django.core.validators import MinValueValidator,MaxValueValidator
from  django.utils import timezone


# Create your models here.
class Review(models.Model):
    product=models.ForeignKey(Product,on_delete=models.CASCADE,related_name='reviews')
    order=models.ForeignKey(Order, on_delete=models.SET_NULL,null=True,blank=True)
    user=models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.CASCADE)
    sku=models.ForeignKey(ProductSKU,on_delete=models.SET_NULL,null=True,blank=True)
    rating=models.PositiveIntegerField(
        validators=[MinValueValidator(1),MaxValueValidator(5)]
    )
    comment=models.TextField(blank=True,null=True,max_length=200)
    created_at=models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together=('user','product')
        ordering=['-created_at']


    def __str__(self):
        return f"{self.rating}Stars-{self.product.name}"
        

