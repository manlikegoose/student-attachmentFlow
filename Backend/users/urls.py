from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'students', views.StudentProfileViewSet, basename='student')
router.register(r'companies', views.CompanyProfileViewSet, basename='company')
router.register(r'supervisors', views.SupervisorProfileViewSet, basename='supervisor')

urlpatterns = [
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/student/', views.RegisterStudentView.as_view(), name='register_student'),
    path('register/company/', views.RegisterCompanyView.as_view(), name='register_company'),
    path('me/', views.CurrentUserView.as_view(), name='current_user'),
    path('', include(router.urls)),
]
