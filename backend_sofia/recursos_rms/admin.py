from django.contrib import admin
from .models import AsignacionPuerta, MostradorCheckin, CintaEquipaje, PosicionRampa

@admin.register(AsignacionPuerta)
class AsignacionPuertaAdmin(admin.ModelAdmin):
    list_display = ('codigo_puerta', 'envergadura_maxima_aceptada', 'estado', 'vuelo_diario')
    list_filter = ('estado', 'envergadura_maxima_aceptada')
    search_fields = ('codigo_puerta', 'vuelo_diario__numero_vuelo')

@admin.register(MostradorCheckin)
class MostradorCheckinAdmin(admin.ModelAdmin):
    list_display = ('numero_mostrador', 'aerolinea_empresa', 'estado', 'hora_apertura', 'hora_cierre')
    list_filter = ('estado', 'aerolinea_empresa')
    search_fields = ('numero_mostrador', 'aerolinea_empresa__razon_social', 'vuelo_diario__numero_vuelo')

@admin.register(CintaEquipaje)
class CintaEquipajeAdmin(admin.ModelAdmin):
    list_display = ('codigo_cinta', 'ubicacion_zona', 'estado', 'vuelo_diario')
    list_filter = ('estado', 'ubicacion_zona')
    search_fields = ('codigo_cinta', 'vuelo_diario__numero_vuelo')

@admin.register(PosicionRampa)
class PosicionRampaAdmin(admin.ModelAdmin):
    list_display = ('codigo_posicion', 'estado', 'vuelo_diario')
    list_filter = ('estado',)
    search_fields = ('codigo_posicion', 'vuelo_diario__numero_vuelo')
