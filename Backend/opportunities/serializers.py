from rest_framework import serializers
from .models import Opportunity
from users.serializers import UserSerializer

class OpportunitySerializer(serializers.ModelSerializer):
    company = serializers.SerializerMethodField()
    applicationCount = serializers.SerializerMethodField()
    isOpen = serializers.SerializerMethodField()
    slotsRemaining = serializers.SerializerMethodField()

    class Meta:
        model = Opportunity
        fields = '__all__'
        read_only_fields = ['company', 'slotsFilled', 'status', 'createdAt', 'publishedAt', 'approvedBy', 'reviewNote', 'durationWeeks']

    def get_company(self, obj):
        return {
            'id': obj.company.id,
            'name': obj.company.name,
            'industry': obj.company.industry,
            'town': obj.company.town,
            'location': obj.company.location,
            'verificationStatus': obj.company.verificationStatus
        }

    def get_applicationCount(self, obj):
        return obj.applications.count()

    def get_isOpen(self, obj):
        # basic check, should probably use `isOpportunityOpen` logic from frontend
        import datetime
        return obj.status == Opportunity.Status.PUBLISHED and obj.applicationDeadline >= datetime.date.today() and obj.slotsFilled < obj.slots

    def get_slotsRemaining(self, obj):
        return max(0, obj.slots - obj.slotsFilled)
