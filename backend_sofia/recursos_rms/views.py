import csv
from datetime import datetime
from io import BytesIO
from django.http import HttpResponse
from rest_framework import viewsets
from rest_framework.decorators import action

# Para la generación de PDF
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, landscape
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet

from .models import AsignacionPuerta, MostradorCheckin, CintaEquipaje, PosicionRampa
from .serializers import (
    AsignacionPuertaSerializer, MostradorCheckinSerializer,
    CintaEquipajeSerializer, PosicionRampaSerializer
)
from seguridad_iam.utils import registrar_log

class BaseRMSViewSet(viewsets.ModelViewSet):
    """Clase base para manejar logs de auditoría automáticamente en el módulo RMS"""
    tabla = ""
    accion_prefijo = ""

    def perform_create(self, serializer):
        instance = serializer.save()
        registrar_log(
            self.request, 
            accion=f"CREAR_{self.accion_prefijo}", 
            tabla=self.tabla, 
            registro_id=instance.id, 
            valor_nuevo=serializer.data
        )

    def perform_update(self, serializer):
        valor_anterior = self.get_serializer(self.get_object()).data
        instance = serializer.save()
        registrar_log(
            self.request, 
            accion=f"ACTUALIZAR_{self.accion_prefijo}", 
            tabla=self.tabla, 
            registro_id=instance.id, 
            valor_anterior=valor_anterior,
            valor_nuevo=serializer.data
        )

    def perform_destroy(self, instance):
        registro_id = instance.id
        valor_anterior = self.get_serializer(instance).data
        instance.delete()
        registrar_log(
            self.request, 
            accion=f"ELIMINAR_{self.accion_prefijo}", 
            tabla=self.tabla, 
            registro_id=registro_id, 
            valor_anterior=valor_anterior
        )

class AsignacionPuertaViewSet(BaseRMSViewSet):
    queryset = AsignacionPuerta.objects.all()
    serializer_class = AsignacionPuertaSerializer
    tabla = "asignacion_puertas"
    accion_prefijo = "RMS_PUERTA"

    @action(detail=False, methods=['get'], url_path='export/excel')
    def export_excel(self, request):
        response = HttpResponse(content_type='text/csv')
        response.write(u'\ufeff'.encode('utf8')) # BOM para Excel
        response['Content-Disposition'] = 'attachment; filename="puertas_embarque.csv"'

        writer = csv.writer(response)
        writer.writerow(['Código Puerta', 'Cat. Envergadura', 'Estado', 'Vuelo Asignado'])

        queryset = self.get_queryset().select_related('vuelo_diario').order_by('codigo_puerta')
        for item in queryset:
            writer.writerow([
                item.codigo_puerta,
                item.envergadura_maxima_aceptada,
                item.estado,
                item.vuelo_diario.numero_vuelo if item.vuelo_diario else 'N/A'
            ])
        return response

    @action(detail=False, methods=['get'], url_path='export/pdf')
    def export_pdf(self, request):
        buffer = BytesIO()
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="reporte_puertas_embarque.pdf"'

        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        elements = []

        elements.append(Paragraph("<h1>Estado de Puertas de Embarque</h1>", styles['h1']))
        elements.append(Paragraph(f"Fecha: {datetime.now().strftime('%d/%m/%Y %H:%M')}", styles['Normal']))
        elements.append(Spacer(1, 12))

        data = [['Código', 'Categoría', 'Estado', 'Vuelo Actual']]
        queryset = self.get_queryset().select_related('vuelo_diario').order_by('codigo_puerta')
        
        for item in queryset:
            data.append([
                item.codigo_puerta,
                item.envergadura_maxima_aceptada,
                item.estado,
                item.vuelo_diario.numero_vuelo if item.vuelo_diario else 'LIBRE'
            ])

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
        pdf = buffer.getvalue()
        buffer.close()
        response.write(pdf)
        return response

class MostradorCheckinViewSet(BaseRMSViewSet):
    queryset = MostradorCheckin.objects.all()
    serializer_class = MostradorCheckinSerializer
    tabla = "mostradores_checkin"
    accion_prefijo = "RMS_MOSTRADOR"

    @action(detail=False, methods=['get'], url_path='export/excel')
    def export_excel(self, request):
        response = HttpResponse(content_type='text/csv')
        response.write(u'\ufeff'.encode('utf8')) # BOM para Excel
        response['Content-Disposition'] = 'attachment; filename="mostradores_checkin.csv"'

        writer = csv.writer(response)
        writer.writerow(['Número Mostrador', 'Aerolínea', 'Estado', 'Vuelo Asignado', 'Apertura', 'Cierre'])

        queryset = self.get_queryset().select_related('aerolinea_empresa', 'vuelo_diario').order_by('numero_mostrador')
        for item in queryset:
            writer.writerow([
                item.numero_mostrador,
                item.aerolinea_empresa.razon_social if item.aerolinea_empresa else 'Uso General',
                item.estado,
                item.vuelo_diario.numero_vuelo if item.vuelo_diario else 'N/A',
                item.hora_apertura.strftime('%Y-%m-%d %H:%M') if item.hora_apertura else 'N/A',
                item.hora_cierre.strftime('%Y-%m-%d %H:%M') if item.hora_cierre else 'N/A',
            ])
        return response

    @action(detail=False, methods=['get'], url_path='export/pdf')
    def export_pdf(self, request):
        buffer = BytesIO()
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="reporte_mostradores.pdf"'

        doc = SimpleDocTemplate(buffer, pagesize=landscape(letter))
        styles = getSampleStyleSheet()
        elements = []

        elements.append(Paragraph("<h1>Reporte de Mostradores de Check-in</h1>", styles['h1']))
        elements.append(Paragraph(f"Fecha: {datetime.now().strftime('%d/%m/%Y %H:%M')}", styles['Normal']))
        elements.append(Spacer(1, 12))

        data = [['Mostrador', 'Aerolínea', 'Estado', 'Vuelo', 'Apertura', 'Cierre']]
        queryset = self.get_queryset().select_related('aerolinea_empresa', 'vuelo_diario').order_by('numero_mostrador')
        
        for item in queryset:
            data.append([
                item.numero_mostrador,
                (item.aerolinea_empresa.razon_social[:15] + '..') if item.aerolinea_empresa and len(item.aerolinea_empresa.razon_social) > 15 else (item.aerolinea_empresa.razon_social if item.aerolinea_empresa else 'General'),
                item.estado,
                item.vuelo_diario.numero_vuelo if item.vuelo_diario else 'N/A',
                item.hora_apertura.strftime('%H:%M') if item.hora_apertura else '--:--',
                item.hora_cierre.strftime('%H:%M') if item.hora_cierre else '--:--'
            ])

        table = Table(data)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
        ]))
        elements.append(table)

        doc.build(elements)
        pdf = buffer.getvalue()
        buffer.close()
        response.write(pdf)
        return response

