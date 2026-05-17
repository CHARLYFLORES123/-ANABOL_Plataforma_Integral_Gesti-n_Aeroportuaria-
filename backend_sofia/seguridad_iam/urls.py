from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AerolineaEmpresaViewSet, TorreControlPersonalViewSet, 
    LogAuditoriaViewSet, SesionCredencialViewSet
)

router = DefaultRouter()
router.register(r'aerolineas', AerolineaEmpresaViewSet)
router.register(r'personal-atc', TorreControlPersonalViewSet)
router.register(r'auditoria', LogAuditoriaViewSet)
router.register(r'sesiones', SesionCredencialViewSet)

urlpatterns = [
    path('', include(router.urls)),
]