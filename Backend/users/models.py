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

class StudentProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student_profile')
    fullName = models.CharField(max_length=255)
    phone = models.CharField(max_length=20, blank=True)
    studentNumber = models.CharField(max_length=100)
    university = models.CharField(max_length=255)
    programme = models.CharField(max_length=255)
    yearOfStudy = models.IntegerField()
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.fullName

class CompanyProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='company_profile')
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20, blank=True)
    location = models.CharField(max_length=255)
    town = models.CharField(max_length=255)
    industry = models.CharField(max_length=255)
    verificationStatus = models.CharField(max_length=50, default='REGISTERED')
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name
