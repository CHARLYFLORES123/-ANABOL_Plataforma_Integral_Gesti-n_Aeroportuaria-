from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Role, UserRole

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    # Añadimos 'role' al listado para verlo rápidamente
    list_display = ('username', 'email', 'first_name', 'last_name', 'phone_number', 'role', 'is_staff', 'is_active')
    list_filter = ('is_staff', 'is_active', 'date_joined')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    
    # Esto permite editar el campo 'role' dentro del formulario del usuario en el admin
    fieldsets = UserAdmin.fieldsets + (
        ('Información de Perfil', {'fields': ('phone_number', 'avatar', 'role',)}),
    )

@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    # Ajustado a los campos reales del modelo Role (perm_iam, perm_aodb, etc.)
    list_display = ('role_name', 'perm_iam', 'perm_aodb', 'perm_rms', 'perm_fids', 'perm_admin')
    list_filter = ('perm_iam', 'perm_aodb', 'perm_rms', 'perm_fids', 'perm_admin')
    search_fields = ('role_name',)


@admin.register(UserRole)
class UserRoleAdmin(admin.ModelAdmin):
    list_display = ('user_id', 'role')
    list_filter = ('role',)
    # Usamos doble guion bajo (__) para buscar en campos de modelos relacionados
    search_fields = ('user_id__username', 'role__role_name')