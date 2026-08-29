from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    class Role(models.TextChoices):
        STUDENT = 'STUDENT', 'Student'
        COMPANY = 'COMPANY', 'Company'
        COORDINATOR = 'COORDINATOR', 'Coordinator'
        SUPERVISOR = 'SUPERVISOR', 'Supervisor'

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.STUDENT)

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
