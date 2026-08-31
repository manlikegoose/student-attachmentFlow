from django.db import models
from django.conf import settings

class DocumentRecord(models.Model):
    class Type(models.TextChoices):
        CV = 'CV', 'CV'
        INSURANCE = 'INSURANCE', 'Insurance'
        LOGBOOK = 'LOGBOOK', 'Logbook'
        REPORT = 'REPORT', 'Report'
        OTHER = 'OTHER', 'Other'

    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'

    ownerId = models.CharField(max_length=100)
    ownerRole = models.CharField(max_length=20)
    type = models.CharField(max_length=20, choices=Type.choices)
    file = models.FileField(upload_to='documents/')
    filename = models.CharField(max_length=255)
    mimeType = models.CharField(max_length=100)
    sizeBytes = models.IntegerField()
    uploadedAt = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    
    reviewedById = models.CharField(max_length=100, blank=True, null=True)
    reviewedAt = models.DateTimeField(blank=True, null=True)
    reviewComment = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.filename
