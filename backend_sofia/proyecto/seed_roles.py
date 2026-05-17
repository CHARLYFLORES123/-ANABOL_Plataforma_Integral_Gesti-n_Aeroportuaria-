from django.core.management.base import BaseCommand
from users.models import Role

class Command(BaseCommand):
    help = 'Crea los roles iniciales para el sistema SOFIA'

    def handle(self, *args, **kwargs):
        roles_data = [
            {
                'role_name': 'Administrator',
                'perm_iam': 2, 'perm_aodb': 2, 'perm_rms': 2, 'perm_fids': 2, 'perm_admin': 2
            },
            {
                'role_name': 'Operations Manager',
                'perm_iam': 1, 'perm_aodb': 2, 'perm_rms': 2, 'perm_fids': 2, 'perm_admin': 0
            },
            {
                'role_name': 'FIDS Operator',
                'perm_iam': 0, 'perm_aodb': 1, 'perm_rms': 0, 'perm_fids': 2, 'perm_admin': 0
            },
        ]

        for data in roles_data:
            role, created = Role.objects.update_or_create(
                role_name=data['role_name'],
                defaults=data
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Rol creado: {role.role_name}'))
            else:
                self.stdout.write(f'Rol actualizado: {role.role_name}')