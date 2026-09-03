from django.urls import path
from .views import (
    CoordinatorAnalyticsView,
    StudentAnalyticsView,
    CompanyAnalyticsView,
    SupervisorAnalyticsView
)

urlpatterns = [
    path('coordinator/', CoordinatorAnalyticsView.as_view(), name='analytics-coordinator'),
    path('student/', StudentAnalyticsView.as_view(), name='analytics-student'),
    path('company/', CompanyAnalyticsView.as_view(), name='analytics-company'),
    path('supervisor/', SupervisorAnalyticsView.as_view(), name='analytics-supervisor'),
]
