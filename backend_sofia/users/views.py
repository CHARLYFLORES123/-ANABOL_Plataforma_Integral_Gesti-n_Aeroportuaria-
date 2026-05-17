import os
import csv
from io import BytesIO # Para manejar archivos en memoria
from django.conf import settings
from django.shortcuts import render, redirect # Mantener para las vistas de login/logout
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .forms import LoginForm
from .models import UserRole, Role, User
from rest_framework.views import APIView
from rest_framework import viewsets, serializers, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated # Mantener para las vistas de API
from rest_framework.parsers import MultiPartParser, FormParser
from django.core.files.storage import default_storage
from django.http import HttpResponse # Importar HttpResponse para descargas de archivos

# Para la generación de PDF
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph
from reportlab.lib.styles import getSampleStyleSheet

# Nuevo: Serializador para el modelo Role
class RoleSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source='role_name', read_only=True)

    class Meta:
        model = Role
        fields = ['id', 'role_name', 'perm_iam', 'perm_aodb', 'perm_rms', 'perm_fids', 'perm_admin']

# Nuevo: ViewSet para el modelo Role
class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = []  # Temporalmente sin autenticación para debugging
    pagination_class = None # Para obtener todos los roles sin paginación

class FileUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, folder):
        file_obj = request.FILES.get('file') or next(iter(request.FILES.values()), None)
        if not file_obj:
            return Response({"error": "No file uploaded"}, status=400)
            
        path = default_storage.save(os.path.join(folder, file_obj.name), file_obj)
        url = request.build_absolute_uri(settings.MEDIA_URL + path)
        
        # Devolvemos un objeto para que el componente de React pueda previsualizar la imagen
        return Response([{"publicUrl": url, "name": file_obj.name}])

# Serializador básico para el CRUD de usuarios
class UserSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source='user_id', read_only=True)
    firstName = serializers.CharField(source='first_name', required=False, allow_blank=True)
    lastName = serializers.CharField(source='last_name', required=False, allow_blank=True)
    phoneNumber = serializers.CharField(source='phone_number', required=False, allow_blank=True)
    isStaff = serializers.BooleanField(source='is_staff', required=False)
    role = serializers.SlugRelatedField(slug_field='role_name', queryset=Role.objects.all(), required=False, allow_null=True)
    disabled = serializers.SerializerMethodField()
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'firstName', 'lastName', 'phoneNumber', 'avatar', 'role', 'isStaff', 'disabled', 'is_active', 'password']

    def get_disabled(self, obj):
        return not obj.is_active

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        # Transformamos el avatar en el formato de objeto que espera el frontend para previsualizar
        if instance.avatar:
            request = self.context.get('request')
            url = instance.avatar.url
            if request:
                url = request.build_absolute_uri(url)
            ret['avatar'] = [{"publicUrl": url, "url": url, "name": os.path.basename(instance.avatar.name), "id": instance.pk}]
        else:
            ret['avatar'] = []
        return ret

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None  # Esto asegura que devuelva un arreglo [{}, {}] directamente (para la lista)

    def create(self, request, *args, **kwargs):
        # Vista para agregar un usuario (Lógica personalizada para password)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        password = request.data.get('password')
        user = serializer.save()
        if password:
            user.set_password(password)
            user.save()
            
        return Response(serializer.data, status=status.HTTP_201_CREATED)

# Nueva: Vista para exportar usuarios a Excel (formato CSV)
class UserExportExcelView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        response = HttpResponse(content_type='text/csv')
        # Forzamos que el navegador lo trate como un archivo descargable
        response['Content-Disposition'] = 'attachment; filename="users.csv"'

        writer = csv.writer(response)
        # Escribir encabezados
        writer.writerow(['ID', 'Username', 'Email', 'First Name', 'Last Name', 'Phone Number', 'Role', 'Is Staff', 'Is Active'])

        # Obtener todos los usuarios
        users = User.objects.all().order_by('username')
        for user in users:
            role_name = user.role.role_name if user.role else 'N/A'
            writer.writerow([
                user.user_id,
                user.username,
                user.email,
                user.first_name or '',
                user.last_name or '',
                user.phone_number or 'N/A', # Manejar None para phone_number
                role_name,
                'Sí' if user.is_staff else 'No',
                'Activo' if user.is_active else 'Inactivo',
            ])
        return response

