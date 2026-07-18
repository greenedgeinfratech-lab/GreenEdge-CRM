from rest_framework.renderers import JSONRenderer

class CustomJSONRenderer(JSONRenderer):
    def render(self, data, accepted_media_type=None, renderer_context=None):
        status_code = renderer_context['response'].status_code
        
        # If the response is already formatted by our exception handler, return it as is.
        if isinstance(data, dict) and 'success' in data and 'message' in data and 'errors' in data:
            return super(CustomJSONRenderer, self).render(data, accepted_media_type, renderer_context)

        # Handle successful responses (2xx)
        if 200 <= status_code < 300:
            response_data = {
                'success': True,
                'message': 'Success',
                'data': data,
                'errors': None
            }
            return super(CustomJSONRenderer, self).render(response_data, accepted_media_type, renderer_context)
        
        # Fallback for unexpected formats
        return super(CustomJSONRenderer, self).render(data, accepted_media_type, renderer_context)
