from django.db import models
from django.utils import timezone
import uuid

class Notification(models.Model):
    class Type(models.TextChoices):
        INFO = 'INFO', 'Info'
        SUCCESS = 'SUCCESS', 'Success'
        WARNING = 'WARNING', 'Warning'
        ERROR = 'ERROR', 'Error'
        ACTION_REQUIRED = 'ACTION_REQUIRED', 'Action Required'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    userId = models.CharField(max_length=50) # matches DRF primary keys
    type = models.CharField(max_length=50, choices=Type.choices, default=Type.INFO)
    title = models.CharField(max_length=255)
    message = models.TextField()
    read = models.BooleanField(default=False)
    link = models.CharField(max_length=500, blank=True, null=True)
    createdAt = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.title} for {self.userId}"