# Nueva: Vista para exportar usuarios a PDF
class UserExportPDFView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        buffer = BytesIO()
        # Cambiamos a un nombre de archivo más descriptivo
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="reporte_usuarios.pdf"'

        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        elements = []

        # Título del documento
        elements.append(Paragraph("<h1>Lista de Usuarios</h1>", styles['h1']))
        elements.append(Paragraph("<br/>", styles['Normal'])) # Espacio

        # Datos de la tabla
        data = [
            ['ID', 'Usuario', 'Email', 'Nombre', 'Apellido', 'Teléfono', 'Rol', 'Staff', 'Activo']
        ]
        users = User.objects.all().order_by('username')
        for user in users:
            role_name = user.role.role_name if user.role else 'N/A'
            data.append([
                str(user.user_id), # Convertir a string para la tabla PDF
                user.username, user.email, user.first_name, user.last_name,
                user.phone_number or 'N/A', role_name,
                'Sí' if user.is_staff else 'No', 'Sí' if user.is_active else 'No',
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

class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        avatar_data = []
        if user.avatar:
            try:
                url = request.build_absolute_uri(user.avatar.url)
                avatar_data = [{"url": url, "name": os.path.basename(user.avatar.name)}]
            except ValueError:
                pass

        # Devolvemos la estructura que espera el frontend
        return Response({
            "id": user.user_id,
            "username": user.username,
            "email": user.email,
            "role": user.role.role_name if user.role else None,
            "firstName": user.first_name,
            "lastName": user.last_name,
            "phoneNumber": user.phone_number,
            "isStaff": user.is_staff,
            "avatar": avatar_data,
        })

    def put(self, request):
        user = request.user
        data = request.data
        files = request.FILES # Para manejar la subida de archivos
        
        user.first_name = data.get('firstName', user.first_name)
        user.last_name = data.get('lastName', user.last_name)
        user.email = data.get('email', user.email)
        user.phone_number = data.get('phoneNumber', user.phone_number)
        if 'avatar' in files: # Si se envió un nuevo avatar
            user.avatar = files['avatar']
        user.save()

        return Response({
            "id": user.user_id,
            "username": user.username,
            "email": user.email,
            "role": user.role.role_name if user.role else None,
            "firstName": user.first_name,
            "lastName": user.last_name,
            "phoneNumber": user.phone_number,
            "avatar": (
                [{"url": request.build_absolute_uri(user.avatar.url), "name": os.path.basename(user.avatar.name)}]
                if user.avatar and user.avatar.name
                else []
            ),
        })

class PasswordUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request):
        user = request.user
        current_password = request.data.get('currentPassword')
        new_password = request.data.get('newPassword')

        # Validar que la contraseña actual sea correcta
        if not user.check_password(current_password):
            return Response(
                {"error": "Contraseña actual incorrecta"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validar que la nueva contraseña no esté vacía
        if not new_password or len(new_password) < 8:
            return Response(
                {"error": "La nueva contraseña debe tener al menos 8 caracteres"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Cambiar la contraseña
        user.set_password(new_password)
        user.save()

        return Response({
            "success": True,
            "message": "Contraseña actualizada correctamente"
        })

# Nueva: Vista para exportar roles a Excel (formato CSV)
class RoleExportExcelView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="roles_registrados.csv"'

        writer = csv.writer(response)
        # Escribir encabezados
        writer.writerow(['ID', 'Nombre Rol', 'SEGURIDAD E IAM', 'VUELOS AODB', 'RECURSOS RMS', 'PANTALLAS FIDS', 'PERMISOS ADMIN'])

        # Obtener todos los roles
        roles = Role.objects.all().order_by('role_name')
        for role in roles:
            def get_permission_text(value):
                if value == 0:
                    return 'Sin acceso'
                elif value == 1:
                    return 'Solo ver'
                elif value == 2:
                    return 'Total'
                return str(value)

            writer.writerow([
                role.pk,
                role.role_name,
                get_permission_text(role.perm_iam),
                get_permission_text(role.perm_aodb),
                get_permission_text(role.perm_rms),
                get_permission_text(role.perm_fids),
                get_permission_text(role.perm_admin),
            ])
        return response

# Nueva: Vista para exportar roles a PDF
class RoleExportPDFView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        buffer = BytesIO()
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="reporte_roles.pdf"'

        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        elements = []

        # Título del documento
        title = Paragraph("Reporte de Roles y Permisos", styles['Title'])
        elements.append(title)
        elements.append(Spacer(1, 12))

        # Fecha de generación
        fecha = Paragraph(f"Fecha de generación: {datetime.now().strftime('%d/%m/%Y %H:%M')}", styles['Normal'])
        elements.append(fecha)
        elements.append(Spacer(1, 12))

        # Crear tabla de datos
        data = [['ID', 'Nombre Rol', 'SEGURIDAD E IAM', 'VUELOS AODB', 'RECURSOS RMS', 'PANTALLAS FIDS', 'PERMISOS ADMIN']]

        roles = Role.objects.all().order_by('role_name')
        for role in roles:
            def get_permission_text(value):
                if value == 0:
                    return 'Sin acceso'
                elif value == 1:
                    return 'Solo ver'
                elif value == 2:
                    return 'Total'
                return str(value)

            data.append([
                str(role.pk),
                role.role_name,
                get_permission_text(role.perm_iam),
                get_permission_text(role.perm_aodb),
                get_permission_text(role.perm_rms),
                get_permission_text(role.perm_fids),
                get_permission_text(role.perm_admin),
            ])

        # Crear tabla
        table = Table(data)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
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

def login_view(request):
    if request.user.is_authenticated: # Added colon
        return redirect('dashboard') # Corrected indentation and closing quote
    if request.method == 'POST': # Corrected indentation
        form = LoginForm(request, data=request.POST) # Corrected indentation
        if form.is_valid(): # Corrected indentation
            username = form.cleaned_data.get('username') # Corrected indentation and closing quote
            password = form.cleaned_data.get('password') # Corrected indentation
            user = authenticate(username=username, password=password) # Corrected assignment operator and spacing
            if user is not None: # Corrected indentation
                login(request, user) # Corrected indentation
                return redirect("dashboard") # Corrected indentation
            else: # Corrected indentation
                messages.error(request, 'Invalid username or password.') # Corrected indentation
        # No explicit else needed here for form.is_valid() if you want to re-render form with errors
    else: # Corrected indentation, this else belongs to request.method == 'POST'
        form = LoginForm() # Corrected indentation
    return render(request, 'users/login.html', {'form': form}) # Corrected dictionary literal and spacing
@login_required
def logout_view(request):
    logout(request)
    messages.success(request, 'You have successfully logged out.') # Corrected spacing
    return redirect('login') # Corrected spacing