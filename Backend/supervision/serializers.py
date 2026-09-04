from rest_framework import serializers
from .models import SupervisionReport, ProgressReport, Evaluation
from users.models import StudentProfile, SupervisorProfile, CompanyProfile
from applications.models import Placement

class StudentBriefSerializer(serializers.ModelSerializer):
    fullName = serializers.CharField(source='fullName', read_only=True)
    studentNumber = serializers.CharField(source='studentNumber', read_only=True)
    programme = serializers.CharField(source='programme', read_only=True)
    department = serializers.CharField(source='user.student_profile.programme', read_only=True)
    yearOfStudy = serializers.IntegerField(source='yearOfStudy', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    phone = serializers.CharField(source='phone', read_only=True)
    
    class Meta:
        model = StudentProfile
        fields = ['id', 'fullName', 'studentNumber', 'programme', 'department', 'yearOfStudy', 'email', 'phone']

class SupervisionReportSerializer(serializers.ModelSerializer):
    student = serializers.SerializerMethodField()
    companyName = serializers.SerializerMethodField()

    class Meta:
        model = SupervisionReport
        fields = '__all__'
        
    def get_student(self, obj):
        try:
            student_profile = StudentProfile.objects.get(id=obj.studentId)
            return StudentBriefSerializer(student_profile).data
        except StudentProfile.DoesNotExist:
            return None

    def get_companyName(self, obj):
        try:
            placement = Placement.objects.get(id=obj.placementId)
            return placement.company.name
        except Placement.DoesNotExist:
            return None

class ProgressReportSerializer(serializers.ModelSerializer):
    student = serializers.SerializerMethodField()
    companyName = serializers.SerializerMethodField()
    reviewedBy = serializers.SerializerMethodField()

    class Meta:
        model = ProgressReport
        fields = '__all__'
        
    def get_student(self, obj):
        try:
            student_profile = StudentProfile.objects.get(id=obj.studentId)
            return StudentBriefSerializer(student_profile).data
        except StudentProfile.DoesNotExist:
            return None

    def get_companyName(self, obj):
        try:
            placement = Placement.objects.get(id=obj.placementId)
            return placement.company.name
        except Placement.DoesNotExist:
            return None
            
    def get_reviewedBy(self, obj):
        if not obj.reviewedById:
            return None
        try:
            supervisor = SupervisorProfile.objects.get(id=obj.reviewedById)
            return {
                'id': supervisor.id,
                'name': supervisor.user.get_full_name(),
                'department': supervisor.department
            }
        except SupervisorProfile.DoesNotExist:
            return None

class EvaluationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Evaluation
        fields = '__all__'
