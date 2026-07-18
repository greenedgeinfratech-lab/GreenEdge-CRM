from django.test import TestCase
from django.urls import reverse
from users.models import User, Company

class AuthTestCase(TestCase):
    def setUp(self):
        self.company = Company.objects.create(name="Test Company")
        self.user = User.objects.create_user(
            email="testuser@example.com", 
            password="testpassword123",
            company=self.company
        )

    def test_login(self):
        url = reverse('token_obtain_pair')
        response = self.client.post(url, {
            'email': 'testuser@example.com',
            'password': 'testpassword123'
        }, format='json')
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['message'], "Login successful")
        
        # Check if cookies are set
        self.assertIn('access_token', response.cookies)
        self.assertIn('refresh_token', response.cookies)

    def test_get_current_user_authenticated(self):
        # Login first
        login_url = reverse('token_obtain_pair')
        response = self.client.post(login_url, {
            'email': 'testuser@example.com',
            'password': 'testpassword123'
        }, format='json')
        
        access_token = response.cookies['access_token'].value
        
        # Access protected endpoint
        me_url = reverse('auth_me')
        response = self.client.get(
            me_url, 
            HTTP_AUTHORIZATION=f'Bearer {access_token}'
        )
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['email'], 'testuser@example.com')
        self.assertEqual(response.data['company']['name'], 'Test Company')
