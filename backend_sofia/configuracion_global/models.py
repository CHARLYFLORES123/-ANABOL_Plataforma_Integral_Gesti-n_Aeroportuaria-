from django.db import models

# ==========================================
# SUBMÓDULO: DICCIONARIOS MAESTROS (METADATOS)
# ==========================================

class DiccAerolinea(models.Model):
    nombre_oficial = models.CharField(max_length=100)
    codigo_iata = models.CharField(max_length=3, unique=True)
    codigo_icao = models.CharField(max_length=4, unique=True)
    logo_url = models.URLField(max_length=255, blank=True, null=True)

    class Meta:
        db_table = 'dicc_aerolineas'
        verbose_name = 'Diccionario Aerolínea'
        verbose_name_plural = 'Diccionario Aerolíneas'

    def __str__(self):
        return f"{self.nombre_oficial} ({self.codigo_iata})"


class DiccAeronave(models.Model):
    modelo = models.CharField(max_length=50)
    capacidad_max_pasajeros = models.IntegerField()
    envergadura_categoria = models.CharField(max_length=10)  # ej. 'CAT_C'

    class Meta:
        db_table = 'dicc_aeronaves'
        verbose_name = 'Diccionario Aeronave'
        verbose_name_plural = 'Diccionario Aeronaves'

    def __str__(self):
        return f"{self.modelo} ({self.envergadura_categoria})"


class DiccAeropuerto(models.Model):
    nombre_completo = models.CharField(max_length=150)
    ciudad = models.CharField(max_length=100)
    pais = models.CharField(max_length=100)
    codigo_iata = models.CharField(max_length=3, unique=True)
    codigo_icao = models.CharField(max_length=4, unique=True)

    class Meta:
        db_table = 'dicc_aeropuertos'
        verbose_name = 'Diccionario Aeropuerto'
        verbose_name_plural = 'Diccionario Aeropuertos'

    def __str__(self):
        return f"{self.nombre_completo} ({self.codigo_iata})"


# ==========================================
# SUBMÓDULO: CONFIGURACIÓN DEL AEROPUERTO LOCAL
# ==========================================

class AeropuertoLocalSettings(models.Model):
    nombre_aeropuerto = models.CharField(max_length=150)
    # PROTECT evita que borres un aeropuerto del diccionario si el aeropuerto local lo está usando
    aeropuerto_maestro = models.OneToOneField(DiccAeropuerto, on_delete=models.PROTECT, related_name='settings_local')
    telefono_soporte = models.CharField(max_length=20)
    zona_horaria = models.CharField(max_length=50, default='America/La_Paz')
    direccion = models.CharField(max_length=255)

    class Meta:
        db_table = 'aeropuerto_local_settings'
        verbose_name = 'Configuración Aeropuerto Local'
        verbose_name_plural = 'Configuraciones Aeropuerto Local'

    def __str__(self):
        return self.nombre_aeropuerto


# ==========================================
# SUBMÓDULO: INTEGRACIONES Y WEBHOOKS
# ==========================================

class IntegracionWebhook(models.Model):
    servicio_nombre = models.CharField(max_length=100)
    webhook_url = models.URLField(max_length=255)
    evento_disparador = models.CharField(max_length=50)  # ej. 'CAMBIO_ESTADO_VUELO'
    token_autorizacion = models.TextField(blank=True, null=True)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = 'integraciones_webhooks'
        verbose_name = 'Integración Webhook'
        verbose_name_plural = 'Integraciones Webhooks'

    def __str__(self):
        return f"{self.servicio_nombre} - {self.evento_disparador}"


# ==========================================
# SUBMÓDULO: MULTI-MONEDA Y TASAS
# ==========================================

class MultimonedaTasa(models.Model):
    codigo_iso = models.CharField(max_length=3, unique=True)  # ej. 'BOB', 'USD', 'MXN'
    simbolo = models.CharField(max_length=5)  # ej. 'Bs', '$'
    tipo_cambio_ref_usd = models.DecimalField(max_digits=10, decimal_places=4)
    tasa_seguridad_nacional = models.DecimalField(max_digits=10, decimal_places=2)
    tasa_seguridad_internacional = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        db_table = 'multimoneda_tasas'
        verbose_name = 'Multi-moneda y Tasa'
        verbose_name_plural = 'Multi-moneda y Tasas'

    def __str__(self):
        return f"{self.codigo_iso} ({self.simbolo})"