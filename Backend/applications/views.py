from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Application, Placement
from .serializers import ApplicationSerializer, PlacementSerializer
from users.models import User
from opportunities.models import Opportunity

class ApplicationViewSet(viewsets.ModelViewSet):
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Application.objects.all().order_by('-submittedAt')

        if user.role == User.Role.STUDENT:
            queryset = queryset.filter(student=user.student_profile)
        elif user.role == User.Role.COMPANY:
            queryset = queryset.filter(company=user.company_profile)
        elif user.role not in [User.Role.COORDINATOR, User.Role.SUPERVISOR, User.Role.ADMIN]:
            return queryset.none()
            
        # Apply filters
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
            
        student_id = self.request.query_params.get('studentId')
        if student_id:
            queryset = queryset.filter(student__id=student_id)
            
        company_id = self.request.query_params.get('companyId')
        if company_id:
            queryset = queryset.filter(company__id=company_id)
            
        opportunity_id = self.request.query_params.get('opportunityId')
        if opportunity_id:
            queryset = queryset.filter(opportunity__id=opportunity_id)
            
        awaiting = self.request.query_params.get('awaitingUniversityReview')
        if awaiting and awaiting.lower() == 'true':
            queryset = queryset.filter(status=Application.Status.UNIVERSITY_REVIEW)
            
        search = self.request.query_params.get('search')
        if search:
            from django.db.models import Q
            queryset = queryset.filter(
                Q(student__fullName__icontains=search) |
                Q(student__studentNumber__icontains=search) |
                Q(company__name__icontains=search) |
                Q(opportunity__title__icontains=search)
            )

        return queryset

    def perform_create(self, serializer):
        user = self.request.user
        if user.role != User.Role.STUDENT:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only students can apply.")
        
        opportunity_id = self.request.data.get('opportunityId')
        try:
            opportunity = Opportunity.objects.get(id=opportunity_id)
        except Opportunity.DoesNotExist:
            from rest_framework.exceptions import NotFound
            raise NotFound("Opportunity not found.")
            
        serializer.save(
            student=user.student_profile,
            opportunity=opportunity,
            company=opportunity.company,
            status=Application.Status.SUBMITTED
        )

    @action(detail=True, methods=['post'])
    def withdraw(self, request, pk=None):
        application = self.get_object()
        if request.user.role != User.Role.STUDENT or application.student.user != request.user:
            return Response({'detail': 'Not permitted'}, status=status.HTTP_403_FORBIDDEN)
            
        if application.status not in [Application.Status.SUBMITTED, Application.Status.COMPANY_REVIEW]:
            return Response({'detail': 'Cannot withdraw'}, status=status.HTTP_400_BAD_REQUEST)
            
        application.status = Application.Status.WITHDRAWN
        application.save()
        return Response(self.get_serializer(application).data)

    @action(detail=True, methods=['post'], url_path='company-decision')
    def company_decision(self, request, pk=None):
        application = self.get_object()
        if request.user.role != User.Role.COMPANY or application.company.user != request.user:
            return Response({'detail': 'Not permitted'}, status=status.HTTP_403_FORBIDDEN)
            
        decision = request.data.get('decision')
        reason = request.data.get('reason', '')
        
        if decision == 'ACCEPT':
            application.status = Application.Status.UNIVERSITY_REVIEW
        elif decision == 'REJECT':
            application.status = Application.Status.COMPANY_REJECTED
            if not reason:
                return Response({'reason': ['Required']}, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response({'detail': 'Invalid decision'}, status=status.HTTP_400_BAD_REQUEST)
            
        application.companyDecisionBy = request.user
        application.companyDecisionAt = timezone.now()
        application.companyDecisionReason = reason
        application.save()
        return Response(self.get_serializer(application).data)

    @action(detail=True, methods=['post'], url_path='university-decision')
    def university_decision(self, request, pk=None):
        if request.user.role not in [User.Role.COORDINATOR, User.Role.ADMIN]:
            return Response({'detail': 'Not permitted'}, status=status.HTTP_403_FORBIDDEN)
            
        application = self.get_object()
        decision = request.data.get('decision')
        reason = request.data.get('reason', '')
        
        placement_id = None
        
        if decision == 'REQUEST_REVISION':
            application.revisionRequested = True
            application.universityDecisionReason = reason
        elif decision == 'REJECT':
            application.status = Application.Status.UNIVERSITY_REJECTED
            application.universityDecisionBy = request.user
            application.universityDecisionAt = timezone.now()
            application.universityDecisionReason = reason
            if not reason:
                 return Response({'reason': ['Required']}, status=status.HTTP_400_BAD_REQUEST)
        elif decision == 'APPROVE':
            application.status = Application.Status.UNIVERSITY_APPROVED
            application.universityDecisionBy = request.user
            application.universityDecisionAt = timezone.now()
            application.universityDecisionReason = reason
            
            placement = Placement.objects.create(
                application=application,
                student=application.student,
                company=application.company,
                opportunity=application.opportunity,
                startDate=application.opportunity.startDate,
                endDate=application.opportunity.endDate,
                status=Placement.Status.APPROVED,
                approvedAt=timezone.now(),
                approvedBy=request.user
            )
            placement_id = placement.id
            
            # update opportunity slots
            opportunity = application.opportunity
            opportunity.slotsFilled = min(opportunity.slots, opportunity.slotsFilled + 1)
            if opportunity.slotsFilled >= opportunity.slots and opportunity.status == Opportunity.Status.PUBLISHED:
                opportunity.status = Opportunity.Status.CLOSED
            opportunity.save()
            
            # withdraw other pending applications for this student
            pending_others = Application.objects.filter(
                student=application.student, 
                status__in=[Application.Status.SUBMITTED, Application.Status.COMPANY_REVIEW, Application.Status.UNIVERSITY_REVIEW]
            ).exclude(id=application.id)
            for app in pending_others:
                app.status = Application.Status.WITHDRAWN
                app.save()
        else:
            return Response({'detail': 'Invalid decision'}, status=status.HTTP_400_BAD_REQUEST)
            
        application.save()
        
        response_data = {
            'application': self.get_serializer(application).data,
            'placementId': placement_id
        }
        return Response(response_data)

class PlacementViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PlacementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Placement.objects.all().order_by('-startDate')

        if user.role == User.Role.STUDENT:
            queryset = queryset.filter(student=user.student_profile)
        elif user.role == User.Role.COMPANY:
            queryset = queryset.filter(company=user.company_profile)
        elif user.role not in [User.Role.COORDINATOR, User.Role.SUPERVISOR, User.Role.ADMIN]:
            return queryset.none()
            
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
            
        student_id = self.request.query_params.get('studentId')
        if student_id:
            queryset = queryset.filter(student__id=student_id)
            
        company_id = self.request.query_params.get('companyId')
        if company_id:
            queryset = queryset.filter(company__id=company_id)
            
        supervisor_id = self.request.query_params.get('supervisorId')
        if supervisor_id:
            queryset = queryset.filter(academicSupervisorId=supervisor_id)
            
        unassigned = self.request.query_params.get('unassignedOnly')
        if unassigned and unassigned.lower() == 'true':
            from django.db.models import Q
            queryset = queryset.filter(Q(academicSupervisorId__isnull=True) | Q(academicSupervisorId=''))
            
        search = self.request.query_params.get('search')
        if search:
            from django.db.models import Q
            queryset = queryset.filter(
                Q(student__fullName__icontains=search) |
                Q(student__studentNumber__icontains=search) |
                Q(company__name__icontains=search)
            )

        return queryset

    @action(detail=True, methods=['post'], url_path='assign-supervisor')
    def assign_supervisor(self, request, pk=None):
        if request.user.role not in [User.Role.COORDINATOR, User.Role.ADMIN]:
            return Response({'detail': 'Not permitted'}, status=status.HTTP_403_FORBIDDEN)
            
        placement = self.get_object()
        supervisor_id = request.data.get('supervisorId')
        
        if not supervisor_id:
            return Response({'detail': 'Supervisor ID required'}, status=status.HTTP_400_BAD_REQUEST)
            
        placement.academicSupervisorId = supervisor_id
        placement.supervisorAssignedAt = timezone.now()
        
        if placement.status == Placement.Status.APPROVED:
            placement.status = Placement.Status.UPCOMING if placement.startDate > timezone.now().date() else Placement.Status.ACTIVE
            
        placement.save()
        return Response(self.get_serializer(placement).data)

    @action(detail=True, methods=['post'], url_path='workplace-supervisor')
    def assign_workplace_supervisor(self, request, pk=None):
        if request.user.role != User.Role.COMPANY:
            return Response({'detail': 'Not permitted'}, status=status.HTTP_403_FORBIDDEN)
            
        placement = self.get_object()
        if placement.company.user != request.user:
            return Response({'detail': 'Not permitted'}, status=status.HTTP_403_FORBIDDEN)
            
        workplace_supervisor_id = request.data.get('workplaceSupervisorId')
        if not workplace_supervisor_id:
            return Response({'detail': 'Workplace Supervisor ID required'}, status=status.HTTP_400_BAD_REQUEST)
            
        placement.workplaceSupervisorId = workplace_supervisor_id
        placement.save()
        return Response(self.get_serializer(placement).data)

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        if request.user.role not in [User.Role.COORDINATOR, User.Role.ADMIN]:
            return Response({'detail': 'Not permitted'}, status=status.HTTP_403_FORBIDDEN)
            
        placement = self.get_object()
        if placement.status not in [Placement.Status.APPROVED, Placement.Status.UPCOMING]:
            return Response({'detail': 'Cannot activate from current state'}, status=status.HTTP_400_BAD_REQUEST)
            
        if not placement.academicSupervisorId:
            return Response({'detail': 'Assign an academic supervisor first'}, status=status.HTTP_400_BAD_REQUEST)
            
        placement.status = Placement.Status.ACTIVE
        placement.save()
        return Response(self.get_serializer(placement).data)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        if request.user.role not in [User.Role.COORDINATOR, User.Role.SUPERVISOR, User.Role.ADMIN]:
            return Response({'detail': 'Not permitted'}, status=status.HTTP_403_FORBIDDEN)
            
        placement = self.get_object()
        # In a real app we would check if supervisor owns this placement, and if evaluation is submitted
        placement.status = Placement.Status.COMPLETED
        placement.completedAt = timezone.now()
        placement.save()
        return Response(self.get_serializer(placement).data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        if request.user.role not in [User.Role.COORDINATOR, User.Role.ADMIN]:
            return Response({'detail': 'Not permitted'}, status=status.HTTP_403_FORBIDDEN)
            
        placement = self.get_object()
        if placement.status == Placement.Status.COMPLETED:
            return Response({'detail': 'Cannot cancel a completed placement'}, status=status.HTTP_400_BAD_REQUEST)
            
        reason = request.data.get('reason', '')
        if not reason.strip():
            return Response({'reason': ['Required']}, status=status.HTTP_400_BAD_REQUEST)
            
        placement.status = Placement.Status.TERMINATED # Django model uses TERMINATED
        placement.save()
        return Response(self.get_serializer(placement).data)
