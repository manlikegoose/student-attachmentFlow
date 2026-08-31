from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ApplicationViewSet, PlacementViewSet

router = DefaultRouter()
router.register(r'placements', PlacementViewSet, basename='placement')
router.register(r'', ApplicationViewSet, basename='application')

urlpatterns = [
    path('', include(router.urls)),
]
