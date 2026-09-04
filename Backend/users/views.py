from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from .serializers import UserSerializer, StudentRegistrationSerializer, CompanyRegistrationSerializer

User = get_user_model()

class RegisterStudentView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = StudentRegistrationSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_201_CREATED)

class RegisterCompanyView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = CompanyRegistrationSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_201_CREATED)

class CurrentUserView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user

from rest_framework import viewsets
from .models import StudentProfile, CompanyProfile, SupervisorProfile
from .serializers import StudentProfileSerializer, CompanyProfileSerializer, SupervisorProfileSerializer

class StudentProfileViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = StudentProfile.objects.all()
    serializer_class = StudentProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        search = self.request.query_params.get('search')
        if search:
            from django.db.models import Q
            queryset = queryset.filter(
                Q(fullName__icontains=search) |
                Q(studentNumber__icontains=search)
            )
        return queryset

from rest_framework.decorators import action
from .models import WorkplaceSupervisor
from .serializers import WorkplaceSupervisorSerializer

class CompanyProfileViewSet(viewsets.ModelViewSet):
    queryset = CompanyProfile.objects.all()
    serializer_class = CompanyProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(name__icontains=search)
        return queryset

    def perform_update(self, serializer):
        user = self.request.user
        if user.role != User.Role.COMPANY or getattr(user, 'company_profile', None) != self.get_object():
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only update your own profile.")
        serializer.save()

    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        company = self.get_object()
        decision = request.data.get('decision')
        notes = request.data.get('notes', '')
        
        if decision == 'PENDING_VERIFICATION':
            if request.user.role != User.Role.COMPANY or request.user.company_profile != company:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("Only the company can request verification.")
            company.verificationStatus = 'PENDING_VERIFICATION'
        elif decision in ['VERIFIED', 'REJECTED']:
            if request.user.role not in [User.Role.COORDINATOR, User.Role.ADMIN]:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("Only coordinators can verify companies.")
            company.verificationStatus = decision
        else:
            return Response({"detail": "Invalid decision"}, status=status.HTTP_400_BAD_REQUEST)
            
        company.save()
        return Response(self.get_serializer(company).data)

    @action(detail=True, methods=['get', 'post'])
    def supervisors(self, request, pk=None):
        company = self.get_object()
        
        if request.method == 'GET':
            supervisors = WorkplaceSupervisor.objects.filter(company=company)
            serializer = WorkplaceSupervisorSerializer(supervisors, many=True)
            return Response(serializer.data)
            
        elif request.method == 'POST':
            if request.user.role != User.Role.COMPANY or request.user.company_profile != company:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("Only the company can add supervisors.")
                
            serializer = WorkplaceSupervisorSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            serializer.save(company=company)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['delete'], url_path=r'supervisors/(?P<sup_id>[^/.]+)')
    def delete_supervisor(self, request, sup_id=None, pk=None):
        company = self.get_object()
        if request.user.role != User.Role.COMPANY or request.user.company_profile != company:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only the company can delete supervisors.")
            
        try:
            supervisor = WorkplaceSupervisor.objects.get(id=sup_id, company=company)
            supervisor.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except WorkplaceSupervisor.DoesNotExist:
            from rest_framework.exceptions import NotFound
            raise NotFound("Supervisor not found.")

class SupervisorProfileViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = SupervisorProfile.objects.all()
    serializer_class = SupervisorProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(fullName__icontains=search)
        return queryset

