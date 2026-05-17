from django.db import models
from vuelos_aodb.models import VueloDiario
from seguridad_iam.models import AerolineaEmpresa

# ==========================================
# 11. SUBMÓDULO: ASIGNACIÓN DE PUERTAS (GATES)
# ==========================================
class AsignacionPuerta(models.Model):
    # Usamos las opciones de estado para mantener la integridad
    ESTADO_CHOICES = [
        ('DISPONIBLE', 'Disponible'),
        ('OCUPADA', 'Ocupada'),
        ('MANTENIMIENTO', 'Mantenimiento'),
    ]

    codigo_puerta = models.CharField(max_length=10, unique=True)
    envergadura_maxima_aceptada = models.CharField(max_length=10) # ej. 'CAT_D'
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='DISPONIBLE')
    # Se llena al asignarse a un vuelo diario (Módulo 2)
    vuelo_diario = models.ForeignKey(
        VueloDiario, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='puertas_asignadas'
    )

    class Meta:
        db_table = 'asignacion_puertas'
        verbose_name = 'Asignación de Puerta'

    def __str__(self):
        return f"{self.codigo_puerta} ({self.estado})"


# ==========================================
# 12. SUBMÓDULO: MOSTRADORES DE CHECK-IN
# ==========================================
class MostradorCheckin(models.Model):
    ESTADO_CHOICES = [
        ('ACTIVO', 'Activo'),
        ('CERRADO', 'Cerrado'),
    ]

    numero_mostrador = models.CharField(max_length=10, unique=True)
    # FK hacia Aerolíneas (Módulo 1)
    aerolinea_empresa = models.ForeignKey(
        AerolineaEmpresa, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True
    )
    # FK hacia Vuelos Diarios (Módulo 2)
    vuelo_diario = models.ForeignKey(
        VueloDiario, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True
    )
    hora_apertura = models.DateTimeField(null=True, blank=True)
    hora_cierre = models.DateTimeField(null=True, blank=True)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='CERRADO')

    class Meta:
        db_table = 'mostradores_checkin'
        verbose_name = 'Mostrador de Check-in'

    def __str__(self):
        return f"Counter {self.numero_mostrador} - {self.estado}"


# ==========================================
# 13. SUBMÓDULO: CINTAS DE EQUIPAJE
# ==========================================
class CintaEquipaje(models.Model):
    ESTADO_CHOICES = [
        ('ACTIVO', 'Activo'),
        ('MANTENIMIENTO', 'Mantenimiento'),
    ]

    codigo_cinta = models.CharField(max_length=10, unique=True)
    ubicacion_zona = models.CharField(max_length=50) # ej. 'Llegadas Nacionales'
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='ACTIVO')
    vuelo_diario = models.ForeignKey(
        VueloDiario, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True
    )

    class Meta:
        db_table = 'cintas_equipaje'
        verbose_name = 'Cinta de Equipaje'

    def __str__(self):
        return f"Belt {self.codigo_cinta}"


# ==========================================
# 14. SUBMÓDULO: POSICIONES DE RAMPA (PLATAFORMA)
# ==========================================
class PosicionRampa(models.Model):
    ESTADO_CHOICES = [
        ('OCUPADO', 'Ocupado'),
        ('LIBRE', 'Libre'),
        ('RESERVADO', 'Reservado'),
    ]

    codigo_posicion = models.CharField(max_length=10, unique=True)
    # Guardamos las coordenadas como JSON para que React las procese fácilmente
    coordenadas_mapa = models.JSONField(
        null=True, 
        blank=True, 
        help_text="JSON de geolocalización o coordenadas de dibujo"
    )
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='LIBRE')
    vuelo_diario = models.ForeignKey(
        VueloDiario, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True
    )

    class Meta:
        db_table = 'posiciones_rampa'
        verbose_name = 'Posición de Rampa'

    def __str__(self):
        return f"Rampa {self.codigo_posicion} ({self.estado})"