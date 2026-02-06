from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth import get_user_model
from urllib.parse import parse_qs

User = get_user_model()

@database_sync_to_async
def get_user(token_key):
    try:
        # Verify the token and get the user
        token = AccessToken(token_key)
        user_id = token['user_id']
        return User.objects.get(id=user_id)
    except Exception as e:
        return AnonymousUser()

class JwtAuthMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        # Look up user from query string (e.g. ?token=...)
        query_string = scope.get('query_string', b'').decode()
        query_params = parse_qs(query_string)
        token = query_params.get('token', [None])[0]

        if token:
            print(f"DEBUG: Found token: {token[:10]}...")
            scope['user'] = await get_user(token)
            print(f"DEBUG: User authenticated: {scope['user']}")
        else:
            print("DEBUG: No token found")
            scope['user'] = AnonymousUser()

        return await self.app(scope, receive, send)
