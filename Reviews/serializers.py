from rest_framework.serializers import ModelSerializer
from Reviews.models import Review
from rest_framework import serializers
from Orders.models import OrderItem





class ReviewSeralizers(ModelSerializer):
    class Meta:
        model=Review
        fields=['id','product','order','user', 'sku', 'rating' ,'comment', 'created_at']
        read_only_fields=['created_at','id']




    def validate(self, data):
        user=self.context['request'].user
        product=data['product']


        if Review.objects.filter(product=product,user=user).exists():
            raise serializers.ValidationError('you have already reviewed the product')
        
        has_purchased=OrderItem.objects.filter(
            sku__product=product,
            order__customer=user,
            order__status='delivered'

            

        ).exists()

        if not has_purchased:
            raise serializers.ValidationError('you have to you purchase the item to rate')
        
        return data
    
    def create(self, validated_data):
        user=validated_data['user']
        product=validated_data['product']


        purchased_item=OrderItem.objects.filter(
            sku__product=product,
            order__customer=user,
            order__status='delivered'
        ).first()

        return Review.objects.create(
            user=user,
            sku=purchased_item.sku,
            order=purchased_item.order,
            **validated_data
        ) 

        
        
        