class CintaEquipajeViewSet(BaseRMSViewSet):
    queryset = CintaEquipaje.objects.all()
    serializer_class = CintaEquipajeSerializer
    tabla = "cintas_equipaje"
    accion_prefijo = "RMS_CINTA"

    @action(detail=False, methods=['get'], url_path='export/excel')
    def export_excel(self, request):
        response = HttpResponse(content_type='text/csv')
        response.write(u'\ufeff'.encode('utf8')) # BOM para Excel
        response['Content-Disposition'] = 'attachment; filename="cintas_equipaje.csv"'

        writer = csv.writer(response)
        writer.writerow(['Cinta', 'Zona / Ubicación', 'Estado', 'Vuelo Asignado'])

        queryset = self.get_queryset().select_related('vuelo_diario').order_by('codigo_cinta')
        for item in queryset:
            writer.writerow([
                item.codigo_cinta,
                item.ubicacion_zona,
                item.estado,
                item.vuelo_diario.numero_vuelo if item.vuelo_diario else 'N/A'
            ])
        return response

    @action(detail=False, methods=['get'], url_path='export/pdf')
    def export_pdf(self, request):
        buffer = BytesIO()
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="reporte_cintas_equipaje.pdf"'

        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        elements = []

        elements.append(Paragraph("<h1>Estado de Cintas de Equipaje</h1>", styles['h1']))
        elements.append(Paragraph(f"Fecha: {datetime.now().strftime('%d/%m/%Y %H:%M')}", styles['Normal']))
        elements.append(Spacer(1, 12))

        data = [['Cinta', 'Zona / Ubicación', 'Estado', 'Vuelo Actual']]
        queryset = self.get_queryset().select_related('vuelo_diario').order_by('codigo_cinta')
        
        for item in queryset:
            data.append([
                item.codigo_cinta,
                item.ubicacion_zona,
                item.estado,
                item.vuelo_diario.numero_vuelo if item.vuelo_diario else 'LIBRE'
            ])

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
        pdf = buffer.getvalue()
        buffer.close()
        response.write(pdf)
        return response

class PosicionRampaViewSet(BaseRMSViewSet):
    queryset = PosicionRampa.objects.all()
    serializer_class = PosicionRampaSerializer
    tabla = "posiciones_rampa"
    accion_prefijo = "RMS_RAMPA"

    @action(detail=False, methods=['get'], url_path='export/excel')
    def export_excel(self, request):
        response = HttpResponse(content_type='text/csv')
        response.write(u'\ufeff'.encode('utf8')) # BOM para Excel
        response['Content-Disposition'] = 'attachment; filename="posiciones_rampa.csv"'

        writer = csv.writer(response)
        writer.writerow(['ID Posición', 'Estado', 'Vuelo Asignado'])

        queryset = self.get_queryset().select_related('vuelo_diario').order_by('codigo_posicion')
        for item in queryset:
            writer.writerow([
                item.codigo_posicion,
                item.estado,
                item.vuelo_diario.numero_vuelo if item.vuelo_diario else 'Libre'
            ])
        return response

    @action(detail=False, methods=['get'], url_path='export/pdf')
    def export_pdf(self, request):
        buffer = BytesIO()
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="reporte_posiciones_rampa.pdf"'

        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        elements = []

        elements.append(Paragraph("<h1>Mapa de Plataforma: Posiciones de Rampa</h1>", styles['h1']))
        elements.append(Paragraph(f"Fecha de generación: {datetime.now().strftime('%d/%m/%Y %H:%M')}", styles['Normal']))
        elements.append(Spacer(1, 12))

        data = [['ID Posición', 'Estado', 'Vuelo Actual']]
        queryset = self.get_queryset().select_related('vuelo_diario').order_by('codigo_posicion')
        
        for item in queryset:
            data.append([
                item.codigo_posicion,
                item.estado,
                item.vuelo_diario.numero_vuelo if item.vuelo_diario else 'LIBRE'
            ])

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
        pdf = buffer.getvalue()
        buffer.close()
        response.write(pdf)
        return response
