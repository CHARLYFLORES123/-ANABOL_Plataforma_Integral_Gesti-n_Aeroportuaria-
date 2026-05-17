from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    FidsZonaViewSet, FidsPlantillaViewSet,
    FidsDispositivoViewSet, FidsAlertaEmergenciaViewSet
)

router = DefaultRouter()
router.register(r'zonas', FidsZonaViewSet)
router.register(r'plantillas', FidsPlantillaViewSet)
router.register(r'dispositivos', FidsDispositivoViewSet)
router.register(r'alertas', FidsAlertaEmergenciaViewSet)

urlpatterns = [
    path('', include(router.urls)),
]