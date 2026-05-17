from django.contrib import admin
from .models import (
    DiccAerolinea, DiccAeronave, DiccAeropuerto,
    AeropuertoLocalSettings, IntegracionWebhook, MultimonedaTasa
)

@admin.register(DiccAerolinea)
class DiccAerolineaAdmin(admin.ModelAdmin):
    list_display = ('nombre_oficial', 'codigo_iata', 'codigo_icao')
    search_fields = ('nombre_oficial', 'codigo_iata', 'codigo_icao')

@admin.register(DiccAeronave)
class DiccAeronaveAdmin(admin.ModelAdmin):
    list_display = ('modelo', 'capacidad_max_pasajeros', 'envergadura_categoria')
    list_filter = ('envergadura_categoria',)
    search_fields = ('modelo',)

@admin.register(DiccAeropuerto)
class DiccAeropuertoAdmin(admin.ModelAdmin):
    list_display = ('nombre_completo', 'ciudad', 'pais', 'codigo_iata', 'codigo_icao')
    search_fields = ('nombre_completo', 'codigo_iata', 'codigo_icao', 'ciudad')
    list_filter = ('pais',)

@admin.register(AeropuertoLocalSettings)
class AeropuertoLocalSettingsAdmin(admin.ModelAdmin):
    list_display = ('nombre_aeropuerto', 'aeropuerto_maestro', 'telefono_soporte', 'zona_horaria')
    # Al ser OneToOne, esto asegura que la interfaz sea limpia

@admin.register(IntegracionWebhook)
class IntegracionWebhookAdmin(admin.ModelAdmin):
    list_display = ('servicio_nombre', 'evento_disparador', 'activo')
    list_filter = ('activo', 'evento_disparador')
    search_fields = ('servicio_nombre', 'webhook_url')

@admin.register(MultimonedaTasa)
class MultimonedaTasaAdmin(admin.ModelAdmin):
    list_display = ('codigo_iso', 'simbolo', 'tipo_cambio_ref_usd')
    search_fields = ('codigo_iso',)
