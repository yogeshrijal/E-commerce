"""
URL configuration for EMarket project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path,include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenObtainPairView ,TokenRefreshView,TokenVerifyView
from rest_framework.routers import DefaultRouter
from Users.views import UserViewSet
from Products.views import ProductViewSet,CategoryViewSet
from Orders.views import OrderViewSet
from shipping.views import GlobalShippingSerializerViewset,ShippingZoneViewset
from Reviews.views import ReviewViewset
from Payments.views import PaymentViewSet
router=DefaultRouter()
router.register('user',UserViewSet,basename='user')
router.register('category',CategoryViewSet,basename='category')
router.register('product',ProductViewSet,basename='product')
router.register('order',OrderViewSet,basename='order')
router.register('shippingzone',ShippingZoneViewset,basename='shippingzone')
router.register('globalshippingrate',GlobalShippingSerializerViewset,basename='globalshippingrate')
router.register('review',ReviewViewset,basename='review')
router.register('payment',PaymentViewSet,basename='payment')


urlpatterns = [
    path('admin/', admin.site.urls),
    path('gettoken/',TokenObtainPairView.as_view()),
    path('verifytoken/',TokenVerifyView.as_view()),
    path('tokenrefresh/',TokenRefreshView.as_view()),
    path('',include(router.urls)),
     path('api_auth/', include('rest_framework.urls')),

]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)