from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AsignacionPuertaViewSet, MostradorCheckinViewSet,
    CintaEquipajeViewSet, PosicionRampaViewSet
)

router = DefaultRouter()
router.register(r'puertas', AsignacionPuertaViewSet)
router.register(r'mostradores', MostradorCheckinViewSet)
router.register(r'cintas', CintaEquipajeViewSet)
router.register(r'posiciones', PosicionRampaViewSet)

urlpatterns = [
    path('', include(router.urls)),
]