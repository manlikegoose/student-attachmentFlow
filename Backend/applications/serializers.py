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
    class Meta:
        model = Placement
        fields = '__all__'
