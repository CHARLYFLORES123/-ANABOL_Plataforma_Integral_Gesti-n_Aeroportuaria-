from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import UserRole, Role

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Lógica de agregación de permisos
        permissions = {
            'perm_iam': 0,
            'perm_aodb': 0,
            'perm_rms': 0,
            'perm_fids': 0,
            'perm_admin': 0,
        }
        roles_list = []

        # 1. Obtener rol directo del modelo User (si existe)
        if user.role:
            roles_list.append(user.role.role_name)
            for key in permissions.keys():
                val = getattr(user.role, key, 0)
                if val > permissions[key]:
                    permissions[key] = val

        # 2. Obtener roles adicionales de la tabla intermedia UserRole
        user_roles = UserRole.objects.filter(user_id=user).select_related('role')
        for ur in user_roles:
            role = ur.role
            if role.role_name not in roles_list:
                roles_list.append(role.role_name)
            
            # Recorremos las claves del diccionario de permisos
            for key in permissions.keys():
                # Obtenemos el valor numérico del permiso en el objeto Role
                val = getattr(role, key, 0)
                if val > permissions[key]:
                    permissions[key] = val

        # Añadir la información al token (claims personalizados)
        token['username'] = user.username
        token['roles'] = roles_list
        token['permissions'] = permissions

        return token
