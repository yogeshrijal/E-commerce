from django.db import models
from decimal import Decimal
class ShippingZone(models.Model):
    country_name=models.CharField(max_length=100, unique=True)
    rate=models.DecimalField(max_digits=7,decimal_places=2)


    def __str__(self):
        return f"{self.country_name}:{self.rate}"

class GlobalShippingrate(models.Model):
    base_rate=models.DecimalField(max_digits=7,decimal_places=2,default=Decimal(250.00))


    def __str__(self):
        return f"Rest of the world rate:{self.base_rate}"
    

    

 
