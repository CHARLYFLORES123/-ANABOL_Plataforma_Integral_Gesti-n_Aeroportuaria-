from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DiccAerolineaViewSet, DiccAeronaveViewSet, DiccAeropuertoViewSet,
    AeropuertoLocalSettingsViewSet, IntegracionWebhookViewSet, MultimonedaTasaViewSet
)

router = DefaultRouter()
router.register(r'aerolineas', DiccAerolineaViewSet)
router.register(r'aeronaves', DiccAeronaveViewSet)
router.register(r'aeropuertos', DiccAeropuertoViewSet)
router.register(r'settings-local', AeropuertoLocalSettingsViewSet)
router.register(r'webhooks', IntegracionWebhookViewSet)
router.register(r'tasas', MultimonedaTasaViewSet)

urlpatterns = [
    path('', include(router.urls)),
]