from django.contrib import admin
from .models import VueloPlanificado, VueloDiario, HitoRampa, ManifiestoPasajeros

@admin.register(VueloPlanificado)
class VueloPlanificadoAdmin(admin.ModelAdmin):
    list_display = ('numero_vuelo', 'aerolinea_empresa', 'aeropuerto_origen', 'aeropuerto_destino', 'activo')
    list_filter = ('activo', 'aerolinea_empresa', 'aeropuerto_origen')
    search_fields = ('numero_vuelo', 'aerolinea_empresa__razon_social')

class HitoRampaInline(admin.StackedInline):
    model = HitoRampa
    extra = 1

class ManifiestoPasajerosInline(admin.StackedInline):
    model = ManifiestoPasajeros
    extra = 1

@admin.register(VueloDiario)
class VueloDiarioAdmin(admin.ModelAdmin):
    list_display = ('numero_vuelo', 'fecha_operacion', 'tipo_operacion', 'estado', 'aerolinea_empresa')
    list_filter = ('tipo_operacion', 'estado', 'fecha_operacion')
    search_fields = ('numero_vuelo', 'aerolinea_empresa__razon_social')
    inlines = [HitoRampaInline, ManifiestoPasajerosInline]
    
    fieldsets = (
        ('Información General', {
            'fields': ('vuelo_planificado', 'aerolinea_empresa', 'aeronave', 'numero_vuelo', 'tipo_operacion', 'estado', 'fecha_operacion')
        }),
        ('Ubicación', {
            'fields': ('aeropuerto_origen', 'aeropuerto_destino')
        }),
        ('Tiempos de Salida', {
            'fields': ('std', 'etd', 'atd')
        }),
        ('Tiempos de Llegada', {
            'fields': ('sta', 'eta', 'ata')
        }),
    )

admin.site.register(HitoRampa)
admin.site.register(ManifiestoPasajeros)
