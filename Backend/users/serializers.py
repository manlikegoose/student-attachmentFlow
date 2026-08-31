from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import StudentProfile, CompanyProfile
from django.db import transaction

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    profileId = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'profileId', 'first_name', 'last_name']
        # Frontend uses 'fullName', we can map it or keep first/last. Let's map it.

    def get_profileId(self, obj):
        if obj.role == User.Role.STUDENT and hasattr(obj, 'student_profile'):
            return f"std-{obj.student_profile.id}"
        elif obj.role == User.Role.COMPANY and hasattr(obj, 'company_profile'):
            return f"co-{obj.company_profile.id}"
        return ""

class StudentRegistrationSerializer(serializers.Serializer):
    fullName = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=20)
    password = serializers.CharField(write_only=True)
    studentNumber = serializers.CharField(max_length=100)
    university = serializers.CharField(max_length=255)
    programme = serializers.CharField(max_length=255)
    yearOfStudy = serializers.IntegerField()

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    def create(self, validated_data):
        with transaction.atomic():
            user = User.objects.create_user(
                username=validated_data['email'],
                email=validated_data['email'],
                password=validated_data['password'],
                first_name=validated_data['fullName'].split()[0],
                last_name=" ".join(validated_data['fullName'].split()[1:]),
                role=User.Role.STUDENT
            )
            StudentProfile.objects.create(
                user=user,
                fullName=validated_data['fullName'],
                phone=validated_data['phone'],
                studentNumber=validated_data['studentNumber'],
                university=validated_data['university'],
                programme=validated_data['programme'],
                yearOfStudy=validated_data['yearOfStudy']
            )
            return user

class CompanyRegistrationSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=20)
    password = serializers.CharField(write_only=True)
    location = serializers.CharField(max_length=255)
    town = serializers.CharField(max_length=255)
    industry = serializers.CharField(max_length=255)

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    def create(self, validated_data):
        with transaction.atomic():
            user = User.objects.create_user(
                username=validated_data['email'],
                email=validated_data['email'],
                password=validated_data['password'],
                first_name=validated_data['name'],
                role=User.Role.COMPANY
            )
            CompanyProfile.objects.create(
                user=user,
                name=validated_data['name'],
                phone=validated_data['phone'],
                location=validated_data['location'],
                town=validated_data['town'],
                industry=validated_data['industry']
            )
            return user

class StudentProfileSerializer(serializers.ModelSerializer):
    email = serializers.SerializerMethodField()
    
    class Meta:
        model = StudentProfile
        fields = '__all__'
        
    def get_email(self, obj):
        return obj.user.email
    assigned = serializers.SerializerMethodField()
    atCapacity = serializers.SerializerMethodField()
    overCapacity = serializers.SerializerMethodField()
    activePlacements = serializers.SerializerMethodField()
    completedPlacements = serializers.SerializerMethodField()
    pendingEvaluations = serializers.SerializerMethodField()

    def get_assigned(self, obj): return 0
    def get_atCapacity(self, obj): return False
    def get_overCapacity(self, obj): return False
    def get_activePlacements(self, obj): return 0
    def get_completedPlacements(self, obj): return 0
    def get_pendingEvaluations(self, obj): return 0

    applicationCount = serializers.SerializerMethodField()
    placementStatus = serializers.SerializerMethodField()
    companyName = serializers.SerializerMethodField()
    documentsApproved = serializers.SerializerMethodField()
    documentsTotal = serializers.SerializerMethodField()

    def get_applicationCount(self, obj): return 0
    def get_placementStatus(self, obj): return None
    def get_companyName(self, obj): return None
    def get_documentsApproved(self, obj): return 0
    def get_documentsTotal(self, obj): return 0


class CompanyProfileSerializer(serializers.ModelSerializer):
    email = serializers.SerializerMethodField()
    logoText = serializers.SerializerMethodField()
    
    class Meta:
        model = CompanyProfile
        fields = '__all__'
        
    def get_email(self, obj):
        return obj.user.email
    assigned = serializers.SerializerMethodField()
    atCapacity = serializers.SerializerMethodField()
    overCapacity = serializers.SerializerMethodField()
    activePlacements = serializers.SerializerMethodField()
    completedPlacements = serializers.SerializerMethodField()
    pendingEvaluations = serializers.SerializerMethodField()

    def get_assigned(self, obj): return 0
    def get_atCapacity(self, obj): return False
    def get_overCapacity(self, obj): return False
    def get_activePlacements(self, obj): return 0
    def get_completedPlacements(self, obj): return 0
    def get_pendingEvaluations(self, obj): return 0

        
    def get_logoText(self, obj):
        return obj.name[:2].upper()
    opportunityCount = serializers.SerializerMethodField()
    publishedOpportunityCount = serializers.SerializerMethodField()
    applicantCount = serializers.SerializerMethodField()
    activeInterns = serializers.SerializerMethodField()

    def get_opportunityCount(self, obj): return 0
    def get_publishedOpportunityCount(self, obj): return 0
    def get_applicantCount(self, obj): return 0
    def get_activeInterns(self, obj): return 0


from .models import SupervisorProfile
class SupervisorProfileSerializer(serializers.ModelSerializer):
    email = serializers.SerializerMethodField()
    
    class Meta:
        model = SupervisorProfile
        fields = '__all__'
        
    def get_email(self, obj):
        return obj.user.email
    assigned = serializers.SerializerMethodField()
    atCapacity = serializers.SerializerMethodField()
    overCapacity = serializers.SerializerMethodField()
    activePlacements = serializers.SerializerMethodField()
    completedPlacements = serializers.SerializerMethodField()
    pendingEvaluations = serializers.SerializerMethodField()

    def get_assigned(self, obj): return 0
    def get_atCapacity(self, obj): return False
    def get_overCapacity(self, obj): return False
    def get_activePlacements(self, obj): return 0
    def get_completedPlacements(self, obj): return 0
    def get_pendingEvaluations(self, obj): return 0

