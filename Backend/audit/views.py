from rest_framework import viewsets, permissions, pagination
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import AuditLogEntry
from .serializers import AuditLogEntrySerializer
from users.models import User

class StandardResultsSetPagination(pagination.PageNumberPagination):
    page_size = 10
    page_size_query_param = 'pageSize'
    max_page_size = 100

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AuditLogEntrySerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        user = self.request.user
        if user.role not in [User.Role.COORDINATOR, User.Role.ADMIN]:
            return AuditLogEntry.objects.none()
            
        queryset = AuditLogEntry.objects.all().order_by('-createdAt')
        
        # Filtering
        search = self.request.query_params.get('search', None)
        action_type = self.request.query_params.get('action', None)
        actor_role = self.request.query_params.get('actorRole', None)
        object_type = self.request.query_params.get('objectType', None)
        from_date = self.request.query_params.get('from', None)
        to_date = self.request.query_params.get('to', None)
        
        if search:
            queryset = queryset.filter(
                Q(actorName__icontains=search) | 
                Q(objectLabel__icontains=search) | 
                Q(objectType__icontains=search)
            )
        if action_type:
            queryset = queryset.filter(action=action_type)
        if actor_role:
            queryset = queryset.filter(actorRole=actor_role)
        if object_type:
            queryset = queryset.filter(objectType=object_type)
        if from_date:
            queryset = queryset.filter(createdAt__gte=from_date)
        if to_date:
            queryset = queryset.filter(createdAt__lte=f"{to_date}T23:59:59")
            
        return queryset

    @action(detail=False, methods=['get'], url_path='object-types')
    def object_types(self, request):
        user = self.request.user
        if user.role not in [User.Role.COORDINATOR, User.Role.ADMIN]:
            return Response([])
        types = AuditLogEntry.objects.values_list('objectType', flat=True).distinct().order_by('objectType')
        return Response(list(types))
