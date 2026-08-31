from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SupervisionReportViewSet, ProgressReportViewSet, EvaluationViewSet

router = DefaultRouter()
router.register(r'reports', SupervisionReportViewSet, basename='supervision_report')
router.register(r'progress', ProgressReportViewSet, basename='progress_report')
router.register(r'evaluations', EvaluationViewSet, basename='evaluation')

urlpatterns = [
    path('', include(router.urls)),
]
