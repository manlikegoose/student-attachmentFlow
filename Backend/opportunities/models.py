from django.db import models
from users.models import CompanyProfile, User

class Opportunity(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        PENDING_APPROVAL = 'PENDING_APPROVAL', 'Pending Approval'
        PUBLISHED = 'PUBLISHED', 'Published'
        CLOSED = 'CLOSED', 'Closed'
        CANCELLED = 'CANCELLED', 'Cancelled'

    class WorkMode(models.TextChoices):
        ON_SITE = 'ON_SITE', 'On-site'
        REMOTE = 'REMOTE', 'Remote'
        HYBRID = 'HYBRID', 'Hybrid'

    title = models.CharField(max_length=255)
    description = models.TextField()
    company = models.ForeignKey(CompanyProfile, on_delete=models.CASCADE, related_name='opportunities')
    department = models.CharField(max_length=255)
    industry = models.CharField(max_length=255)
    location = models.CharField(max_length=255)
    town = models.CharField(max_length=255)
    workMode = models.CharField(max_length=20, choices=WorkMode.choices)
    startDate = models.DateField()
    endDate = models.DateField()
    durationWeeks = models.IntegerField(default=0)
    slots = models.IntegerField()
    slotsFilled = models.IntegerField(default=0)
    applicationDeadline = models.DateField()
    requirements = models.JSONField(default=list, blank=True)
    preferredSkills = models.JSONField(default=list, blank=True)
    responsibilities = models.JSONField(default=list, blank=True)
    status = models.CharField(max_length=50, choices=Status.choices, default=Status.DRAFT)
    createdAt = models.DateTimeField(auto_now_add=True)
    publishedAt = models.DateTimeField(null=True, blank=True)
    approvedBy = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_opportunities')
    reviewNote = models.TextField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if self.startDate and self.endDate:
            self.durationWeeks = max(1, (self.endDate - self.startDate).days // 7)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title
