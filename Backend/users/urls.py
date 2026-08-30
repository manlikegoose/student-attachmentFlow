from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views

urlpatterns = [
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/student/', views.RegisterStudentView.as_view(), name='register_student'),
    path('register/company/', views.RegisterCompanyView.as_view(), name='register_company'),
    path('me/', views.CurrentUserView.as_view(), name='current_user'),
]
