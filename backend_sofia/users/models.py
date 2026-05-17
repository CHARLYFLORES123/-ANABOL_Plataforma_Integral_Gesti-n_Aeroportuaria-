from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings

class Role(models.Model):
    PERMISSION_CHOICES = [
        (0, 'No Access'),
        (1, 'View Only'),
        (2, 'Full Access (Create/Edit)'),
    ]

    role_name = models.CharField(max_length=50, primary_key=True)

    # Módulos específicos del Aeropuerto
    perm_iam = models.IntegerField(choices=PERMISSION_CHOICES, default=0, verbose_name="Seguridad e IAM")
    perm_aodb = models.IntegerField(choices=PERMISSION_CHOICES, default=0, verbose_name="Vuelos (AODB)")
    perm_rms = models.IntegerField(choices=PERMISSION_CHOICES, default=0, verbose_name="Recursos (RMS)")
    perm_fids = models.IntegerField(choices=PERMISSION_CHOICES, default=0, verbose_name="Pantallas (FIDS)")
    perm_admin = models.IntegerField(choices=PERMISSION_CHOICES, default=0, verbose_name="Configuración Global")

    def __str__(self):
        return self.role_name

class User(AbstractUser):
    user_id = models.AutoField(primary_key=True)
    # Relacionamos al usuario con un rol
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    role = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        db_table = 'users' # Cambiado de 'roles' a 'users' para evitar confusión
        verbose_name = 'User'
        verbose_name_plural = 'Users'
    def __str__(self): # Corregido de __str_ a __str__
        return self.username

class UserRole(models.Model):
    user_id = models.ForeignKey(User, on_delete=models.CASCADE)
    role = models.ForeignKey(Role, on_delete=models.CASCADE)
    class Meta:
        db_table= 'user_roles'
        verbose_name= 'User Role'
        verbose_name_plural ='User Roles'
        unique_together = ('user_id', 'role')
    def __str__(self): # Corregido de __str_ a __str__
        return f"{self.user_id.username} - {self.role.role_name}"