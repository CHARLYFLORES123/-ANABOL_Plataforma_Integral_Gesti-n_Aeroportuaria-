# ANABOL - Sistema de Gestión Aeroportuaria (CRUD AODB / RMS / FIDS)

ANABOL es una plataforma integral diseñada para la gestión de operaciones aeroportuarias. Permite el control centralizado de vuelos, recursos físicos del aeropuerto y sistemas de información al pasajero.

## 🚀 Módulos del Sistema

*   **Seguridad e IAM:** Gestión de usuarios, roles, auditoría de logs y control de sesiones activas.
*   **Vuelos AODB (Airport Operations Database):** Planificación de vuelos de temporada, registro de operaciones diarias, hitos de rampa y manifiestos de carga/pasajeros. Incluye una vista de **Calendario interactivo**.
*   **Recursos RMS (Resource Management System):** Asignación y monitoreo de puertas de embarque, mostradores de check-in, cintas de equipaje y mapa de plataforma.
*   **Pantallas FIDS (Flight Information Display System):** Monitor de salidas en tiempo real, diseñador de plantillas visuales y mensajería dinámica para terminales.
*   **Configuración Global:** Gestión de diccionarios maestros (aerolíneas, aeronaves, aeropuertos), integraciones vía Webhooks y tablas de tasas/monedas.

## 🛠️ Stack Tecnológico

*   **Backend:** Python 3.10+, Django, Django REST Framework (JWT para autenticación).
*   **Frontend:** React.js, Redux (Gestión de estado), Reactstrap (UI), FullCalendar, Axios.
*   **Base de Datos:** PostgreSQL / SQLite.

---

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:
*   [Python 3.10+](https://www.python.org/)
*   [Node.js (v16 o superior)](https://nodejs.org/)
*   [Git](https://git-scm.com/)

---

## 🔧 Instalación y Configuración

### 1. Clonar el proyecto

Abre tu terminal y ejecuta:
```bash
git clone https://github.com/TU_USUARIO/TU_REPOSITORIO.git
cd NOMBRE_DEL_PROYECTO
```

### 2. Configuración del Backend (Django)

1. Navega a la carpeta del backend (donde está el archivo `manage.py`):
   ```bash
   # Ejemplo si la carpeta se llama 'backend'
   cd backend 
   ```
2. Crea y activa un entorno virtual:
   ```bash
   python -m venv venv
   # En Windows:
   venv\Scripts\activate
   # En Mac/Linux:
   source venv/bin/activate
   ```
3. Instalar dependencias:
   ```bash
   pip install -r requirements.txt
   ```
4. Ejecutar migraciones de la base de datos:
   ```bash
   python manage.py migrate
   ```
5. Crear un usuario administrador:
   ```bash
   python manage.py createsuperuser
   ```
6. Iniciar el servidor de desarrollo:
   ```bash
   python manage.py runserver
   ```
   El backend estará disponible en `http://localhost:8000`.

### 3. Configuración del Frontend (React)

1. Navega a la carpeta `frontend_sofia`:
   ```bash
   cd ../frontend_sofia
   ```
2. Instalar las dependencias de Node:
   ```bash
   npm install
   ```
3. Configurar la URL de la API:
   Verifica que en `src/config.js` la constante `hostApi` apunte a `http://localhost` y el puerto sea `8000`.
4. Iniciar la aplicación:
   ```bash
   npm start
   ```
   La aplicación se abrirá automáticamente en `http://localhost:3000`.

---

## 🔑 Acceso al Sistema

1. Inicia sesión con las credenciales del **superuser** que creaste en el paso anterior.
2. Puedes gestionar más usuarios y asignarles roles desde el módulo de **Seguridad e IAM**.

---

## 📝 Notas Adicionales

*   **Exportación de reportes:** El sistema permite generar archivos PDF y Excel desde las tablas de operaciones y registros.
*   **Sincronización FIDS:** El monitor de salidas se refresca automáticamente cada 30 segundos para mostrar cambios en los estados de los vuelos (Demorado, Boarding, etc.).

Desarrollado por [TU NOMBRE] - 2024
<img width="1533" height="778" alt="Captura de pantalla 2026-05-16 004318" src="https://github.com/user-attachments/assets/62240c04-1f43-4f17-929f-ba449d17dfac" />
<img width="1535" height="700" alt="Captura de pantalla 2026-05-16 004630" src="https://github.com/user-attachments/assets/bc2a826b-c3f4-476c-96ec-c7bef4c78d29" />







<img width="1536" height="782" alt="Captura de pantalla 2026-05-16 004701" src="https://github.com/user-attachments/assets/2587b9a9-4d93-4c74-82be-f98366cf2def" />
<img width="1536" height="678" alt="Captura de pantalla 2026-05-16 004729" src="https://github.com/user-attachments/assets/b3b10c0e-09f8-4f68-8ce5-054da6759e76" />
<img width="1535" height="701" alt="Captura de pantalla 2026-05-16 004932" src="https://github.com/user-attachments/assets/ffc1ea1c-5c16-469d-a2e4-7363d0ae43dd" />
<img width="1536" height="697" alt="Captura de pantalla 2026-05-16 005157" src="https://github.com/user-attachments/assets/c32554b0-e0a3-42e0-84a3-f77e76696612" />

<img width="1530" height="770" alt="Captura de pantalla 2026-05-16 005424" src="https://github.com/user-attachments/assets/81dacbe9-e283-4fb5-a8f9-5a3d0655b9e0" />
<img width="1532" height="766" alt="Captura de pantalla 2026-05-16 005521" src="https://github.com/user-attachments/assets/c24eef5d-4d09-4eb5-a2f1-a9c5fd3f350a" />
<img width="1536" height="768" alt="Captura de pantalla 2026-05-16 005551" src="https://github.com/user-attachments/assets/66aac5cd-519c-4351-b03b-6a2a1b3be1d5" />
<img width="1521" height="782" alt="Captura de pantalla 2026-05-16 005258" src="https://github.com/user-attachments/assets/83f7e503-0196-4281-bf1e-855d3c753e0d" />
<img width="1528" height="756" alt="Captura de pantalla 2026-05-16 005613" src="https://github.com/user-attachments/assets/94da53bd-b93c-48e6-b993-13f37074bc87" />
