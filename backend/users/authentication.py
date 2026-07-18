from rest_framework_simplejwt.authentication import JWTAuthentication
from django.conf import settings

class CookieJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        header = self.get_header(request)
        
        # If the header exists, use the default behavior (useful for mobile apps/external API clients)
        if header is not None:
            raw_token = self.get_raw_token(header)
        else:
            # Otherwise, try to extract the token from cookies
            raw_token = request.COOKIES.get('access_token')

        if raw_token is None:
            return None

        # Validate the token
        validated_token = self.get_validated_token(raw_token)

        return self.get_user(validated_token), validated_token
