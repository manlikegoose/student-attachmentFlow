from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Opportunity
from .serializers import OpportunitySerializer
from django.utils import timezone
from users.models import User

class OpportunityViewSet(viewsets.ModelViewSet):
    serializer_class = OpportunitySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        queryset = Opportunity.objects.all().order_by('-createdAt')

        if not user.is_authenticated:
            return queryset.filter(status=Opportunity.Status.PUBLISHED)
        
        if user.role == User.Role.STUDENT:
            return queryset.filter(status=Opportunity.Status.PUBLISHED)
        elif user.role == User.Role.COMPANY:
            return queryset.filter(company__user=user)
        elif user.role in [User.Role.COORDINATOR, User.Role.SUPERVISOR]:
            return queryset
            
        return queryset.filter(status=Opportunity.Status.PUBLISHED)

    def perform_create(self, serializer):
        user = self.request.user
        if user.role != User.Role.COMPANY:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only companies can create opportunities.")
        
        # Determine status based on query param 'submit'
        submit = self.request.query_params.get('submit', 'false').lower() == 'true'
        status_val = Opportunity.Status.PENDING_APPROVAL if submit else Opportunity.Status.DRAFT
        
        serializer.save(company=user.company_profile, status=status_val)

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        opportunity = self.get_object()
        if opportunity.company.user != request.user:
            return Response({'detail': 'Not permitted'}, status=status.HTTP_403_FORBIDDEN)
        
        if opportunity.status != Opportunity.Status.DRAFT:
            return Response({'detail': 'Can only submit drafts'}, status=status.HTTP_400_BAD_REQUEST)
            
        opportunity.status = Opportunity.Status.PENDING_APPROVAL
        opportunity.save()
        return Response(self.get_serializer(opportunity).data)

    @action(detail=True, methods=['post'])
    def review(self, request, pk=None):
        if request.user.role not in [User.Role.COORDINATOR, User.Role.SUPERVISOR]: # Assuming Coordinator for now
            return Response({'detail': 'Not permitted'}, status=status.HTTP_403_FORBIDDEN)
            
        opportunity = self.get_object()
        decision = request.data.get('decision')
        note = request.data.get('note', '')

        if opportunity.status != Opportunity.Status.PENDING_APPROVAL:
            return Response({'detail': 'Not pending approval'}, status=status.HTTP_400_BAD_REQUEST)

        if decision == 'APPROVE':
            opportunity.status = Opportunity.Status.PUBLISHED
            opportunity.publishedAt = timezone.now()
            opportunity.approvedBy = request.user
        elif decision == 'REJECT':
            opportunity.status = Opportunity.Status.DRAFT
            if not note:
                return Response({'note': ['Reason required']}, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response({'detail': 'Invalid decision'}, status=status.HTTP_400_BAD_REQUEST)
            
        opportunity.reviewNote = note
        opportunity.save()
        return Response(self.get_serializer(opportunity).data)

    @action(detail=True, methods=['post'])
    def close(self, request, pk=None):
        opportunity = self.get_object()
        is_owner = request.user.role == User.Role.COMPANY and opportunity.company.user == request.user
        is_staff = request.user.role == User.Role.COORDINATOR

        if not (is_owner or is_staff):
            return Response({'detail': 'Not permitted'}, status=status.HTTP_403_FORBIDDEN)
            
        if opportunity.status != Opportunity.Status.PUBLISHED:
            return Response({'detail': 'Only published can be closed'}, status=status.HTTP_400_BAD_REQUEST)
            
        opportunity.status = Opportunity.Status.CLOSED
        opportunity.save()
        return Response(self.get_serializer(opportunity).data)
