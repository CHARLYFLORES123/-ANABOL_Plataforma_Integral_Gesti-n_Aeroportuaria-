from rest_framework import serializers
from .models import FidsZona, FidsPlantilla, FidsDispositivo, FidsAlertaEmergencia

class FidsZonaSerializer(serializers.ModelSerializer):
    class Meta:
        model = FidsZona
        fields = '__all__'

class FidsPlantillaSerializer(serializers.ModelSerializer):
    class Meta:
        model = FidsPlantilla
        fields = '__all__'

class FidsDispositivoSerializer(serializers.ModelSerializer):
    zona_nombre = serializers.ReadOnlyField(source='zona_fids.nombre_zona')
    plantilla_nombre = serializers.ReadOnlyField(source='plantilla.nombre_plantilla')

    class Meta:
        model = FidsDispositivo
        fields = '__all__'

class FidsAlertaEmergenciaSerializer(serializers.ModelSerializer):
    pantalla_codigo = serializers.ReadOnlyField(source='pantalla_destino.codigo_pantalla')
    usuario_nombre = serializers.ReadOnlyField(source='usuario_emisor.username')

    class Meta:
        model = FidsAlertaEmergencia
        fields = '__all__'
        read_only_fields = ('ultima_conexion',)