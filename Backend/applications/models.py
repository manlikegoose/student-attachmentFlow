from django.db import models
from users.models import StudentProfile, CompanyProfile, User
from opportunities.models import Opportunity

class Application(models.Model):
    class Status(models.TextChoices):
        SUBMITTED = 'SUBMITTED', 'Submitted'
        WITHDRAWN = 'WITHDRAWN', 'Withdrawn'
        COMPANY_REVIEW = 'COMPANY_REVIEW', 'Company Review'
        COMPANY_REJECTED = 'COMPANY_REJECTED', 'Company Rejected'
        UNIVERSITY_REVIEW = 'UNIVERSITY_REVIEW', 'University Review'
        UNIVERSITY_REJECTED = 'UNIVERSITY_REJECTED', 'University Rejected'
        UNIVERSITY_APPROVED = 'UNIVERSITY_APPROVED', 'University Approved'

    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='applications')
    opportunity = models.ForeignKey(Opportunity, on_delete=models.CASCADE, related_name='applications')
    company = models.ForeignKey(CompanyProfile, on_delete=models.CASCADE, related_name='applications')
    
    status = models.CharField(max_length=50, choices=Status.choices, default=Status.SUBMITTED)
    coverLetter = models.TextField()
    documentIds = models.JSONField(default=list, blank=True)
    
    submittedAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)
    
    companyDecisionBy = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='company_decisions')
    companyDecisionAt = models.DateTimeField(null=True, blank=True)
    companyDecisionReason = models.TextField(null=True, blank=True)
    
    universityDecisionBy = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='university_decisions')
    universityDecisionAt = models.DateTimeField(null=True, blank=True)
    universityDecisionReason = models.TextField(null=True, blank=True)
    revisionRequested = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.student.fullName} - {self.opportunity.title}"

class Placement(models.Model):
    class Status(models.TextChoices):
        APPROVED = 'APPROVED', 'Approved'
        ACTIVE = 'ACTIVE', 'Active'
        COMPLETED = 'COMPLETED', 'Completed'
        TERMINATED = 'TERMINATED', 'Terminated'

    application = models.OneToOneField(Application, on_delete=models.CASCADE, related_name='placement')
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='placements')
    company = models.ForeignKey(CompanyProfile, on_delete=models.CASCADE, related_name='placements')
    opportunity = models.ForeignKey(Opportunity, on_delete=models.CASCADE, related_name='placements')
    
    startDate = models.DateField()
    endDate = models.DateField()
    workplaceSupervisorId = models.CharField(max_length=255, null=True, blank=True)
    academicSupervisorId = models.CharField(max_length=255, null=True, blank=True)
    
    status = models.CharField(max_length=50, choices=Status.choices, default=Status.APPROVED)
    
    approvedAt = models.DateTimeField(null=True, blank=True)
    approvedBy = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_placements')
    supervisorAssignedAt = models.DateTimeField(null=True, blank=True)
    completedAt = models.DateTimeField(null=True, blank=True)
    createdAt = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Placement: {self.student.fullName} at {self.company.name}"
