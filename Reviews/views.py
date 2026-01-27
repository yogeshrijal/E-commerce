from django.shortcuts import render
from Reviews.models import Review
from Reviews.serializers import ReviewSeralizers
from rest_framework import viewsets
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import IsAuthenticated

# Create your views here.
class ReviewViewset(viewsets.ModelViewSet):
    queryset=Review.objects.all()
    serializer_class=[ReviewSeralizers]
    authentication_classes=[JWTAuthentication]
    permission_classes=[IsAuthenticated]



    def perform_create(self, serializer):
        serializer.save(user=self.request.user)   