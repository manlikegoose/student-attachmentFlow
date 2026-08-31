from django.db import models

class SupervisionReport(models.Model):
    class Type(models.TextChoices):
        VIRTUAL = 'VIRTUAL', 'Virtual'
        IN_PERSON = 'IN_PERSON', 'In Person'
        
    placementId = models.CharField(max_length=100)
    supervisorId = models.CharField(max_length=100)
    studentId = models.CharField(max_length=100)
    date = models.DateField()
    type = models.CharField(max_length=20, choices=Type.choices)
    notes = models.TextField()
    rating = models.IntegerField()
    submitted = models.BooleanField(default=False)
    submittedAt = models.DateTimeField(null=True, blank=True)
    createdAt = models.DateTimeField(auto_now_add=True)

class ProgressReport(models.Model):
    placementId = models.CharField(max_length=100)
    studentId = models.CharField(max_length=100)
    periodStart = models.DateField()
    periodEnd = models.DateField()
    activitiesCompleted = models.TextField()
    skillsLearned = models.TextField()
    challenges = models.TextField()
    achievements = models.TextField()
    nextGoals = models.TextField()
    
    supervisorFeedback = models.TextField(blank=True, null=True)
    reviewedById = models.CharField(max_length=100, blank=True, null=True)
    reviewedAt = models.DateTimeField(null=True, blank=True)
    submittedAt = models.DateTimeField(auto_now_add=True)

class Evaluation(models.Model):
    placementId = models.CharField(max_length=100)
    studentId = models.CharField(max_length=100)
    evaluatorId = models.CharField(max_length=100)
    evaluatorRole = models.CharField(max_length=50) # 'SUPERVISOR' or 'COMPANY'
    
    technicalSkills = models.IntegerField(default=0)
    communication = models.IntegerField(default=0)
    workEthic = models.IntegerField(default=0)
    initiative = models.IntegerField(default=0)
    overallScore = models.IntegerField(default=0)
    recommendation = models.CharField(max_length=100)
    feedback = models.TextField()
    
    locked = models.BooleanField(default=False)
    lockedAt = models.DateTimeField(null=True, blank=True)
    createdAt = models.DateTimeField(auto_now_add=True)
