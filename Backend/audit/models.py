from django.db import models
from django.utils import timezone
import uuid

class AuditLogEntry(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    actorId = models.CharField(max_length=50)
    actorName = models.CharField(max_length=255)
    actorRole = models.CharField(max_length=50)
    action = models.CharField(max_length=50)
    objectType = models.CharField(max_length=50)
    objectId = models.CharField(max_length=50)
    objectLabel = models.CharField(max_length=255)
    createdAt = models.DateTimeField(default=timezone.now)
    metadata = models.JSONField(blank=True, null=True)

    def __str__(self):
        return f"{self.actorName} performed {self.action} on {self.objectType}"
