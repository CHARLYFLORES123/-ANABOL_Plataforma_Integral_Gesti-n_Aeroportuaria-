from rest_framework import serializers
from .models import VueloPlanificado, VueloDiario, HitoRampa, ManifiestoPasajeros

class VueloPlanificadoSerializer(serializers.ModelSerializer):
    aerolinea_nombre = serializers.ReadOnlyField(source='aerolinea_empresa.razon_social')
    aeropuerto_origen_nombre = serializers.ReadOnlyField(source='aeropuerto_origen.nombre_completo')
    aeropuerto_destino_nombre = serializers.ReadOnlyField(source='aeropuerto_destino.nombre_completo')

    class Meta:
        model = VueloPlanificado
        fields = '__all__'

class HitoRampaSerializer(serializers.ModelSerializer):
    vuelo_numero = serializers.ReadOnlyField(source='vuelo_diario.numero_vuelo')
    operador_nombre = serializers.ReadOnlyField(source='operador_rampa.username')

    class Meta:
        model = HitoRampa
        fields = '__all__'

class ManifiestoPasajerosSerializer(serializers.ModelSerializer):
    vuelo_numero = serializers.ReadOnlyField(source='vuelo_diario.numero_vuelo')
    vuelo_fecha = serializers.ReadOnlyField(source='vuelo_diario.fecha_operacion')

    class Meta:
        model = ManifiestoPasajeros
        fields = '__all__'

class VueloDiarioSerializer(serializers.ModelSerializer):
    aerolinea_nombre = serializers.ReadOnlyField(source='aerolinea_empresa.razon_social')
    aeropuerto_origen_nombre = serializers.ReadOnlyField(source='aeropuerto_origen.nombre_completo')
    aeropuerto_destino_nombre = serializers.ReadOnlyField(source='aeropuerto_destino.nombre_completo')
    # Incluimos los OneToOneRel como opcionales para lectura
    hitos = HitoRampaSerializer(read_only=True)
    manifiesto = ManifiestoPasajerosSerializer(read_only=True)

    class Meta:
        model = VueloDiario
        fields = '__all__'