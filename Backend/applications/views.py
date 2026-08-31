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
            return queryset.filter(student=user.student_profile)
        elif user.role == User.Role.COMPANY:
            return queryset.filter(company=user.company_profile)
        elif user.role in [User.Role.COORDINATOR, User.Role.SUPERVISOR, User.Role.ADMIN]:
            return queryset
            
        return queryset.none()

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
