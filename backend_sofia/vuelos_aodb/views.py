import csv
from datetime import datetime
from io import BytesIO
from django.http import HttpResponse
from rest_framework import viewsets
from rest_framework.decorators import action
from .models import VueloPlanificado, VueloDiario, HitoRampa, ManifiestoPasajeros
from .serializers import (
    VueloPlanificadoSerializer, VueloDiarioSerializer, 
    HitoRampaSerializer, ManifiestoPasajerosSerializer
)
from seguridad_iam.utils import registrar_log

# Para la generación de PDF
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, landscape
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet

class BaseVueloViewSet(viewsets.ModelViewSet):
    """Clase base para manejar logs de auditoría automáticamente"""
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

class VueloPlanificadoViewSet(BaseVueloViewSet):
    queryset = VueloPlanificado.objects.all()
    serializer_class = VueloPlanificadoSerializer
    tabla = "vuelos_planificados"
    accion_prefijo = "VUELO_PLANIFICADO"

    @action(detail=False, methods=['get'], url_path='export/excel')
    def export_excel(self, request):
        response = HttpResponse(content_type='text/csv')
        response.write(u'\ufeff'.encode('utf8'))  # BOM para caracteres especiales en Excel
        response['Content-Disposition'] = 'attachment; filename="planificacion_vuelos.csv"'

        writer = csv.writer(response)
        # Escribir encabezados
        writer.writerow(['Vuelo', 'Aerolínea', 'Origen', 'Destino', 'Salida (Prog)', 'Llegada (Prog)', 'Días', 'Estado'])

        queryset = self.get_queryset().select_related('aerolinea_empresa', 'aeropuerto_origen', 'aeropuerto_destino').order_by('numero_vuelo')
        for item in queryset:
            writer.writerow([
                item.numero_vuelo,
                item.aerolinea_empresa.razon_social if item.aerolinea_empresa else 'N/A',
                item.aeropuerto_origen.codigo_iata if item.aeropuerto_origen else 'N/A',
                item.aeropuerto_destino.codigo_iata if item.aeropuerto_destino else 'N/A',
                item.hora_salida_prog,
                item.hora_llegada_prog,
                item.dias_semana,
                'Activo' if item.activo else 'Inactivo',
            ])
        return response

    @action(detail=False, methods=['get'], url_path='export/pdf')
    def export_pdf(self, request):
        buffer = BytesIO()
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="reporte_planificacion.pdf"'

        # Usamos landscape (horizontal) para que quepan mejor todas las columnas
        doc = SimpleDocTemplate(buffer, pagesize=landscape(letter))
        styles = getSampleStyleSheet()
        elements = []

        # Título del documento
        elements.append(Paragraph("<h1>Reporte de Planificación de Vuelos</h1>", styles['h1']))
        elements.append(Paragraph(f"Fecha de generación: {datetime.now().strftime('%d/%m/%Y %H:%M')}", styles['Normal']))
        elements.append(Spacer(1, 12))

        # Datos de la tabla
        data = [['Vuelo', 'Aerolínea', 'Origen', 'Destino', 'Salida', 'Llegada', 'Días', 'Estado']]
        queryset = self.get_queryset().select_related('aerolinea_empresa', 'aeropuerto_origen', 'aeropuerto_destino').order_by('numero_vuelo')
        
        for item in queryset:
            data.append([
                item.numero_vuelo,
                (item.aerolinea_empresa.razon_social[:20] + '..') if item.aerolinea_empresa and len(item.aerolinea_empresa.razon_social) > 20 else (item.aerolinea_empresa.razon_social if item.aerolinea_empresa else 'N/A'),
                item.aeropuerto_origen.codigo_iata if item.aeropuerto_origen else 'N/A',
                item.aeropuerto_destino.codigo_iata if item.aeropuerto_destino else 'N/A',
                str(item.hora_salida_prog),
                str(item.hora_llegada_prog),
                item.dias_semana,
                'ACTIVO' if item.activo else 'INACTIVO'
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

class VueloDiarioViewSet(BaseVueloViewSet):
    queryset = VueloDiario.objects.all()
    serializer_class = VueloDiarioSerializer
    tabla = "vuelos_diarios"
    accion_prefijo = "OPERACION_DIA"

    @action(detail=False, methods=['get'], url_path='export/excel')
    def export_excel(self, request):
        response = HttpResponse(content_type='text/csv')
        response.write(u'\ufeff'.encode('utf8'))  # BOM para caracteres especiales en Excel
        response['Content-Disposition'] = 'attachment; filename="operaciones_diarias.csv"'

        writer = csv.writer(response)
        # Escribir encabezados
        writer.writerow(['Vuelo', 'Aerolínea', 'Fecha', 'Tipo', 'Origen', 'Destino', 'Estado', 'STD', 'ATD', 'STA', 'ATA'])

        queryset = self.get_queryset().select_related('aerolinea_empresa', 'aeropuerto_origen', 'aeropuerto_destino').order_by('-fecha_operacion', 'std')
        for item in queryset:
            writer.writerow([
                item.numero_vuelo,
                item.aerolinea_empresa.razon_social if item.aerolinea_empresa else 'N/A',
                item.fecha_operacion,
                item.tipo_operacion,
                item.aeropuerto_origen.codigo_iata if item.aeropuerto_origen else 'N/A',
                item.aeropuerto_destino.codigo_iata if item.aeropuerto_destino else 'N/A',
                item.estado,
                item.std.strftime('%H:%M') if item.std else 'N/A',
                item.atd.strftime('%H:%M') if item.atd else 'N/A',
                item.sta.strftime('%H:%M') if item.sta else 'N/A',
                item.ata.strftime('%H:%M') if item.ata else 'N/A',
            ])
        return response

    @action(detail=False, methods=['get'], url_path='export/pdf')
    def export_pdf(self, request):
        buffer = BytesIO()
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="reporte_operaciones.pdf"'

        doc = SimpleDocTemplate(buffer, pagesize=landscape(letter))
        styles = getSampleStyleSheet()
        elements = []

        # Título del documento
        elements.append(Paragraph("<h1>Reporte de Operaciones del Día (AODB Live)</h1>", styles['h1']))
        elements.append(Paragraph(f"Fecha de generación: {datetime.now().strftime('%d/%m/%Y %H:%M')}", styles['Normal']))
        elements.append(Spacer(1, 12))

        # Datos de la tabla
        data = [['Vuelo', 'Aerolínea', 'Fecha', 'Tipo', 'Origen', 'Destino', 'Estado', 'Prog.']]
        queryset = self.get_queryset().select_related('aerolinea_empresa', 'aeropuerto_origen', 'aeropuerto_destino').order_by('-fecha_operacion', 'std')
        
        for item in queryset:
            # Seleccionar hora programada según el tipo de operación
            hora_prog = item.std if item.tipo_operacion == 'SALIDA' else item.sta
            
            data.append([
                item.numero_vuelo,
                (item.aerolinea_empresa.razon_social[:15] + '..') if item.aerolinea_empresa and len(item.aerolinea_empresa.razon_social) > 15 else (item.aerolinea_empresa.razon_social if item.aerolinea_empresa else 'N/A'),
                str(item.fecha_operacion),
                item.tipo_operacion,
                item.aeropuerto_origen.codigo_iata if item.aeropuerto_origen else 'N/A',
                item.aeropuerto_destino.codigo_iata if item.aeropuerto_destino else 'N/A',
                item.estado,
                hora_prog.strftime('%H:%M') if hora_prog else 'N/A'
            ])

        table = Table(data)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
        ]))
        elements.append(table)

        doc.build(elements)
        pdf = buffer.getvalue()
        buffer.close()
        response.write(pdf)
        return response

