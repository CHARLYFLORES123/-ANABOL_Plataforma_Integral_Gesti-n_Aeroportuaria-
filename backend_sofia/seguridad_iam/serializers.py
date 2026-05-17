from rest_framework import serializers
from .models import AerolineaEmpresa, TorreControlPersonal, LogAuditoria, SesionCredencial

class AerolineaEmpresaSerializer(serializers.ModelSerializer):
    class Meta:
        model = AerolineaEmpresa
        fields = '__all__'

class TorreControlPersonalSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.ReadOnlyField(source='usuario.username')

    class Meta:
        model = TorreControlPersonal
        fields = '__all__'

class LogAuditoriaSerializer(serializers.ModelSerializer):
    usuario_email = serializers.ReadOnlyField(source='usuario.email')

    class Meta:
        model = LogAuditoria
        fields = '__all__'
        read_only_fields = ('fecha_hora',)

class SesionCredencialSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.ReadOnlyField(source='usuario.username')
    class Meta:
        model = SesionCredencial
        fields = '__all__'
        read_only_fields = ('ultimo_acceso',)