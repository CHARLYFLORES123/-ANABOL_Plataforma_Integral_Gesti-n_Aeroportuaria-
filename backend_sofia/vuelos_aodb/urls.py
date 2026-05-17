from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    VueloPlanificadoViewSet, VueloDiarioViewSet, 
    HitoRampaViewSet, ManifiestoPasajerosViewSet
)

router = DefaultRouter()
router.register(r'planificacion', VueloPlanificadoViewSet)
router.register(r'operaciones', VueloDiarioViewSet)
router.register(r'hitos', HitoRampaViewSet)
router.register(r'manifiestos', ManifiestoPasajerosViewSet)

urlpatterns = [
    path('', include(router.urls)),
]