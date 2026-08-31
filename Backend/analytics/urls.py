from django.urls import path
from .views import CoordinatorAnalyticsView

urlpatterns = [
    path('coordinator/', CoordinatorAnalyticsView.as_view(), name='coordinator-analytics'),
]
