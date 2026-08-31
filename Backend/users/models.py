from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    class Role(models.TextChoices):
        STUDENT = 'STUDENT', 'Student'
        COMPANY = 'COMPANY', 'Company'
        COORDINATOR = 'COORDINATOR', 'Coordinator'
        SUPERVISOR = 'SUPERVISOR', 'Supervisor'
        ADMIN = 'ADMIN', 'Admin'

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

class SupervisorProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='supervisor_profile')
    fullName = models.CharField(max_length=255)
    phone = models.CharField(max_length=20, blank=True)
    staffNumber = models.CharField(max_length=100)
    department = models.CharField(max_length=255)
    faculty = models.CharField(max_length=255)
    title = models.CharField(max_length=100)
    capacity = models.IntegerField(default=5)
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.fullName

class CoordinatorProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='coordinator_profile')
    fullName = models.CharField(max_length=255)
    phone = models.CharField(max_length=20, blank=True)
    staffNumber = models.CharField(max_length=100)
    department = models.CharField(max_length=255)
    title = models.CharField(max_length=100)
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.fullName

class WorkplaceSupervisor(models.Model):
    company = models.ForeignKey(CompanyProfile, on_delete=models.CASCADE, related_name='workplace_supervisors')
    fullName = models.CharField(max_length=255)
    jobTitle = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True)
    department = models.CharField(max_length=255)
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.fullName
