import csv
from datetime import datetime
from io import BytesIO
from django.http import HttpResponse
from rest_framework import viewsets, permissions
from rest_framework.decorators import action

# Para la generación de PDF
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, landscape
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet

from .models import (
    DiccAerolinea, DiccAeronave, DiccAeropuerto,
    AeropuertoLocalSettings, IntegracionWebhook, MultimonedaTasa
)
from .serializers import (
    DiccAerolineaSerializer, DiccAeronaveSerializer, DiccAeropuertoSerializer,
    AeropuertoLocalSettingsSerializer, IntegracionWebhookSerializer, MultimonedaTasaSerializer
)

class DiccAerolineaViewSet(viewsets.ModelViewSet):
    queryset = DiccAerolinea.objects.all()
    serializer_class = DiccAerolineaSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'], url_path='export/excel')
    def export_excel(self, request):
        response = HttpResponse(content_type='text/csv')
        response.write(u'\ufeff'.encode('utf8'))
        response['Content-Disposition'] = 'attachment; filename="maestro_aerolineas.csv"'
        writer = csv.writer(response)
        writer.writerow(['ID', 'Nombre Oficial', 'IATA', 'ICAO'])
        queryset = self.get_queryset().order_by('nombre_oficial')
        for item in queryset:
            writer.writerow([item.id, item.nombre_oficial, item.codigo_iata, item.codigo_icao])
        return response

    @action(detail=False, methods=['get'], url_path='export/pdf')
    def export_pdf(self, request):
        buffer = BytesIO()
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="reporte_aerolineas.pdf"'
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        elements = [Paragraph("<h1>Diccionario Maestro: Aerolíneas</h1>", styles['h1']), 
                    Paragraph(f"Fecha: {datetime.now().strftime('%d/%m/%Y %H:%M')}", styles['Normal']), Spacer(1, 12)]
        data = [['ID', 'Nombre Oficial', 'IATA', 'ICAO']]
        for item in self.get_queryset().order_by('nombre_oficial'):
            data.append([item.id, item.nombre_oficial, item.codigo_iata, item.codigo_icao])
        table = Table(data)
        table.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, 0), colors.grey), ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                                   ('ALIGN', (0, 0), (-1, -1), 'CENTER'), ('GRID', (0, 0), (-1, -1), 1, colors.black)]))
        elements.append(table)
        doc.build(elements)
        response.write(buffer.getvalue())
        buffer.close()
        return response

class DiccAeronaveViewSet(viewsets.ModelViewSet):
    queryset = DiccAeronave.objects.all()
    serializer_class = DiccAeronaveSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'], url_path='export/excel')
    def export_excel(self, request):
        response = HttpResponse(content_type='text/csv')
        response.write(u'\ufeff'.encode('utf8'))
        response['Content-Disposition'] = 'attachment; filename="maestro_aeronaves.csv"'
        writer = csv.writer(response)
        writer.writerow(['ID', 'Modelo', 'Capacidad PAX', 'Categoría Envergadura'])
        queryset = self.get_queryset().order_by('modelo')
        for item in queryset:
            writer.writerow([item.id, item.modelo, item.capacidad_max_pasajeros, item.envergadura_categoria])
        return response

    @action(detail=False, methods=['get'], url_path='export/pdf')
    def export_pdf(self, request):
        buffer = BytesIO()
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="reporte_aeronaves.pdf"'
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        elements = [Paragraph("<h1>Diccionario Maestro: Aeronaves</h1>", styles['h1']), 
                    Paragraph(f"Fecha: {datetime.now().strftime('%d/%m/%Y %H:%M')}", styles['Normal']), Spacer(1, 12)]
        data = [['ID', 'Modelo', 'PAX', 'Categoría']]
        for item in self.get_queryset().order_by('modelo'):
            data.append([item.id, item.modelo, item.capacidad_max_pasajeros, item.envergadura_categoria])
        table = Table(data)
        table.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, 0), colors.grey), ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                                   ('ALIGN', (0, 0), (-1, -1), 'CENTER'), ('GRID', (0, 0), (-1, -1), 1, colors.black)]))
        elements.append(table)
        doc.build(elements)
        response.write(buffer.getvalue())
        buffer.close()
        return response

class DiccAeropuertoViewSet(viewsets.ModelViewSet):
    queryset = DiccAeropuerto.objects.all()
    serializer_class = DiccAeropuertoSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'], url_path='export/excel')
    def export_excel(self, request):
        response = HttpResponse(content_type='text/csv')
        response.write(u'\ufeff'.encode('utf8'))
        response['Content-Disposition'] = 'attachment; filename="maestro_aeropuertos.csv"'
        writer = csv.writer(response)
        writer.writerow(['IATA', 'ICAO', 'Nombre', 'Ciudad', 'País'])
        queryset = self.get_queryset().order_by('codigo_iata')
        for item in queryset:
            writer.writerow([item.codigo_iata, item.codigo_icao, item.nombre_completo, item.ciudad, item.pais])
        return response

    @action(detail=False, methods=['get'], url_path='export/pdf')
    def export_pdf(self, request):
        buffer = BytesIO()
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="reporte_aeropuertos.pdf"'
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        elements = [Paragraph("<h1>Diccionario Maestro: Aeropuertos</h1>", styles['h1']), 
                    Paragraph(f"Fecha: {datetime.now().strftime('%d/%m/%Y %H:%M')}", styles['Normal']), Spacer(1, 12)]
        data = [['IATA', 'ICAO', 'Nombre', 'Ciudad']]
        for item in self.get_queryset().order_by('codigo_iata'):
            data.append([item.codigo_iata, item.codigo_icao, (item.nombre_completo[:25] + '..'), item.ciudad])
        table = Table(data)
        table.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, 0), colors.grey), ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                                   ('ALIGN', (0, 0), (-1, -1), 'CENTER'), ('GRID', (0, 0), (-1, -1), 1, colors.black)]))
        elements.append(table)
        doc.build(elements)
        response.write(buffer.getvalue())
        buffer.close()
        return response

