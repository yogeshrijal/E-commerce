import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from Chats.models import Message,Conversation
from Products.models import Product



class ChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
       # Accept immediately to send debug info to client
       await self.accept()
       
       self.user=self.scope['user']
       
       if not self.user.is_authenticated:
           await self.send(text_data=json.dumps({"type": "error", "message": "User not authenticated. Check token."}))
           await self.close()
           return
       
       url_route=self.scope['url_route']['kwargs']

       if 'product_id' in url_route:
           product_id=url_route['product_id']
           self.conversation=await self.get_or_create_conversation(product_id)

       elif 'conversation_id' in url_route:
           conversation_id=url_route['conversation_id']
           self.conversation=await self.get_conversation(conversation_id)

       if not self.conversation:
           await self.send(text_data=json.dumps({
               "type": "error", 
               "message": f"Conversation not found or access denied for user {self.user.id}. Conv ID: {url_route.get('conversation_id')}"
            }))
           await self.close()
           return
       



       self.room_group_name=f'chat_{self.conversation.id}'

       await self.channel_layer.group_add(
           self.room_group_name,
           self.channel_name
       )
       await self.send(text_data=json.dumps({
        "type": "connection_established",
        "conversation_id": self.conversation.id
        }))
    async  def disconnect(self,close_code):
           if hasattr(self,'room_group_name'):
               await self.channel_layer.group_discard(
                   self.room_group_name,
                   self.channel_name
               )
    async def receive(self,text_data):
            data=json.loads(text_data)
            message_content=data['message']

            saved_msg = await self.save_message(message_content)

            await self.channel_layer.group_send(
               self.room_group_name,{
                   
                   'type':'chat_message',
                   'message':message_content,
                   'sender_name':self.user.username,
                    'sender_id':self.user.id




               }

               
           )
           
    async  def chat_message(self,event):
           await self.send(text_data=json.dumps(event))




    @database_sync_to_async  
    def get_or_create_conversation(self,product_id):
            try:
                product=Product.objects.get(id=product_id)
                chat=Conversation.objects.filter(customer=self.user,product=product).first()
                if chat:
                    return chat
                
                return Conversation.objects.create(
                    customer=self.user,
                    seller=product.created_by,
                    product=product
                )
            except Product.DoesNotExist:
                return None
    @database_sync_to_async
    def get_conversation(self,conversation_id):
           try:
               chat=Conversation.objects.filter(id=conversation_id).first()
               if not chat:
                    return None
               if self.user==chat.customer or self.user==chat.seller:
                   return chat
               return None
           except Conversation.DoesNotExist:
               return None

    @database_sync_to_async
    def save_message(self,content):
           return Message.objects.create(
               conversation=self.conversation,
               sender=self.user,
               content=content
           )
          
           










