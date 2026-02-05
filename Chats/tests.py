
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from Chats.models import Conversation, Message
from Products.models import Product, Category

User = get_user_model()

class ChatPrivacyTests(TestCase):
    def setUp(self):
        # Create users
        self.customer = User.objects.create_user(username='customer', password='password')
        self.seller = User.objects.create_user(username='seller', password='password')
        self.intruder = User.objects.create_user(username='intruder', password='password')

        # Create category
        self.category = Category.objects.create(name='Test Category')

        # Create product
        self.product = Product.objects.create(
            name='Test Product',
            created_by=self.seller,
            base_price=100,
            stock=10,
            category=self.category
        )

        # Create conversation between customer and seller
        self.conversation = Conversation.objects.create(
            customer=self.customer,
            seller=self.seller,
            product=self.product
        )

        self.client = APIClient()

    def test_intruder_cannot_access_conversation(self):
        # Login as intruder
        self.client.force_authenticate(user=self.intruder)

        # Attempt to get conversation detail
        response = self.client.get(f'/chats/{self.conversation.id}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_intruder_cannot_read_messages(self):
        # Login as intruder
        self.client.force_authenticate(user=self.intruder)

        # Attempt to read messages
        response = self.client.get(f'/chats/{self.conversation.id}/message/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_intruder_cannot_send_messages(self):
        # Login as intruder
        self.client.force_authenticate(user=self.intruder)

        # Attempt to send message
        response = self.client.post(f'/chats/{self.conversation.id}/send_message/', {'content': 'Intrusion!'})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_participant_can_access(self):
        # Login as customer
        self.client.force_authenticate(user=self.customer)
        response = self.client.get(f'/chats/{self.conversation.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Login as seller
        self.client.force_authenticate(user=self.seller)
        response = self.client.get(f'/chats/{self.conversation.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
