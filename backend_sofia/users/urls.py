from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

router = DefaultRouter()
router.register(r'users', views.UserViewSet, basename='users')
router.register(r'roles', views.RoleViewSet, basename='roles') # Nuevo: Registrar RoleViewSet

urlpatterns = [
    path('login/', views.login_view, name='login'), # Tu vista actual de template
    path('logout/', views.logout_view, name='logout'),
    
    # API endpoints para JWT
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/me/', views.ProfileView.as_view(), name='user_profile'),
    path('api/auth/password-update/', views.PasswordUpdateView.as_view(), name='password_update'),
    path('api/file/upload/<path:folder>', views.FileUploadView.as_view(), name='file_upload'),
    path('api/', include(router.urls)),

    # Nuevas rutas para exportación
    path('api/users/export/excel/', views.UserExportExcelView.as_view(), name='users_export_excel'),
    path('api/users/export/pdf/', views.UserExportPDFView.as_view(), name='users_export_pdf'),
    path('api/roles/export/excel/', views.RoleExportExcelView.as_view(), name='roles_export_excel'),
    path('api/roles/export/pdf/', views.RoleExportPDFView.as_view(), name='roles_export_pdf'),
]