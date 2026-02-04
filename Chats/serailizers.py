from Chats.models import Conversation,Message
from rest_framework.serializers import ModelSerializer
from rest_framework import serializers
from Products.models import Product





class conversationSerializer(ModelSerializer):
    customer_name = serializers.CharField(source='customer.username', read_only=True)
    seller_name = serializers.CharField(source='seller.username', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_image = serializers.ImageField(source='product.image', read_only=True)
    product_id=serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        source='product',
        write_only=True
    )
    class Meta:
        model=Conversation
        fields=['id','customer','seller','product', 'created_at','customer_name','product_name','product_image','product_id','seller_name']
        read_only_fields=['customer','seller','product', 'created_at']




class MessageSerializer(ModelSerializer):
    class Meta:
        model=Message
        fields=['id','conversation', 'sender', 'content','is_read','created_at']
        read_only_fields=['conversation','sender','is_read','created_at']
