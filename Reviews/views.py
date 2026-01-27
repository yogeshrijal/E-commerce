from django.shortcuts import render
from Reviews.models import Review
from Reviews.serializers import ReviewSeralizers
from rest_framework import viewsets
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.filters import OrderingFilter

# Create your views here.
class ReviewViewset(viewsets.ModelViewSet):
    queryset=Review.objects.all()
    serializer_class=ReviewSeralizers
    authentication_classes=[JWTAuthentication]
    permission_classes=[IsAuthenticated]
    filter_backends=[OrderingFilter]
    ordering_fields=['rating']




    def perform_create(self, serializer):
        serializer.save(user=self.request.user)    