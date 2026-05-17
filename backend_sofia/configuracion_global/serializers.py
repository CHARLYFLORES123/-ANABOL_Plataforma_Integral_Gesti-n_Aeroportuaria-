from rest_framework import serializers
from .models import (
    DiccAerolinea, DiccAeronave, DiccAeropuerto,
    AeropuertoLocalSettings, IntegracionWebhook, MultimonedaTasa
)

class DiccAerolineaSerializer(serializers.ModelSerializer):
    class Meta:
        model = DiccAerolinea
        fields = '__all__'

class DiccAeronaveSerializer(serializers.ModelSerializer):
    class Meta:
        model = DiccAeronave
        fields = '__all__'

class DiccAeropuertoSerializer(serializers.ModelSerializer):
    class Meta:
        model = DiccAeropuerto
        fields = '__all__'

class AeropuertoLocalSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = AeropuertoLocalSettings
        fields = '__all__'

class IntegracionWebhookSerializer(serializers.ModelSerializer):
    class Meta:
        model = IntegracionWebhook
        fields = '__all__'

class MultimonedaTasaSerializer(serializers.ModelSerializer):
    class Meta:
        model = MultimonedaTasa
        fields = '__all__'