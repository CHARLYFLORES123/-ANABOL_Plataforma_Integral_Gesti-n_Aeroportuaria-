from django.db import models
from django.conf import settings # Para referenciar al modelo de Usuario

# 3. Submódulo: Gestión de aerolíneas/empresas
class AerolineaEmpresa(models.Model):
    razon_social = models.CharField(max_length=100)
    ruc_nit = models.CharField(max_length=30, unique=True)
    tipo_empresa = models.CharField(max_length=30) # ej. 'AEROLINEA', 'CATERING'
    correo_contacto = models.EmailField(max_length=100)
    celular_contacto = models.CharField(max_length=20)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = 'aerolineas_empresas'

    def __str__(self):
        return self.razon_social

# 4. Submódulo: Control de Personal de Torre de Control
class TorreControlPersonal(models.Model):
    usuario = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='perfil_atc'
    )
    numero_licencia_atc = models.CharField(max_length=30, unique=True)
    cargo_atc = models.CharField(max_length=50) # ej. 'CONTROLADOR_TIERRA'
    funcion_operativa = models.CharField(max_length=255)
    vencimiento_licencia = models.DateField()
    certificado_medico_vigente = models.BooleanField(default=False)

    class Meta:
        db_table = 'torre_control_personal'

# 5. Submódulo: Logs de Auditoría
class LogAuditoria(models.Model):
    # ID BIGINT se maneja automáticamente con BigAutoField en Django 3.2+
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True
    )
    accion = models.CharField(max_length=100)
    tabla_afectada = models.CharField(max_length=50)
    registro_id = models.CharField(max_length=50)
    valor_anterior = models.TextField(null=True, blank=True) # Formato JSON
    valor_nuevo = models.TextField(null=True, blank=True)    # Formato JSON
    ip_address = models.GenericIPAddressField(max_length=45)
    fecha_hora = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'logs_auditoria'

# 6. Submódulo: Control de Sesiones y Credenciales
class SesionCredencial(models.Model):
    # UUID se maneja si el usuario usa UUID, si no, usa el tipo del PK del usuario
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE
    )
    token_jti = models.CharField(max_length=255, unique=True)
    dispositivo = models.CharField(max_length=255)
    ip_origen = models.GenericIPAddressField(max_length=45)
    mfa_verificado = models.BooleanField(default=False)
    estado = models.CharField(max_length=20, default='ACTIVA')
    ultimo_acceso = models.DateTimeField(auto_now=True)
    expira_at = models.DateTimeField()

    class Meta:
        db_table = 'sesiones_credenciales'
