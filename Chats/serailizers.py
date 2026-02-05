from Chats.models import Conversation,Message
from rest_framework.serializers import ModelSerializer
from rest_framework import serializers
from Products.models import Product





class ConversationSerializer(ModelSerializer):
    customer_name = serializers.CharField(source='customer.username', read_only=True)
    seller_name = serializers.CharField(source='seller.username', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_image = serializers.ImageField(source='product.image', read_only=True)
    product_id=serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        source='product',
        write_only=True
    )
    unread_count = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()

    class Meta:
        model=Conversation
        fields=['id','customer','seller','product', 'created_at','customer_name','product_name','product_image','product_id','seller_name', 'unread_count', 'last_message']
        read_only_fields=['customer','seller','product', 'created_at']

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return obj.messages.filter(is_read=False).exclude(sender=request.user).count()
        return 0

    def get_last_message(self, obj):
        last_msg = obj.messages.first() 
        if last_msg:
            return {
                'content': last_msg.content,
                'created_at': last_msg.created_at,
                'sender': last_msg.sender.username
            }
        return None




class MessageSerializer(ModelSerializer):
    class Meta:
        model=Message
        fields=['id','conversation', 'sender', 'content','is_read','created_at']
        read_only_fields=['conversation','sender','is_read','created_at']
