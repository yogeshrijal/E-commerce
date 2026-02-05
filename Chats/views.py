from django.shortcuts import render
from Chats.models import Message,Conversation
from Chats.serailizers import MessageSerializer,ConversationSerializer
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.db.models import Q
from django.shortcuts import get_object_or_404
from Products.models import Product
from rest_framework import status
from rest_framework.decorators import action
 

# Create your views here.
class ConversationViewset(viewsets.ModelViewSet):
    serializer_class=ConversationSerializer
    permission_classes=[IsAuthenticated]
    def get_queryset(self):
        return Conversation.objects.filter(
            Q(customer=self.request.user)|Q(seller=self.request.user)
        ).order_by('-created_at')
    

    def create(self, request, *args, **kwargs):
        product_id=request.data.get('product_id')
        product=get_object_or_404(Product,id=product_id)

        existing_chat=Conversation.objects.filter(customer=request.user,product=product).first()
        if product.created_by is None:
            return Response(
                {"error": "This product does not have a seller assigned. You cannot start a chat."}, 
                status=status.HTTP_400_BAD_REQUEST
            )


        if existing_chat:
            serializer=self.get_serializer(existing_chat)
            return Response( serializer.data,status=status.HTTP_200_OK)
        

        conversation=Conversation.objects.create(
            customer=request.user,
            seller=product.created_by,
            product=product

        )
        serializer=self.get_serializer(conversation)
        return Response(serializer.data,status=status.HTTP_201_CREATED)
    
    @action(detail=True,methods=['get'])
    def message(self,request,pk=None):
        conversation=self.get_object()
        messages =  conversation.messages.all().order_by('created_at')
        serializer=MessageSerializer(messages,many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def send_message(self, request, pk=None):
        conversation = self.get_object()
        serializer = MessageSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(conversation=conversation, sender=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        conversation = self.get_object()
        conversation.messages.exclude(sender=request.user).update(is_read=True)
        return Response({'status': 'messages marked as read'}, status=status.HTTP_200_OK)


        


    

    
