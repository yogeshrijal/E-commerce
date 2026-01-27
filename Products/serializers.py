
from rest_framework.serializers import ModelSerializer
from Products.models import Category,Product,ProductSpecs,ProductSKU,SKUAtrribute
from rest_framework import serializers
from django.db import transaction




class CategorySerializer(ModelSerializer):
    parent=serializers.SlugRelatedField(
        queryset=Category.objects.all(),
        slug_field='name',
        required=False,
        allow_null=True,

    )
    created_by=serializers.StringRelatedField(read_only=True)
    class Meta:
        model=Category
        fields='__all__'
class ProductSpecsSerializer(ModelSerializer):
    class Meta:
        model=ProductSpecs
        fields=['value','attribute']

class SKUAttributeSerializer(ModelSerializer):
    class Meta:
        model=SKUAtrribute
        fields=['attribute','value']   

class ProductSKUSerializer(ModelSerializer):
    sku_attribute=SKUAttributeSerializer(many=True,required=False)
    class Meta:
        model=ProductSKU
        fields=['id','sku_code', 'price', 'stock' ,'image','sku_attribute']
     
class ProductSerializer(ModelSerializer):
    avg_rating = serializers.FloatField(read_only=True)
    review_count = serializers.IntegerField(read_only=True)
    category=serializers.SlugRelatedField(
        queryset=Category.objects.all(),
        slug_field='name')
    parent_category=serializers.ReadOnlyField(source='category.parent.name')
    
    created_by=serializers.StringRelatedField(read_only=True)
    specs=ProductSpecsSerializer(many=True,required=False)
    skus=ProductSKUSerializer(many=True,required=False)

    class Meta:
       model=Product
       fields=['id','category','name','parent_category','description','stock','image','created_by','skus','specs','base_price','is_active','avg_rating','review_count']
       read_only_fields=['created_by']
    
    def create (self,validated_data):
        specs_data=validated_data.pop('specs',[])
        skus_data=validated_data.pop('skus',[])
        product=Product.objects.create(**validated_data)
        for spec in specs_data:
            ProductSpecs.objects.create(product=product,**spec)
        for sku_item in skus_data:
             attrs_data = sku_item.pop('sku_attribute', [])
             sku_obj= ProductSKU.objects.create(product=product, **sku_item)

             for attr in attrs_data:
               SKUAtrribute.objects.create(sku=sku_obj, **attr)
        return product
    
    def update(self, instance, validated_data):
        specs_data = validated_data.pop('specs', None)
        skus_data = validated_data.pop('skus', None)
       

        instance = super().update(instance, validated_data)
      


        
        if specs_data is not None:
            instance.specs.all().delete()
            for spec in specs_data:
                ProductSpecs.objects.create(product=instance, **spec)

    
        if skus_data is not None:
            incoming_ids = []

            for sku_item in skus_data:
                attrs_data = sku_item.pop('sku_attribute', [])
                sku_id = sku_item.pop('id', None)

                if sku_id:
                    
                    sku_obj = ProductSKU.objects.get(id=sku_id, product=instance)
                    for key, value in sku_item.items():
                        setattr(sku_obj, key, value)
                    sku_obj.save()
                else:
                  
                    sku_obj = ProductSKU.objects.create(
                        product=instance,
                        **sku_item
                    )

                incoming_ids.append(sku_obj.id)

                
                sku_obj.sku_attribute.all().delete()
                for attr in attrs_data:
                    SKUAtrribute.objects.create(sku=sku_obj, **attr)

            
            instance.skus.exclude(id__in=incoming_ids).delete()

        return instance


    
