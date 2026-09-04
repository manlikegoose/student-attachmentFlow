from rest_framework import serializers
from .models import Application, Placement
from users.serializers import UserSerializer

class ApplicationSerializer(serializers.ModelSerializer):
    student = serializers.SerializerMethodField()
    opportunity = serializers.SerializerMethodField()
    company = serializers.SerializerMethodField()
    documents = serializers.SerializerMethodField()

    class Meta:
        model = Application
        fields = '__all__'
        read_only_fields = ['student', 'company', 'status', 'submittedAt', 'updatedAt', 
                            'companyDecisionBy', 'companyDecisionAt', 'companyDecisionReason',
                            'universityDecisionBy', 'universityDecisionAt', 'universityDecisionReason', 'revisionRequested']

    def get_student(self, obj):
        return {
            'id': obj.student.id,
            'fullName': obj.student.fullName,
            'studentNumber': obj.student.studentNumber,
            'programme': obj.student.programme,
            'department': obj.student.user.student_profile.programme, # mapping simplified
            'yearOfStudy': obj.student.yearOfStudy,
            'email': obj.student.user.email,
            'phone': obj.student.phone
        }

    def get_opportunity(self, obj):
        return {
            'id': obj.opportunity.id,
            'title': obj.opportunity.title,
            'startDate': obj.opportunity.startDate,
            'endDate': obj.opportunity.endDate,
            'town': obj.opportunity.town,
            'workMode': obj.opportunity.workMode,
            'department': obj.opportunity.department
        }

    def get_company(self, obj):
        return {
            'id': obj.company.id,
            'name': obj.company.name,
            'logoText': obj.company.name[:2].upper(),
            'industry': obj.company.industry,
            'town': obj.company.town,
            'location': obj.company.location,
            'verificationStatus': obj.company.verificationStatus
        }

    def get_documents(self, obj):
        # We don't have a Document model yet, so we return empty array for now
        return []

class PlacementSerializer(serializers.ModelSerializer):
    student = serializers.SerializerMethodField()
    opportunity = serializers.SerializerMethodField()
    company = serializers.SerializerMethodField()
    workplaceSupervisor = serializers.SerializerMethodField()
    academicSupervisor = serializers.SerializerMethodField()
    supervisionCount = serializers.SerializerMethodField()
    lastSupervisionDate = serializers.SerializerMethodField()
    supervisionOverdue = serializers.SerializerMethodField()
    evaluation = serializers.SerializerMethodField()
    progressReportCount = serializers.SerializerMethodField()

    class Meta:
        model = Placement
        fields = '__all__'
        
    def get_student(self, obj):
        return {
            'id': obj.student.id,
            'fullName': obj.student.fullName,
            'studentNumber': obj.student.studentNumber,
            'programme': obj.student.programme,
            'department': obj.student.user.student_profile.programme,
            'yearOfStudy': obj.student.yearOfStudy,
            'email': obj.student.user.email,
            'phone': obj.student.phone
        }

    def get_opportunity(self, obj):
        return {
            'id': obj.opportunity.id,
            'title': obj.opportunity.title,
            'startDate': obj.opportunity.startDate,
            'endDate': obj.opportunity.endDate,
            'town': obj.opportunity.town,
            'workMode': obj.opportunity.workMode,
            'department': obj.opportunity.department
        }

    def get_company(self, obj):
        return {
            'id': obj.company.id,
            'name': obj.company.name,
            'logoText': obj.company.name[:2].upper(),
            'industry': obj.company.industry,
            'town': obj.company.town,
            'location': obj.company.location,
            'verificationStatus': obj.company.verificationStatus
        }
        
    def get_workplaceSupervisor(self, obj):
        from users.models import WorkplaceSupervisor
        if obj.workplaceSupervisorId:
            try:
                sup = WorkplaceSupervisor.objects.get(id=obj.workplaceSupervisorId)
                return {
                    'id': sup.id,
                    'name': sup.name,
                    'email': sup.email,
                    'phone': sup.phone,
                    'designation': sup.designation,
                    'companyId': sup.company.id
                }
            except WorkplaceSupervisor.DoesNotExist:
                return None
        return None
        
    def get_academicSupervisor(self, obj):
        from users.models import SupervisorProfile
        if obj.academicSupervisorId:
            try:
                sup = SupervisorProfile.objects.get(id=obj.academicSupervisorId)
                return {
                    'id': sup.id,
                    'name': sup.user.get_full_name(),
                    'email': sup.user.email,
                    'department': sup.department,
                    'atCapacity': False
                }
            except SupervisorProfile.DoesNotExist:
                return None
        return None
        
    def get_supervisionCount(self, obj):
        from supervision.models import SupervisionReport
        return SupervisionReport.objects.filter(placementId=obj.id, submitted=True).count()
        
    def get_lastSupervisionDate(self, obj):
        from supervision.models import SupervisionReport
        last_report = SupervisionReport.objects.filter(placementId=obj.id, submitted=True).order_by('-date').first()
        if last_report:
            return last_report.date
        return None
        
    def get_supervisionOverdue(self, obj):
        # Simplistic logic: Overdue if active for 30+ days and no supervision, or 30+ days since last supervision
        from supervision.models import SupervisionReport
        from django.utils import timezone
        import datetime
        if obj.status != 'ACTIVE':
            return False
            
        last_report = SupervisionReport.objects.filter(placementId=obj.id, submitted=True).order_by('-date').first()
        if last_report:
            diff = timezone.now().date() - last_report.date
            return diff.days > 30
        else:
            diff = timezone.now().date() - obj.startDate
            return diff.days > 30
        return False
        
    def get_evaluation(self, obj):
        from supervision.models import Evaluation
        from supervision.serializers import EvaluationSerializer
        eval = Evaluation.objects.filter(placementId=obj.id).first()
        if eval:
            return EvaluationSerializer(eval).data
        return None
        
    def get_progressReportCount(self, obj):
        from supervision.models import ProgressReport
        return ProgressReport.objects.filter(placementId=obj.id).count()
