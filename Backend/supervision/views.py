from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import SupervisionReport, ProgressReport, Evaluation
from .serializers import SupervisionReportSerializer, ProgressReportSerializer, EvaluationSerializer

class SupervisionReportViewSet(viewsets.ModelViewSet):
    serializer_class = SupervisionReportSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = SupervisionReport.objects.all()

class ProgressReportViewSet(viewsets.ModelViewSet):
    serializer_class = ProgressReportSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = ProgressReport.objects.all()

class EvaluationViewSet(viewsets.ModelViewSet):
    serializer_class = EvaluationSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Evaluation.objects.all()
