import json
from django.core.serializers.json import DjangoJSONEncoder
from .models import LogAuditoria

def registrar_log(request, accion, tabla, registro_id, valor_anterior=None, valor_nuevo=None):
    """
    Función auxiliar para registrar logs de auditoría capturando el usuario e IP.
    """
    # Obtener IP del cliente
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')

    # Crear el registro en la base de datos
    LogAuditoria.objects.create(
        usuario=request.user if request.user.is_authenticated else None,
        accion=accion,
        tabla_afectada=tabla,
        registro_id=str(registro_id),
        valor_anterior=json.dumps(valor_anterior, cls=DjangoJSONEncoder) if isinstance(valor_anterior, dict) else valor_anterior,
        valor_nuevo=json.dumps(valor_nuevo, cls=DjangoJSONEncoder) if isinstance(valor_nuevo, dict) else valor_nuevo,
        ip_address=ip
    )