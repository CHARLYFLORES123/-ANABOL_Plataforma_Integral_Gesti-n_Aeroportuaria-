from rest_framework import serializers
from .models import AsignacionPuerta, MostradorCheckin, CintaEquipaje, PosicionRampa

class AsignacionPuertaSerializer(serializers.ModelSerializer):
    vuelo_numero = serializers.ReadOnlyField(source='vuelo_diario.numero_vuelo')

    class Meta:
        model = AsignacionPuerta
        fields = '__all__'

class MostradorCheckinSerializer(serializers.ModelSerializer):
    aerolinea_nombre = serializers.ReadOnlyField(source='aerolinea_empresa.razon_social')
    vuelo_numero = serializers.ReadOnlyField(source='vuelo_diario.numero_vuelo')

    class Meta:
        model = MostradorCheckin
        fields = '__all__'

class CintaEquipajeSerializer(serializers.ModelSerializer):
    vuelo_numero = serializers.ReadOnlyField(source='vuelo_diario.numero_vuelo')

    class Meta:
        model = CintaEquipaje
        fields = '__all__'

class PosicionRampaSerializer(serializers.ModelSerializer):
    vuelo_numero = serializers.ReadOnlyField(source='vuelo_diario.numero_vuelo')

    class Meta:
        model = PosicionRampa
        fields = '__all__'