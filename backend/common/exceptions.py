from rest_framework.views import exception_handler
from rest_framework.response import Response

def custom_exception_handler(exc, context):
    # Call REST framework's default exception handler first,
    # to get the standard error response.
    response = exception_handler(exc, context)

    # Now add the standard response format.
    if response is not None:
        custom_response_data = {
            'success': False,
            'message': 'An error occurred.',
            'data': None,
            'errors': response.data
        }
        
        # Determine a friendly message based on status code
        if response.status_code == 404:
            custom_response_data['message'] = 'Not found.'
        elif response.status_code == 400:
            custom_response_data['message'] = 'Bad request.'
        elif response.status_code == 401:
            custom_response_data['message'] = 'Authentication failed.'
        elif response.status_code == 403:
            custom_response_data['message'] = 'Permission denied.'
            
        response.data = custom_response_data

    return response
