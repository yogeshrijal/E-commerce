from django.contrib import admin
from Products.models import Category,Product,ProductSKU,ProductSpecs,SKUAtrribute

# Register your models here.
admin.site.register(Category)
admin.site.register(Product)
admin.site.register(ProductSKU)
admin.site.register(ProductSpecs)
admin.site.register(SKUAtrribute)
