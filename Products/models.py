from django.db import models
from django.conf import settings
from django.utils import timezone
# Create your models here.
class Category(models.Model):
    name=models.CharField(max_length=25)
    parent=models.ForeignKey('self',  on_delete=models.CASCADE, null=True,blank=True,related_name='category')
    created_by=models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.SET_NULL, null=True,limit_choices_to={'role':'admin'})
    class Meta:
        
        verbose_name_plural = 'categories'

    def __str__(self):
        if self.parent:
            return f"{self.parent.name} > {self.name}"
        return self.name
           


class Product(models.Model):
    category=models.ForeignKey(Category,on_delete=models.CASCADE, related_name='product')
    created_by=models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.CASCADE,null=True,limit_choices_to={'role':'seller'})
    name=models.CharField(max_length=25)
    description=models.TextField()
    base_price=models.DecimalField(max_digits=10,decimal_places=2)
    stock=models.PositiveIntegerField(default=0)
    image=models.ImageField(upload_to='Products/',blank=True,null=True)
    is_active=models.BooleanField(default=True) 
    created_at=models.DateTimeField(default=timezone.now)

    def __str__(self):
        return self.name
    

class ProductSpecs(models.Model):
    product=models.ForeignKey(Product,on_delete=models.CASCADE,related_name='specs')
    attribute=models.CharField(max_length=25)
    value=models.CharField(max_length=20)
    class Meta:
        unique_together=('product','attribute')

    def __str__(self):
        return f"{self.attribute}:{self.value}"
class ProductSKU(models.Model):
    product=models.ForeignKey(Product,on_delete=models.CASCADE, related_name='skus')  
    attribute=models.CharField(max_length=50)
    sku_code=models.CharField(max_length=50,unique=True)
    price=models.DecimalField(decimal_places=2,max_digits=10)
    stock=models.PositiveIntegerField(default=0) 
    image=models.ImageField(upload_to='ProductSKU/',blank=True,null=True)


    def __str__(self):
        return f"{self.product}:{self.sku_code}"



class SKUAtrribute(models.Model):
    sku=models.ForeignKey(ProductSKU,on_delete=models.CASCADE,related_name="sku_attribute")
    attribute=models.CharField(max_length=20)
    value=models.CharField(max_length=20)
    class Meta:
        unique_together=('sku','attribute')
    
    def __str__(self):
        return f"{self.attribute}:{self.value}"




