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

from .models import FidsZona, FidsPlantilla, FidsDispositivo, FidsAlertaEmergencia
from .serializers import (
    FidsZonaSerializer, FidsPlantillaSerializer,
    FidsDispositivoSerializer, FidsAlertaEmergenciaSerializer
)
from seguridad_iam.utils import registrar_log

class BaseFidsViewSet(viewsets.ModelViewSet):
    """Clase base para manejar logs de auditoría en el módulo FIDS"""
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

class FidsZonaViewSet(BaseFidsViewSet):
    queryset = FidsZona.objects.all()
    serializer_class = FidsZonaSerializer
    tabla = "fids_zonas"
    accion_prefijo = "FIDS_ZONA"

    @action(detail=False, methods=['get'], url_path='export/excel')
    def export_excel(self, request):
        response = HttpResponse(content_type='text/csv')
        response.write(u'\ufeff'.encode('utf8')) # BOM para Excel
        response['Content-Disposition'] = 'attachment; filename="zonas_fids.csv"'

        writer = csv.writer(response)
        writer.writerow(['Nombre de la Zona', 'Tipo Filtro Vuelo', 'Descripción'])

        queryset = self.get_queryset().order_by('nombre_zona')
        for item in queryset:
            writer.writerow([
                item.nombre_zona,
                item.tipo_filtro_vuelo,
                item.descripcion if item.descripcion else 'Sin descripción'
            ])
        return response

    @action(detail=False, methods=['get'], url_path='export/pdf')
    def export_pdf(self, request):
        buffer = BytesIO()
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="reporte_zonas_fids.pdf"'

        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        elements = []

        elements.append(Paragraph("<h1>Reporte de Agrupamiento de Zonas FIDS</h1>", styles['h1']))
        elements.append(Paragraph(f"Fecha de generación: {datetime.now().strftime('%d/%m/%Y %H:%M')}", styles['Normal']))
        elements.append(Spacer(1, 12))

        data = [['Nombre de la Zona', 'Tipo Filtro', 'Descripción']]
        queryset = self.get_queryset().order_by('nombre_zona')
        
        for item in queryset:
            data.append([
                item.nombre_zona,
                item.tipo_filtro_vuelo,
                (item.descripcion[:40] + '..') if item.descripcion and len(item.descripcion) > 40 else (item.descripcion if item.descripcion else 'N/A')
            ])

        table = Table(data, colWidths=[150, 100, 250])
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

class FidsPlantillaViewSet(BaseFidsViewSet):
    queryset = FidsPlantilla.objects.all()
    serializer_class = FidsPlantillaSerializer
    tabla = "fids_plantillas"
    accion_prefijo = "FIDS_PLANTILLA"

    @action(detail=False, methods=['get'], url_path='export/excel')
    def export_excel(self, request):
        response = HttpResponse(content_type='text/csv')
        response.write(u'\ufeff'.encode('utf8')) # BOM para Excel
        response['Content-Disposition'] = 'attachment; filename="plantillas_fids.csv"'

        writer = csv.writer(response)
        writer.writerow(['Nombre Plantilla', 'Esquema Colores', 'Fuente', 'Idiomas', 'Columnas Visibles'])

        queryset = self.get_queryset().order_by('nombre_plantilla')
        for item in queryset:
            writer.writerow([
                item.nombre_plantilla,
                item.esquema_colores,
                item.fuente_texto,
                item.idiomas_visualizacion,
                item.columnas_visibles
            ])
        return response

    @action(detail=False, methods=['get'], url_path='export/pdf')
    def export_pdf(self, request):
        buffer = BytesIO()
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="reporte_plantillas_fids.pdf"'

        doc = SimpleDocTemplate(buffer, pagesize=landscape(letter))
        styles = getSampleStyleSheet()
        elements = []

        elements.append(Paragraph("<h1>Catálogo de Plantillas FIDS</h1>", styles['h1']))
        elements.append(Paragraph(f"Fecha de generación: {datetime.now().strftime('%d/%m/%Y %H:%M')}", styles['Normal']))
        elements.append(Spacer(1, 12))

        data = [['Nombre Plantilla', 'Esquema', 'Fuente', 'Idiomas']]
        queryset = self.get_queryset().order_by('nombre_plantilla')
        
        for item in queryset:
            data.append([
                item.nombre_plantilla,
                item.esquema_colores,
                item.fuente_texto,
                item.idiomas_visualizacion
            ])

        table = Table(data)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
        ]))
        elements.append(table)

        doc.build(elements)
        pdf = buffer.getvalue()
        buffer.close()
        response.write(pdf)
        return response

