from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import DocumentRecord
from .serializers import DocumentSerializer
from users.models import User

class DocumentViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = DocumentRecord.objects.all().order_by('-uploadedAt')

        if user.role == User.Role.STUDENT:
            queryset = queryset.filter(ownerId=f"std-{user.student_profile.id}")
        elif user.role == User.Role.COMPANY:
            queryset = queryset.filter(ownerId=f"co-{user.company_profile.id}")
        elif user.role not in [User.Role.COORDINATOR, User.Role.SUPERVISOR, User.Role.ADMIN]:
            return queryset.none()
            
        owner_id = self.request.query_params.get('ownerId')
        if owner_id:
            queryset = queryset.filter(ownerId=owner_id)
            
        doc_type = self.request.query_params.get('type')
        if doc_type:
            queryset = queryset.filter(type=doc_type)
            
        doc_status = self.request.query_params.get('status')
        if doc_status:
            queryset = queryset.filter(status=doc_status)
            
        pending = self.request.query_params.get('pendingReviewOnly')
        if pending and pending.lower() == 'true':
            queryset = queryset.filter(status=DocumentRecord.Status.PENDING)

        return queryset

    def perform_create(self, serializer):
        user = self.request.user
        
        owner_id = ""
        if user.role == User.Role.STUDENT:
            owner_id = f"std-{user.student_profile.id}"
        elif user.role == User.Role.COMPANY:
            owner_id = f"co-{user.company_profile.id}"
            
        file_obj = self.request.FILES.get('file')
        if not file_obj:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("File is required")

        serializer.save(
            ownerId=owner_id,
            ownerRole=user.role,
            filename=file_obj.name,
            mimeType=file_obj.content_type,
            sizeBytes=file_obj.size,
            status=DocumentRecord.Status.PENDING
        )

    def destroy(self, request, *args, **kwargs):
        document = self.get_object()
        
        # Determine owner id
        owner_id = ""
        if request.user.role == User.Role.STUDENT:
            owner_id = f"std-{request.user.student_profile.id}"
        elif request.user.role == User.Role.COMPANY:
            owner_id = f"co-{request.user.company_profile.id}"
            
        if document.ownerId != owner_id:
            return Response({'detail': 'Not permitted'}, status=status.HTTP_403_FORBIDDEN)
            
        if document.status == DocumentRecord.Status.APPROVED:
            return Response({'detail': 'An approved document cannot be removed.'}, status=status.HTTP_400_BAD_REQUEST)
            
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def review(self, request, pk=None):
        if request.user.role not in [User.Role.COORDINATOR, User.Role.ADMIN]:
            return Response({'detail': 'Not permitted'}, status=status.HTTP_403_FORBIDDEN)
            
        document = self.get_object()
        decision = request.data.get('decision')
        comment = request.data.get('comment', '')
        
        if decision not in [DocumentRecord.Status.APPROVED, DocumentRecord.Status.REJECTED]:
            return Response({'detail': 'Invalid decision'}, status=status.HTTP_400_BAD_REQUEST)
            
        if decision == DocumentRecord.Status.REJECTED and not comment.strip():
            return Response({'comment': ['Required']}, status=status.HTTP_400_BAD_REQUEST)
            
        document.status = decision
        document.reviewComment = comment
        document.reviewedAt = timezone.now()
        
        reviewer_id = ""
        if hasattr(request.user, 'coordinator_profile'):
             reviewer_id = f"coord-{request.user.coordinator_profile.id}"
        document.reviewedById = reviewer_id
        
        document.save()
        return Response(self.get_serializer(document).data)