class HitoRampaViewSet(BaseVueloViewSet):
    queryset = HitoRampa.objects.all()
    serializer_class = HitoRampaSerializer
    tabla = "hitos_rampa"
    accion_prefijo = "HITO_RAMPA"

    @action(detail=False, methods=['get'], url_path='export/excel')
    def export_excel(self, request):
        response = HttpResponse(content_type='text/csv')
        response.write(u'\ufeff'.encode('utf8'))  # BOM para caracteres especiales en Excel
        response['Content-Disposition'] = 'attachment; filename="hitos_rampa.csv"'

        writer = csv.writer(response)
        # Escribir encabezados detallados
        writer.writerow(['Vuelo', 'Operador', 'Catering Inicio', 'Catering Fin', 'Fuel Inicio', 'Fuel Fin', 'Maletas Inicio', 'Maletas Fin', 'Pushback'])

        queryset = self.get_queryset().select_related('vuelo_diario', 'operador_rampa').order_by('-id')
        for item in queryset:
            writer.writerow([
                item.vuelo_diario.numero_vuelo if item.vuelo_diario else 'N/A',
                item.operador_rampa.username if item.operador_rampa else 'N/A',
                item.catering_inicio.strftime('%Y-%m-%d %H:%M') if item.catering_inicio else 'N/A',
                item.catering_fin.strftime('%Y-%m-%d %H:%M') if item.catering_fin else 'N/A',
                item.combustible_inicio.strftime('%Y-%m-%d %H:%M') if item.combustible_inicio else 'N/A',
                item.combustible_fin.strftime('%Y-%m-%d %H:%M') if item.combustible_fin else 'N/A',
                item.maletas_inicio.strftime('%Y-%m-%d %H:%M') if item.maletas_inicio else 'N/A',
                item.maletas_fin.strftime('%Y-%m-%d %H:%M') if item.maletas_fin else 'N/A',
                item.pushback_realizado.strftime('%Y-%m-%d %H:%M') if item.pushback_realizado else 'N/A',
            ])
        return response

    @action(detail=False, methods=['get'], url_path='export/pdf')
    def export_pdf(self, request):
        buffer = BytesIO()
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="reporte_hitos_rampa.pdf"'

        doc = SimpleDocTemplate(buffer, pagesize=landscape(letter))
        styles = getSampleStyleSheet()
        elements = []

        # Título del documento
        elements.append(Paragraph("<h1>Reporte de Hitos de Rampa</h1>", styles['h1']))
        elements.append(Paragraph(f"Fecha de generación: {datetime.now().strftime('%d/%m/%Y %H:%M')}", styles['Normal']))
        elements.append(Spacer(1, 12))

        # Datos de la tabla (resumen de finalización para PDF)
        data = [['Vuelo', 'Operador', 'Catering (F)', 'Fuel (F)', 'Maletas (F)', 'Pushback']]
        queryset = self.get_queryset().select_related('vuelo_diario', 'operador_rampa').order_by('-id')
        
        for item in queryset:
            data.append([
                item.vuelo_diario.numero_vuelo if item.vuelo_diario else 'N/A',
                item.operador_rampa.username if item.operador_rampa else 'N/A',
                item.catering_fin.strftime('%H:%M') if item.catering_fin else '--:--',
                item.combustible_fin.strftime('%H:%M') if item.combustible_fin else '--:--',
                item.maletas_fin.strftime('%H:%M') if item.maletas_fin else '--:--',
                item.pushback_realizado.strftime('%H:%M') if item.pushback_realizado else '--:--'
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

class ManifiestoPasajerosViewSet(BaseVueloViewSet):
    queryset = ManifiestoPasajeros.objects.all()
    serializer_class = ManifiestoPasajerosSerializer
    tabla = "manifiesto_pasajeros"
    accion_prefijo = "MANIFIESTO_PAX"

    @action(detail=False, methods=['get'], url_path='export/excel')
    def export_excel(self, request):
        response = HttpResponse(content_type='text/csv')
        response.write(u'\ufeff'.encode('utf8'))  # BOM para Excel
        response['Content-Disposition'] = 'attachment; filename="manifiesto_pasajeros.csv"'

        writer = csv.writer(response)
        # Encabezados con desglose completo
        writer.writerow(['Vuelo', 'Fecha', 'Total PAX', 'Ejecutivo', 'Turista', 'Conexión', 'Sillas Ruedas', 'Infantes', 'Equipaje (Kg)', 'Carga (Kg)'])

        queryset = self.get_queryset().select_related('vuelo_diario').order_by('-id')
        for item in queryset:
            writer.writerow([
                item.vuelo_diario.numero_vuelo if item.vuelo_diario else 'N/A',
                item.vuelo_diario.fecha_operacion if item.vuelo_diario else 'N/A',
                item.total_pax,
                item.pax_ejecutivo,
                item.pax_turista,
                item.pax_conexion,
                item.pax_silla_ruedas,
                item.infantes_menores,
                item.peso_equipaje_total_kg,
                item.peso_carga_total_kg,
            ])
        return response

    @action(detail=False, methods=['get'], url_path='export/pdf')
    def export_pdf(self, request):
        buffer = BytesIO()
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="reporte_manifiesto.pdf"'

        doc = SimpleDocTemplate(buffer, pagesize=landscape(letter))
        styles = getSampleStyleSheet()
        elements = []

        elements.append(Paragraph("<h1>Reporte de Manifiesto de Pasajeros y Carga</h1>", styles['h1']))
        elements.append(Paragraph(f"Fecha de generación: {datetime.now().strftime('%d/%m/%Y %H:%M')}", styles['Normal']))
        elements.append(Spacer(1, 12))

        # Resumen consolidado para PDF
        data = [['Vuelo', 'Fecha', 'PAX Total', 'Ejec.', 'Tur.', 'Inf.', 'Equip. (Kg)', 'Carga (Kg)']]
        queryset = self.get_queryset().select_related('vuelo_diario').order_by('-id')
        
        for item in queryset:
            data.append([
                item.vuelo_diario.numero_vuelo if item.vuelo_diario else 'N/A',
                str(item.vuelo_diario.fecha_operacion) if item.vuelo_diario else 'N/A',
                item.total_pax,
                item.pax_ejecutivo,
                item.pax_turista,
                item.infantes_menores,
                item.peso_equipaje_total_kg,
                item.peso_carga_total_kg
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
