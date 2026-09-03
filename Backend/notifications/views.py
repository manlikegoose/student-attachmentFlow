from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Notification
from .serializers import NotificationSerializer

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return Notification.objects.filter(userId=str(user.id)).order_by('-createdAt')

    def list(self, request, *args, **kwargs):
        limit = request.query_params.get('limit')
        queryset = self.get_queryset()
        if limit and limit.isdigit():
            queryset = queryset[:int(limit)]
            
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='unread-count')
    def unread_count(self, request):
        count = self.get_queryset().filter(read=False).count()
        return Response(count)

    @action(detail=True, methods=['patch'], url_path='read')
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.read = True
        notification.save()
        serializer = self.get_serializer(notification)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='read-all')
    def mark_all_read(self, request):
        queryset = self.get_queryset().filter(read=False)
        queryset.update(read=True)
        return Response(status=status.HTTP_204_NO_CONTENT)
