import csv
import json
from io import BytesIO
from datetime import datetime
from django.http import HttpResponse
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import AerolineaEmpresa, TorreControlPersonal, LogAuditoria, SesionCredencial
from .serializers import (
    AerolineaEmpresaSerializer, 
    TorreControlPersonalSerializer, 
    LogAuditoriaSerializer, 
    SesionCredencialSerializer
)
from .utils import registrar_log

# Para la generación de PDF
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet

class AerolineaEmpresaViewSet(viewsets.ModelViewSet):
    queryset = AerolineaEmpresa.objects.all()
    serializer_class = AerolineaEmpresaSerializer

    def perform_create(self, serializer):
        instance = serializer.save()
        registrar_log(
            self.request, 
            accion="CREAR_EMPRESA", 
            tabla="aerolineas_empresas", 
            registro_id=instance.id, 
            valor_nuevo=serializer.data
        )

    def perform_update(self, serializer):
        valor_anterior = AerolineaEmpresaSerializer(self.get_object()).data
        instance = serializer.save()
        registrar_log(
            self.request, 
            accion="ACTUALIZAR_EMPRESA", 
            tabla="aerolineas_empresas", 
            registro_id=instance.id, 
            valor_anterior=valor_anterior,
            valor_nuevo=serializer.data
        )

    def perform_destroy(self, instance):
        registro_id = instance.id
        valor_anterior = AerolineaEmpresaSerializer(instance).data
        instance.delete()
        registrar_log(
            self.request, 
            accion="ELIMINAR_EMPRESA", 
            tabla="aerolineas_empresas", 
            registro_id=registro_id, 
            valor_anterior=valor_anterior
        )

    @action(detail=False, methods=['get'], url_path='export/excel')
    def export_excel(self, request):
        response = HttpResponse(content_type='text/csv')
        response.write(u'\ufeff'.encode('utf8'))  # BOM para caracteres especiales
        response['Content-Disposition'] = 'attachment; filename="aerolineas_empresas.csv"'

        writer = csv.writer(response)
        # Escribir encabezados
        writer.writerow(['ID', 'Razón Social', 'RUC/NIT', 'Tipo Empresa', 'Email Contacto', 'Celular', 'Activo'])

        queryset = self.get_queryset().order_by('razon_social')
        for item in queryset:
            writer.writerow([
                item.id,
                item.razon_social,
                item.ruc_nit,
                item.tipo_empresa,
                item.correo_contacto,
                item.celular_contacto,
                'Sí' if item.activo else 'No',
            ])
        return response

    @action(detail=False, methods=['get'], url_path='export/pdf')
    def export_pdf(self, request):
        buffer = BytesIO()
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="reporte_empresas.pdf"'

        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        elements = []

        # Título del documento
        elements.append(Paragraph("<h1>Reporte de Aerolíneas y Empresas</h1>", styles['h1']))
        elements.append(Paragraph(f"Fecha de generación: {datetime.now().strftime('%d/%m/%Y %H:%M')}", styles['Normal']))
        elements.append(Spacer(1, 12))

        # Datos de la tabla
        data = [['ID', 'Razón Social', 'RUC/NIT', 'Tipo', 'Email', 'Activo']]
        queryset = self.get_queryset().order_by('razon_social')
        for item in queryset:
            data.append([
                str(item.id),
                item.razon_social,
                item.ruc_nit,
                item.tipo_empresa,
                item.correo_contacto,
                'Sí' if item.activo else 'No',
            ])

        table = Table(data)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        elements.append(table)

        doc.build(elements)
        pdf = buffer.getvalue()
        buffer.close()
        response.write(pdf)
        return response

class LogAuditoriaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = LogAuditoria.objects.all().order_by('-fecha_hora')
    serializer_class = LogAuditoriaSerializer

    @action(detail=False, methods=['get'], url_path='export/excel')
    def export_excel(self, request):
        response = HttpResponse(content_type='text/csv')
        response.write(u'\ufeff'.encode('utf8'))  # BOM para caracteres especiales
        response['Content-Disposition'] = 'attachment; filename="logs_auditoria.csv"'

        writer = csv.writer(response)
        # Escribir encabezados
        writer.writerow(['ID', 'Fecha/Hora', 'Usuario', 'Acción', 'Tabla Afectada', 'Registro ID', 'IP Origen', 'Valor Anterior', 'Valor Nuevo'])

        queryset = self.get_queryset().order_by('-fecha_hora')
        for item in queryset:
            writer.writerow([
                item.id,
                item.fecha_hora.strftime('%Y-%m-%d %H:%M:%S'),
                item.usuario_email,
                item.accion,
                item.tabla_afectada,
                item.registro_id,
                item.ip_address,
                json.dumps(item.valor_anterior) if item.valor_anterior else '',
                json.dumps(item.valor_nuevo) if item.valor_nuevo else '',
            ])
        return response

    @action(detail=False, methods=['get'], url_path='export/pdf')
    def export_pdf(self, request):
        buffer = BytesIO()
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="reporte_logs_auditoria.pdf"'

        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        elements = []

        elements.append(Paragraph("<h1>Reporte de Logs de Auditoría</h1>", styles['h1']))
        elements.append(Paragraph(f"Fecha de generación: {datetime.now().strftime('%d/%m/%Y %H:%M')}", styles['Normal']))
        elements.append(Spacer(1, 12))

        # Datos de la tabla
        data = [['ID', 'Fecha/Hora', 'Usuario', 'Acción', 'Tabla', 'IP Origen']]
        queryset = self.get_queryset().order_by('-fecha_hora')
        for item in queryset:
            data.append([
                str(item.id),
                item.fecha_hora.strftime('%Y-%m-%d %H:%M:%S'),
                item.usuario_email,
                item.accion,
                item.tabla_afectada,
                item.ip_address,
            ])

        table = Table(data)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey), ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'), ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12), ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        elements.append(table)

        doc.build(elements)
        pdf = buffer.getvalue()
        buffer.close()
        response.write(pdf)
        return response

class TorreControlPersonalViewSet(viewsets.ModelViewSet):
    queryset = TorreControlPersonal.objects.all()
    serializer_class = TorreControlPersonalSerializer

    def perform_create(self, serializer):
        instance = serializer.save()
        registrar_log(
            self.request, 
            accion="REGISTRAR_PERSONAL_ATC", 
            tabla="torre_control_personal", 
            registro_id=instance.id, 
            valor_nuevo=serializer.data
        )

    def perform_update(self, serializer):
        valor_anterior = TorreControlPersonalSerializer(self.get_object()).data
        instance = serializer.save()
        registrar_log(
            self.request, 
            accion="ACTUALIZAR_PERSONAL_ATC", 
            tabla="torre_control_personal", 
            registro_id=instance.id, 
            valor_anterior=valor_anterior,
            valor_nuevo=serializer.data
        )

    def perform_destroy(self, instance):
        registro_id = instance.id
        valor_anterior = TorreControlPersonalSerializer(instance).data
        instance.delete()
        registrar_log(
            self.request, 
            accion="ELIMINAR_PERSONAL_ATC", 
            tabla="torre_control_personal", 
            registro_id=registro_id, 
            valor_anterior=valor_anterior
        )

    @action(detail=False, methods=['get'], url_path='export/excel')
    def export_excel(self, request):
        response = HttpResponse(content_type='text/csv')
        response.write(u'\ufeff'.encode('utf8'))  # BOM para caracteres especiales
        response['Content-Disposition'] = 'attachment; filename="personal_atc.csv"'

        writer = csv.writer(response)
        # Escribir encabezados
        writer.writerow(['ID', 'Usuario', 'Licencia #', 'Cargo', 'Vencimiento', 'Médico Vigente'])

        queryset = self.get_queryset().select_related('usuario')
        for item in queryset:
            writer.writerow([
                item.id,
                item.usuario.username if item.usuario else 'N/A',
                item.numero_licencia_atc,
                item.cargo_atc,
                item.vencimiento_licencia,
                'Sí' if item.certificado_medico_vigente else 'No',
            ])
        return response

    @action(detail=False, methods=['get'], url_path='export/pdf')
    def export_pdf(self, request):
        buffer = BytesIO()
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="reporte_personal_atc.pdf"'

        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        elements = []

        elements.append(Paragraph("<h1>Reporte de Personal - Torre de Control</h1>", styles['h1']))
        elements.append(Paragraph(f"Fecha de generación: {datetime.now().strftime('%d/%m/%Y %H:%M')}", styles['Normal']))
        elements.append(Spacer(1, 12))

        # Datos de la tabla
        data = [['ID', 'Usuario', 'Licencia #', 'Cargo', 'Vencimiento', 'Médico']]
        queryset = self.get_queryset().select_related('usuario')
        for item in queryset:
            data.append([
                str(item.id),
                item.usuario.username if item.usuario else 'N/A',
                item.numero_licencia_atc,
                item.cargo_atc,
                str(item.vencimiento_licencia),
                'Vigente' if item.certificado_medico_vigente else 'Vencido',
            ])

        table = Table(data)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        elements.append(table)

        doc.build(elements)
        pdf = buffer.getvalue()
        buffer.close()
        response.write(pdf)
        return response

class LogAuditoriaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = LogAuditoria.objects.all().order_by('-fecha_hora')
    serializer_class = LogAuditoriaSerializer

class SesionCredencialViewSet(viewsets.ModelViewSet):
    queryset = SesionCredencial.objects.all()
    serializer_class = SesionCredencialSerializer

    def perform_create(self, serializer):
        instance = serializer.save()
        registrar_log(
            self.request, 
            accion="CREAR_SESION", 
            tabla="sesiones_credenciales", 
            registro_id=instance.id, 
            valor_nuevo=serializer.data
        )

    def perform_update(self, serializer):
        valor_anterior = SesionCredencialSerializer(self.get_object()).data
        instance = serializer.save()
        registrar_log(
            self.request, 
            accion="ACTUALIZAR_SESION", 
            tabla="sesiones_credenciales", 
            registro_id=instance.id, 
            valor_anterior=valor_anterior,
            valor_nuevo=serializer.data
        )

    def perform_destroy(self, instance):
        registro_id = instance.id
        valor_anterior = SesionCredencialSerializer(instance).data
        instance.delete()
        registrar_log(
            self.request, 
            accion="CERRAR_SESION", 
            tabla="sesiones_credenciales", 
            registro_id=registro_id, 
            valor_anterior=valor_anterior
        )

    @action(detail=False, methods=['get'], url_path='export/excel')
    def export_excel(self, request):
        response = HttpResponse(content_type='text/csv')
        response.write(u'\ufeff'.encode('utf8'))  # BOM para caracteres especiales
        response['Content-Disposition'] = 'attachment; filename="sesiones_usuarios.csv"'

        writer = csv.writer(response)
        writer.writerow(['ID', 'Usuario', 'Dispositivo', 'IP Origen', 'MFA', 'Estado', 'Último Acceso', 'Expira At'])

        queryset = self.get_queryset().select_related('usuario').order_by('-ultimo_acceso')
        for item in queryset:
            writer.writerow([
                item.id,
                item.usuario.username if item.usuario else 'N/A',
                item.dispositivo,
                item.ip_origen,
                'Sí' if item.mfa_verificado else 'No',
                item.estado,
                item.ultimo_acceso.strftime('%d/%m/%Y %H:%M') if item.ultimo_acceso else 'N/A',
                item.expira_at.strftime('%d/%m/%Y %H:%M') if item.expira_at else 'N/A',
            ])
        return response

    @action(detail=False, methods=['get'], url_path='export/pdf')
    def export_pdf(self, request):
        buffer = BytesIO()
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="reporte_sesiones.pdf"'

        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        elements = []

        elements.append(Paragraph("<h1>Reporte de Sesiones y Credenciales</h1>", styles['h1']))
        elements.append(Paragraph(f"Fecha de generación: {datetime.now().strftime('%d/%m/%Y %H:%M')}", styles['Normal']))
        elements.append(Spacer(1, 12))

        data = [['ID', 'Usuario', 'Dispositivo', 'IP', 'MFA', 'Estado']]
        queryset = self.get_queryset().select_related('usuario').order_by('-ultimo_acceso')
        for item in queryset:
            data.append([
                str(item.id),
                item.usuario.username if item.usuario else 'N/A',
                item.dispositivo[:20],
                item.ip_origen,
                'Sí' if item.mfa_verificado else 'No',
                item.estado,
            ])

        table = Table(data)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        elements.append(table)

        doc.build(elements)
        pdf = buffer.getvalue()
        buffer.close()
        response.write(pdf)
        return response
