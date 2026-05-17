import os
import django
from django.conf import settings

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'proyecto.settings')
django.setup()

from rest_framework.test import APIClient

# Probar el endpoint
client = APIClient()
response = client.get('/api/roles/')
print("Status:", response.status_code)
print("Data:", response.data)