import uuid
from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import timedelta
from configuracion_global.models import DiccAeronave, DiccAeropuerto
from seguridad_iam.models import AerolineaEmpresa

# ==========================================
# 7. SUBMÓDULO: PLANIFICACIÓN DE VUELOS
# ==========================================
class VueloPlanificado(models.Model):
    aerolinea_empresa = models.ForeignKey(AerolineaEmpresa, on_delete=models.CASCADE)
    aeronave = models.ForeignKey(DiccAeronave, on_delete=models.PROTECT)
    numero_vuelo = models.CharField(max_length=10)
    aeropuerto_origen = models.ForeignKey(
        DiccAeropuerto, on_delete=models.PROTECT, related_name='vuelos_origen_planificados'
    )
    aeropuerto_destino = models.ForeignKey(
        DiccAeropuerto, on_delete=models.PROTECT, related_name='vuelos_destino_planificados'
    )
    hora_salida_prog = models.TimeField()
    hora_llegada_prog = models.TimeField()
    dias_semana = models.CharField(max_length=15, help_text="Ej: 1,3,5 (Lunes, Miércoles, Viernes)")
    inicio_temporada = models.DateField()
    fin_temporada = models.DateField()
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = 'vuelos_planificados'
        verbose_name = 'Vuelo Planificado'

    def __str__(self):
        return f"{self.numero_vuelo} - {self.aerolinea_empresa.razon_social}"


# ==========================================
# 8. SUBMÓDULO: OPERACIONES DEL DÍA (AODB LIVE)
# ==========================================
class VueloDiario(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    vuelo_planificado = models.ForeignKey(
        VueloPlanificado, on_delete=models.SET_NULL, null=True, blank=True
    )
    aerolinea_empresa = models.ForeignKey(AerolineaEmpresa, on_delete=models.CASCADE)
    aeronave = models.ForeignKey(DiccAeronave, on_delete=models.PROTECT)
    numero_vuelo = models.CharField(max_length=10)
    aeropuerto_origen = models.ForeignKey(
        DiccAeropuerto, on_delete=models.PROTECT, related_name='vuelos_origen_diarios'
    )
    aeropuerto_destino = models.ForeignKey(
        DiccAeropuerto, on_delete=models.PROTECT, related_name='vuelos_destino_diarios'
    )
    
    TIPO_OPERACION_CHOICES = [('LLEGADA', 'Llegada'), ('SALIDA', 'Salida')]
    tipo_operacion = models.CharField(max_length=10, choices=TIPO_OPERACION_CHOICES)
    
    ESTADO_CHOICES = [
        ('A_TIEMPO', 'A Tiempo'),
        ('DEMORADO', 'Demorado'),
        ('CANCELADO', 'Cancelado'),
        ('LANDED', 'Aterrizado'),
        ('BOARDING', 'Embarcando'),
        ('DEPARTED', 'Despegado'),
    ]
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='A_TIEMPO')
    
    fecha_operacion = models.DateField()
    
    # Tiempos de Salida
    std = models.DateTimeField(verbose_name="Scheduled Time Departure")
    etd = models.DateTimeField(null=True, blank=True, verbose_name="Estimated Time Departure")
    atd = models.DateTimeField(null=True, blank=True, verbose_name="Actual Time Departure")
    
    # Tiempos de Llegada
    sta = models.DateTimeField(verbose_name="Scheduled Time Arrival")
    eta = models.DateTimeField(null=True, blank=True, verbose_name="Estimated Time Arrival")
    ata = models.DateTimeField(null=True, blank=True, verbose_name="Actual Time Arrival")

    class Meta:
        db_table = 'vuelos_diarios'
        verbose_name = 'Operación del Día'

    def __str__(self):
        return f"{self.numero_vuelo} - {self.fecha_operacion} ({self.tipo_operacion})"

    def clean(self):
        """Validaciones de integridad de datos para el vuelo diario"""
        super().clean()
        errors = {}

        # 1. Validación: ATA (Llegada Real) vs ATD (Salida Real)
        if self.atd and self.ata and self.ata < self.atd:
            errors['ata'] = "La hora real de llegada (ATA) no puede ser anterior a la de salida (ATD)."

        # 2. Validación: Fecha de operación (No más de 10 años atrás)
        limite_pasado = timezone.now().date() - timedelta(days=365*10)
        if self.fecha_operacion and self.fecha_operacion < limite_pasado:
            errors['fecha_operacion'] = "Error de fecha: No se pueden registrar operaciones de hace más de 10 años."

        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        self.full_clean() # Fuerza a ejecutar clean() antes de guardar en la DB
        super().save(*args, **kwargs)


# ==========================================
# 9. SUBMÓDULO: HITOS DE RAMPA
# ==========================================
class HitoRampa(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    vuelo_diario = models.OneToOneField(VueloDiario, on_delete=models.CASCADE, related_name='hitos')
    operador_rampa = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    
    catering_inicio = models.DateTimeField(null=True, blank=True)
    catering_fin = models.DateTimeField(null=True, blank=True)
    combustible_inicio = models.DateTimeField(null=True, blank=True)
    combustible_fin = models.DateTimeField(null=True, blank=True)
    maletas_inicio = models.DateTimeField(null=True, blank=True)
    maletas_fin = models.DateTimeField(null=True, blank=True)
    pushback_realizado = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'hitos_rampa'

    def clean(self):
        """Validaciones para los hitos de rampa"""
        super().clean()
        errors = {}

        # Validación: Combustible fin vs inicio
        if self.combustible_inicio and self.combustible_fin:
            if self.combustible_fin < self.combustible_inicio:
                errors['combustible_fin'] = "La hora de finalización del combustible no puede ser anterior al inicio."

        # Validación: Catering fin vs inicio
        if self.catering_inicio and self.catering_fin:
            if self.catering_fin < self.catering_inicio:
                errors['catering_fin'] = "La hora de finalización del catering no puede ser anterior al inicio."

        # Validación: Maletas fin vs inicio
        if self.maletas_inicio and self.maletas_fin:
            if self.maletas_fin < self.maletas_inicio:
                errors['maletas_fin'] = "La hora de finalización de maletas no puede ser anterior al inicio."

        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

# ==========================================
# 10. SUBMÓDULO: MANIFIESTO DE PASAJEROS
# ==========================================
class ManifiestoPasajeros(models.Model):
    # Django asigna BigAutoField (BigInt) por defecto si está en settings
    vuelo_diario = models.OneToOneField(VueloDiario, on_delete=models.CASCADE, related_name='manifiesto')
    total_pax = models.IntegerField(default=0)
    pax_ejecutivo = models.IntegerField(default=0)
    pax_turista = models.IntegerField(default=0)
    pax_conexion = models.IntegerField(default=0)
    pax_silla_ruedas = models.IntegerField(default=0)
    infantes_menores = models.IntegerField(default=0)
    peso_equipaje_total_kg = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    peso_carga_total_kg = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    class Meta:
        db_table = 'manifiesto_pasajeros'