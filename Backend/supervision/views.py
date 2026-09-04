from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import SupervisionReport, ProgressReport, Evaluation
from .serializers import SupervisionReportSerializer, ProgressReportSerializer, EvaluationSerializer
from applications.models import Placement

class SupervisionReportViewSet(viewsets.ModelViewSet):
    serializer_class = SupervisionReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = SupervisionReport.objects.all()
        placementId = self.request.query_params.get('placementId')
        supervisorId = self.request.query_params.get('supervisorId')
        studentId = self.request.query_params.get('studentId')
        if placementId:
            queryset = queryset.filter(placementId=placementId)
        if supervisorId:
            queryset = queryset.filter(supervisorId=supervisorId)
        if studentId:
            queryset = queryset.filter(studentId=studentId)
        return queryset

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        if 'submit' in data:
            data['submitted'] = data.pop('submit')
            if data['submitted']:
                data['submittedAt'] = timezone.now()
        
        try:
            data['supervisorId'] = request.user.supervisor_profile.id
        except:
            pass

        # We also need to fetch studentId from placementId
        if 'placementId' in data:
            try:
                placement = Placement.objects.get(id=data['placementId'])
                data['studentId'] = placement.student.id
            except Placement.DoesNotExist:
                pass

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        data = request.data.copy()
        if 'submit' in data:
            data['submitted'] = data.pop('submit')
            if data['submitted'] and not instance.submitted:
                data['submittedAt'] = timezone.now()
                
        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def reopen(self, request, pk=None):
        report = self.get_object()
        report.submitted = False
        # Optional: log the request.data.get('reason')
        report.save()
        return Response(self.get_serializer(report).data)


class ProgressReportViewSet(viewsets.ModelViewSet):
    serializer_class = ProgressReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = ProgressReport.objects.all()
        placementId = self.request.query_params.get('placementId')
        studentId = self.request.query_params.get('studentId')
        awaitingFeedback = self.request.query_params.get('awaitingFeedback')
        if placementId:
            queryset = queryset.filter(placementId=placementId)
        if studentId:
            queryset = queryset.filter(studentId=studentId)
        if awaitingFeedback == 'true':
            queryset = queryset.filter(supervisorFeedback__isnull=True)
        return queryset

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        try:
            student = request.user.student_profile
            data['studentId'] = student.id
            placement = Placement.objects.filter(student=student, status='ACTIVE').first()
            if placement:
                data['placementId'] = placement.id
        except:
            pass

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def feedback(self, request, pk=None):
        report = self.get_object()
        report.supervisorFeedback = request.data.get('feedback')
        try:
            report.reviewedById = request.user.supervisor_profile.id
        except:
            pass
        report.reviewedAt = timezone.now()
        report.save()
        return Response(self.get_serializer(report).data)


class EvaluationViewSet(viewsets.ModelViewSet):
    serializer_class = EvaluationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Evaluation.objects.all()
        placementId = self.request.query_params.get('placementId')
        studentId = self.request.query_params.get('studentId')
        evaluatorId = self.request.query_params.get('evaluatorId')
        if placementId:
            queryset = queryset.filter(placementId=placementId)
        if studentId:
            queryset = queryset.filter(studentId=studentId)
        if evaluatorId:
            queryset = queryset.filter(evaluatorId=evaluatorId)
        return queryset

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        if 'scores' in data:
            scores = data.pop('scores')
            if isinstance(scores, dict):
                data.update(scores)
                
        try:
            data['evaluatorId'] = request.user.supervisor_profile.id
            data['evaluatorRole'] = 'SUPERVISOR'
        except:
            try:
                data['evaluatorId'] = request.user.company_profile.id
                data['evaluatorRole'] = 'COMPANY'
            except:
                pass
                
        # Also fetch studentId from placement
        if 'placementId' in data:
            try:
                placement = Placement.objects.get(id=data['placementId'])
                data['studentId'] = placement.student.id
            except Placement.DoesNotExist:
                pass

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def reopen(self, request, pk=None):
        evaluation = self.get_object()
        evaluation.locked = False
        # Optional: log the request.data.get('reason')
        evaluation.save()
        return Response(self.get_serializer(evaluation).data)
