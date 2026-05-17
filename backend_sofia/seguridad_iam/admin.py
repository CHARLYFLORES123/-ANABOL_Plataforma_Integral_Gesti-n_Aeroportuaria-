from django.contrib import admin
from .models import AerolineaEmpresa, TorreControlPersonal, LogAuditoria, SesionCredencial

@admin.register(AerolineaEmpresa)
class AerolineaEmpresaAdmin(admin.ModelAdmin):
    list_display = ('razon_social', 'ruc_nit', 'tipo_empresa', 'activo')
    search_fields = ('razon_social', 'ruc_nit')

@admin.register(TorreControlPersonal)
class TorreControlPersonalAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'numero_licencia_atc', 'cargo_atc', 'vencimiento_licencia')
    list_filter = ('certificado_medico_vigente', 'cargo_atc')

@admin.register(LogAuditoria)
class LogAuditoriaAdmin(admin.ModelAdmin):
    list_display = ('fecha_hora', 'usuario', 'accion', 'tabla_afectada', 'ip_address')
    readonly_fields = ('fecha_hora', 'usuario', 'accion', 'tabla_afectada', 'registro_id', 'valor_anterior', 'valor_nuevo', 'ip_address')
    list_filter = ('accion', 'tabla_afectada')

@admin.register(SesionCredencial)
class SesionCredencialAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'dispositivo', 'ip_origen', 'estado', 'ultimo_acceso')
    list_filter = ('estado', 'mfa_verificado')
