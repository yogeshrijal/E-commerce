import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'EMarket.settings')
django.setup()

from Chats.models import Conversation
from django.contrib.auth import get_user_model

User = get_user_model()

try:
    conv_id = 2
    user_id = 9
    
    print(f"--- Debugging Conversation {conv_id} & User {user_id} ---")
    
    try:
        chat = Conversation.objects.get(id=conv_id)
        print(f"Conversation {conv_id} exists.")
        print(f"  Customer: {chat.customer.username} (ID: {chat.customer.id})")
        print(f"  Seller: {chat.seller.username} (ID: {chat.seller.id})")
        print(f"  Product: {chat.product}")
        
        try:
            user = User.objects.get(id=user_id)
            print(f"User {user_id} exists: {user.username}")
            
            if user == chat.customer:
                print("RESULT: User IS the Customer.")
            elif user == chat.seller:
                print("RESULT: User IS the Seller.")
            else:
                print("RESULT: User is NEITHER customer nor seller. ACCESS DENIED expected.")
                
        except User.DoesNotExist:
            print(f"User {user_id} does NOT exist.")
            
    except Conversation.DoesNotExist:
        print(f"Conversation {conv_id} does NOT exist.")

except Exception as e:
    print(f"Error: {e}")
