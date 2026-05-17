from django.contrib import admin
from .models import FidsZona, FidsPlantilla, FidsDispositivo, FidsAlertaEmergencia

@admin.register(FidsZona)
class FidsZonaAdmin(admin.ModelAdmin):
    list_display = ('nombre_zona', 'tipo_filtro_vuelo')
    list_filter = ('tipo_filtro_vuelo',)
    search_fields = ('nombre_zona',)

@admin.register(FidsPlantilla)
class FidsPlantillaAdmin(admin.ModelAdmin):
    list_display = ('nombre_plantilla', 'esquema_colores', 'idiomas_visualizacion')
    search_fields = ('nombre_plantilla',)

@admin.register(FidsDispositivo)
class FidsDispositivoAdmin(admin.ModelAdmin):
    list_display = ('codigo_pantalla', 'direccion_ip', 'estado_conexion', 'zona_fids', 'plantilla', 'ultima_conexion')
    list_filter = ('estado_conexion', 'zona_fids')
    search_fields = ('codigo_pantalla', 'direccion_ip')

@admin.register(FidsAlertaEmergencia)
class FidsAlertaEmergenciaAdmin(admin.ModelAdmin):
    list_display = ('id', 'mensaje_alerta', 'tipo_gravedad', 'pantalla_destino', 'activo', 'expira_at')
    list_filter = ('tipo_gravedad', 'activo')
    search_fields = ('mensaje_alerta',)
