from django.test import TestCase
from django.contrib.auth import get_user_model

User = get_user_model()

class StudentRegistrationTest(TestCase):
    def test_create_student_profile(self):
        user = User.objects.create_user(
            username='caroline_qa',
            email='caroline@test.com',
            password='SecurePassword123!',
            first_name='Caroline',
            last_name='Toroitich'
        )
        self.assertEqual(user.first_name, 'Caroline')
        self.assertEqual(user.last_name, 'Toroitich')
        self.assertTrue(user.is_active)
        