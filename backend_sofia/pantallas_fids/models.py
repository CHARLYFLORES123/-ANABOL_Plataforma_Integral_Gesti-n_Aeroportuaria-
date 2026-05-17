from django.db import models
from django.conf import settings

# ==========================================
# 18. SUBMÓDULO: AGRUPAMIENTO DE ZONAS
# ==========================================
class FidsZona(models.Model):
    TIPO_FILTRO_CHOICES = [
        ('LLEGADAS_SOLO', 'Llegadas Solo'),
        ('SALIDAS_SOLO', 'Salidas Solo'),
        ('MIXTO', 'Mixto (Llegadas y Salidas)'),
    ]

    nombre_zona = models.CharField(max_length=50) # ej. 'Pre-Embarque Nacional'
    tipo_filtro_vuelo = models.CharField(max_length=20, choices=TIPO_FILTRO_CHOICES)
    descripcion = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        db_table = 'fids_zonas'
        verbose_name = 'Zona FIDS'
        verbose_name_plural = 'Zonas FIDS'

    def __str__(self):
        return f"{self.nombre_zona} ({self.tipo_filtro_vuelo})"


# ==========================================
# 15. SUBMÓDULO: DISEÑADOR Y PLANTILLAS
# ==========================================
class FidsPlantilla(models.Model):
    nombre_plantilla = models.CharField(max_length=50)
    esquema_colores = models.CharField(max_length=100) # ej. 'Dark-Blue-High-Contrast'
    fuente_texto = models.CharField(max_length=50)
    idiomas_visualizacion = models.CharField(max_length=50) # ej. 'ES,EN,PT'
    # JSONB para definir qué campos del AODB se muestran (vuelo, hora, gate, status, etc.)
    columnas_visibles = models.JSONField() 

    class Meta:
        db_table = 'fids_plantillas'
        verbose_name = 'Plantilla FIDS'

    def __str__(self):
        return self.nombre_plantilla


# ==========================================
# 16. SUBMÓDULO: GESTIÓN DE DISPOSITIVOS
# ==========================================
class FidsDispositivo(models.Model):
    ESTADO_CONEXION_CHOICES = [
        ('ONLINE', 'En línea'),
        ('OFFLINE', 'Fuera de línea'),
    ]

    codigo_pantalla = models.CharField(max_length=20, unique=True) # ej. 'DISP-GATE-04'
    direccion_ip = models.GenericIPAddressField(max_length=45, blank=True, null=True)
    estado_conexion = models.CharField(
        max_length=20, 
        choices=ESTADO_CONEXION_CHOICES, 
        default='OFFLINE'
    )
    zona_fids = models.ForeignKey(FidsZona, on_delete=models.CASCADE, related_name='dispositivos')
    plantilla = models.ForeignKey(FidsPlantilla, on_delete=models.PROTECT)
    ultima_conexion = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'fids_dispositivos'
        verbose_name = 'Dispositivo FIDS'

    def __str__(self):
        return f"{self.codigo_pantalla} - {self.estado_conexion}"


# ==========================================
# 17. SUBMÓDULO: MENSAJERÍA DINÁMICA Y EMERGENCIA
# ==========================================
class FidsAlertaEmergencia(models.Model):
    GRAVEDAD_CHOICES = [
        ('URGENTE', 'Urgente'),
        ('INFORMATIVO', 'Informativo'),
    ]

    mensaje_alerta = models.TextField()
    tipo_gravedad = models.CharField(max_length=20, choices=GRAVEDAD_CHOICES)
    # Si es NULL, el mensaje es global para todo el aeropuerto
    pantalla_destino = models.ForeignKey(
        FidsDispositivo, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='alertas'
    )
    # FK hacia Usuarios (Módulo 0)
    usuario_emisor = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.PROTECT
    )
    activo = models.BooleanField(default=True)
    expira_at = models.DateTimeField()

    class Meta:
        db_table = 'fids_alertas_emergencia'
        verbose_name = 'Alerta FIDS'

    def __str__(self):
        dest = self.pantalla_destino.codigo_pantalla if self.pantalla_destino else "GLOBAL"
        return f"[{self.tipo_gravedad}] para {dest}"