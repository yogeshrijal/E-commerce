from django.test import TestCase
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from Products.models import Category, Product, ProductSKU
from rest_framework import status

User = get_user_model()

class ProductUpdateTest(APITestCase):
    def setUp(self):
        # Create a seller user
        self.user = User.objects.create_user(
            username='seller',
            email='seller@example.com',
            password='password123',
            role='seller'
        )
        self.client.force_authenticate(user=self.user)

        # Create a category
        self.category = Category.objects.create(name='Electronics')

        # Create a product with one SKU
        self.product_data = {
            "name": "Test Product",
            "description": "Test Description",
            "base_price": "100.00",
            "category": "Electronics",
            "skus": [
                {
                    "sku_code": "SKU123",
                    "price": "100.00",
                    "stock": 10,
                    "sku_attribute": [
                        {"attribute": "Color", "value": "Red"}
                    ]
                }
            ]
        }
        
        # Create the product first
        response = self.client.post('/api/products/products/', self.product_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.product_id = response.data['id']
        self.sku_id = response.data['skus'][0]['id']

    def test_update_product_sku(self):
        """
        Test that updating a product with an existing SKU ID updates the SKU
        instead of creating a duplicate or failing with a unique constraint error.
        """
        update_data = {
            "name": "Updated Product Name",
            "description": "Updated Description",
            "base_price": "120.00",
            "category": "Electronics",
            "skus": [
                {
                    "id": self.sku_id,  # IMPORTANT: Passing the existing ID
                    "sku_code": "SKU123", # Same SKU code
                    "price": "150.00",    # Updated price
                    "stock": 20,          # Updated stock
                    "sku_attribute": [
                        {"attribute": "Color", "value": "Blue"} # Updated attribute
                    ]
                }
            ]
        }

        url = f'/api/products/products/{self.product_id}/'
        response = self.client.put(url, update_data, format='json')

        # Check for success
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify Product details updated
        self.product = Product.objects.get(id=self.product_id)
        self.assertEqual(self.product.name, "Updated Product Name")

        # Verify SKU details updated
        skus = ProductSKU.objects.filter(product=self.product)
        self.assertEqual(skus.count(), 1) # Should still be 1 SKU
        
        sku = skus.first()
        self.assertEqual(sku.sku_code, "SKU123")
        self.assertEqual(sku.price, 150.00)
        self.assertEqual(sku.stock, 20)