class FidsDispositivoViewSet(BaseFidsViewSet):
    queryset = FidsDispositivo.objects.all()
    serializer_class = FidsDispositivoSerializer
    tabla = "fids_dispositivos"
    accion_prefijo = "FIDS_DISP"

    @action(detail=False, methods=['get'], url_path='export/excel')
    def export_excel(self, request):
        response = HttpResponse(content_type='text/csv')
        response.write(u'\ufeff'.encode('utf8')) # BOM para Excel
        response['Content-Disposition'] = 'attachment; filename="dispositivos_fids.csv"'

        writer = csv.writer(response)
        writer.writerow(['Código Pantalla', 'Dirección IP', 'Zona FIDS', 'Estado Conexión', 'Plantilla Asignada'])

        queryset = self.get_queryset().select_related('zona_fids', 'plantilla').order_by('codigo_pantalla')
        for item in queryset:
            writer.writerow([
                item.codigo_pantalla,
                item.direccion_ip,
                item.zona_fids.nombre_zona if item.zona_fids else 'N/A',
                item.estado_conexion,
                item.plantilla.nombre_plantilla if item.plantilla else 'N/A'
            ])
        return response

    @action(detail=False, methods=['get'], url_path='export/pdf')
    def export_pdf(self, request):
        buffer = BytesIO()
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="reporte_dispositivos_fids.pdf"'

        doc = SimpleDocTemplate(buffer, pagesize=landscape(letter)) # Usamos landscape por las columnas
        styles = getSampleStyleSheet()
        elements = []

        elements.append(Paragraph("<h1>Reporte de Dispositivos FIDS</h1>", styles['h1']))
        elements.append(Paragraph(f"Fecha de generación: {datetime.now().strftime('%d/%m/%Y %H:%M')}", styles['Normal']))
        elements.append(Spacer(1, 12))

        data = [['Código', 'IP', 'Zona FIDS', 'Estado', 'Plantilla']]
        queryset = self.get_queryset().select_related('zona_fids', 'plantilla').order_by('codigo_pantalla')
        
        for item in queryset:
            data.append([
                item.codigo_pantalla,
                item.direccion_ip,
                (item.zona_fids.nombre_zona[:20] + '..') if item.zona_fids and len(item.zona_fids.nombre_zona) > 20 else (item.zona_fids.nombre_zona if item.zona_fids else 'N/A'),
                item.estado_conexion,
                (item.plantilla.nombre_plantilla[:20] + '..') if item.plantilla and len(item.plantilla.nombre_plantilla) > 20 else (item.plantilla.nombre_plantilla if item.plantilla else 'N/A')
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

class FidsAlertaEmergenciaViewSet(BaseFidsViewSet):
    queryset = FidsAlertaEmergencia.objects.all()
    serializer_class = FidsAlertaEmergenciaSerializer
    tabla = "fids_alertas_emergencia"
    accion_prefijo = "FIDS_ALERTA"

    @action(detail=False, methods=['get'], url_path='export/excel')
    def export_excel(self, request):
        response = HttpResponse(content_type='text/csv')
        response.write(u'\ufeff'.encode('utf8')) # BOM para Excel
        response['Content-Disposition'] = 'attachment; filename="mensajes_fids.csv"'

        writer = csv.writer(response)
        writer.writerow(['Mensaje', 'Gravedad', 'Pantalla Destino', 'Emisor', 'Expira', 'Estado'])

        queryset = self.get_queryset().select_related('pantalla_destino', 'usuario_emisor').order_by('-id')
        for item in queryset:
            writer.writerow([
                item.mensaje_alerta,
                item.tipo_gravedad,
                item.pantalla_destino.codigo_pantalla if item.pantalla_destino else 'General',
                item.usuario_emisor.username if item.usuario_emisor else 'Sistema',
                item.expira_at.strftime('%Y-%m-%d %H:%M') if item.expira_at else 'N/A',
                'Activo' if item.activo else 'Inactivo'
            ])
        return response

    @action(detail=False, methods=['get'], url_path='export/pdf')
    def export_pdf(self, request):
        buffer = BytesIO()
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="reporte_mensajes_fids.pdf"'

        doc = SimpleDocTemplate(buffer, pagesize=landscape(letter))
        styles = getSampleStyleSheet()
        elements = []

        elements.append(Paragraph("<h1>Reporte de Mensajería Dinámica FIDS</h1>", styles['h1']))
        elements.append(Paragraph(f"Fecha de generación: {datetime.now().strftime('%d/%m/%Y %H:%M')}", styles['Normal']))
        elements.append(Spacer(1, 12))

        data = [['Mensaje', 'Gravedad', 'Destino', 'Emisor', 'Expira']]
        queryset = self.get_queryset().select_related('pantalla_destino', 'usuario_emisor').order_by('-id')
        
        for item in queryset:
            data.append([
                (item.mensaje_alerta[:40] + '..') if len(item.mensaje_alerta) > 40 else item.mensaje_alerta,
                item.tipo_gravedad,
                item.pantalla_destino.codigo_pantalla if item.pantalla_destino else 'General',
                item.usuario_emisor.username if item.usuario_emisor else 'Sistema',
                item.expira_at.strftime('%d/%m %H:%M') if item.expira_at else 'N/A'
            ])

        table = Table(data, colWidths=[240, 80, 100, 100, 100])
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