class AeropuertoLocalSettingsViewSet(viewsets.ModelViewSet):
    queryset = AeropuertoLocalSettings.objects.all()
    serializer_class = AeropuertoLocalSettingsSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'], url_path='export/excel')
    def export_excel(self, request):
        response = HttpResponse(content_type='text/csv')
        response.write(u'\ufeff'.encode('utf8'))
        response['Content-Disposition'] = 'attachment; filename="configuracion_local.csv"'
        writer = csv.writer(response)
        writer.writerow(['Aeropuerto', 'Dirección', 'Zona Horaria', 'Soporte'])
        queryset = self.get_queryset()
        for item in queryset:
            writer.writerow([item.nombre_aeropuerto, item.direccion, item.zona_horaria, item.telefono_soporte])
        return response

    @action(detail=False, methods=['get'], url_path='export/pdf')
    def export_pdf(self, request):
        buffer = BytesIO()
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="reporte_configuracion_local.pdf"'
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        elements = [
            Paragraph("<h1>Configuración del Aeropuerto Local</h1>", styles['h1']), 
            Paragraph(f"Fecha: {datetime.now().strftime('%d/%m/%Y %H:%M')}", styles['Normal']), 
            Spacer(1, 12)
        ]
        data = [['Aeropuerto', 'Dirección', 'Zona Horaria', 'Soporte']]
        for item in self.get_queryset():
            data.append([item.nombre_aeropuerto, item.direccion, item.zona_horaria, item.telefono_soporte])
        table = Table(data)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        elements.append(table)
        doc.build(elements)
        response.write(buffer.getvalue())
        buffer.close()
        return response
class IntegracionWebhookViewSet(viewsets.ModelViewSet):
    queryset = IntegracionWebhook.objects.all()
    serializer_class = IntegracionWebhookSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'], url_path='export/excel')
    def export_excel(self, request):
        response = HttpResponse(content_type='text/csv')
        response.write(u'\ufeff'.encode('utf8'))
        response['Content-Disposition'] = 'attachment; filename="integraciones_webhooks.csv"'
        writer = csv.writer(response)
        writer.writerow(['Servicio', 'Evento Disparador', 'URL Destino', 'Estado'])
        queryset = self.get_queryset().order_by('servicio_nombre')
        for item in queryset:
            writer.writerow([item.servicio_nombre, item.evento_disparador, item.webhook_url, 'Activo' if item.activo else 'Inactivo'])
        return response

    @action(detail=False, methods=['get'], url_path='export/pdf')
    def export_pdf(self, request):
        buffer = BytesIO()
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="reporte_integraciones.pdf"'
        doc = SimpleDocTemplate(buffer, pagesize=landscape(letter))
        styles = getSampleStyleSheet()
        elements = [
            Paragraph("<h1>Integraciones y Webhooks</h1>", styles['h1']), 
            Paragraph(f"Fecha: {datetime.now().strftime('%d/%m/%Y %H:%M')}", styles['Normal']), 
            Spacer(1, 12)
        ]
        data = [['Servicio', 'Evento', 'URL Destino', 'Estado']]
        for item in self.get_queryset().order_by('servicio_nombre'):
            data.append([
                item.servicio_nombre,
                item.evento_disparador,
                (item.webhook_url[:50] + '..') if len(item.webhook_url) > 50 else item.webhook_url,
                'ACTIVO' if item.activo else 'INACTIVO'
            ])
        table = Table(data, colWidths=[120, 120, 300, 80])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
        ]))
        elements.append(table)
        doc.build(elements)
        response.write(buffer.getvalue())
        buffer.close()
        return response

class MultimonedaTasaViewSet(viewsets.ModelViewSet):
    queryset = MultimonedaTasa.objects.all()
    serializer_class = MultimonedaTasaSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'], url_path='export/excel')
    def export_excel(self, request):
        response = HttpResponse(content_type='text/csv')
        response.write(u'\ufeff'.encode('utf8')) # BOM para Excel
        response['Content-Disposition'] = 'attachment; filename="tasas_monedas.csv"'
        writer = csv.writer(response)
        writer.writerow(['Moneda', 'Símbolo', 'Cambio Ref (USD)', 'Tasa Nacional', 'Tasa Internacional'])
        queryset = self.get_queryset().order_by('codigo_iso')
        for item in queryset:
            writer.writerow([item.codigo_iso, item.simbolo, item.tipo_cambio_ref_usd, item.tasa_seguridad_nacional, item.tasa_seguridad_internacional])
        return response

    @action(detail=False, methods=['get'], url_path='export/pdf')
    def export_pdf(self, request):
        buffer = BytesIO()
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="reporte_tarifario_tasas.pdf"'
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        elements = [
            Paragraph("<h1>Tarifario: Multi-moneda y Tasas de Seguridad</h1>", styles['h1']), 
            Paragraph(f"Fecha de generación: {datetime.now().strftime('%d/%m/%Y %H:%M')}", styles['Normal']), 
            Spacer(1, 12)
        ]
        data = [['Moneda', 'Sim.', 'Cambio Ref.', 'Tasa Nac.', 'Tasa Int.']]
        for item in self.get_queryset().order_by('codigo_iso'):
            data.append([item.codigo_iso, item.simbolo, item.tipo_cambio_ref_usd, item.tasa_seguridad_nacional, item.tasa_seguridad_internacional])
        table = Table(data)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
        ]))
        elements.append(table)
        doc.build(elements)
        response.write(buffer.getvalue())
        buffer.close()
        return response
