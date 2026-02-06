"""
ASGI config for EMarket project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/6.0/howto/deployment/asgi/
"""
import os
import django
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'EMarket.settings')
django.setup()

# Import these AFTER django.setup()
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.routing import ProtocolTypeRouter, URLRouter
from .middleware import JwtAuthMiddleware
from Chats.route import websocket_urlpatterns  # Import your routes here

application = ProtocolTypeRouter({
    # Django's ASGI application to handle traditional HTTP requests
    "http": get_asgi_application(),

    # WebSocket handler
    "websocket": JwtAuthMiddleware(
        URLRouter(
            websocket_urlpatterns
        )
    ),
})