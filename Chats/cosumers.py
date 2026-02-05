import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from Chats.models import Message,Conversation
from Products.models import Product



class ChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
       self.user=self.scope['user']

       if not self.user.is_authenticated:
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
           await self.close()
           return
       



       self.room_group_name=f'chat_{conversation_id}'

       await self.channel_layer.group_add(
           self.room_group_name,
           self.channel_name
       )
       await self.accept()
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
       async def recive(self,text_data):
           data=json.loads(text_data)
           message_content=data['meesage']

           saved_msg = await self.save_message(message_content)
           
                 



