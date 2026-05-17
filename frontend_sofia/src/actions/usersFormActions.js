import axios from "axios";
import Errors from "../components/FormItems/error/errors";
import { push } from "connected-react-router";
import { doInit } from "./auth";
import { toast } from "react-toastify";
import Swal from 'sweetalert2';
import config from "../config";
import { mockUser } from "./mock";

const actions = {
  doNew: () => {
    return {
      type: 'USERS_FORM_RESET',
    };
  },

  doFind: (id, isProfile) => async (dispatch) => {
    if (!config.isBackend) {
      dispatch({
        type: 'USERS_FORM_FIND_SUCCESS',
        payload: mockUser,
      });
    } else {
      try {
        dispatch({
          type: 'USERS_FORM_FIND_STARTED',
        });

        // Si no hay ID o es explícitamente un perfil, usamos el endpoint 'me'
        const endpoint = (isProfile || !id || id === 'undefined') ? 'auth/me/' : `users/${id}/`;
        axios.get(endpoint).then(res => {
          const record = res.data;

          dispatch({
            type: 'USERS_FORM_FIND_SUCCESS',
            payload: record,
          });
        })
      } catch (error) {
        Errors.handle(error);

        dispatch({
          type: 'USERS_FORM_FIND_ERROR',
        });

        dispatch(push('/template/users'));
      }
    }
  },

  doFetchRoles: () => async (dispatch) => {
    console.log("%c 🔄 INICIANDO doFetchRoles()", "background: #3498db; color: #fff");

    try {
      dispatch({
        type: 'ROLES_FETCH_STARTED',
      });

      console.log("%c 📡 HACIENDO PETICIÓN A: roles/", "background: #e67e22; color: #fff");
      console.log("%c Base URL configurada:", "background: #f39c12; color: #fff", config.baseURLApi);
      console.log("%c Token actual:", "background: #f39c12; color: #fff", localStorage.getItem('token'));
      console.log("%c URL completa que se va a llamar:", "background: #f39c12; color: #fff", `${config.baseURLApi}roles/`);

      // Usamos URL absoluta para evitar problemas con baseURL en algunos entornos
      const response = await axios.get(`${config.baseURLApi}roles/`);

      console.group("%c ✅ API ROLES DEBUG ", "background: #27ae60; color: #fff");
      console.log("Status:", response.status);
      console.log("Respuesta completa:", response);
      console.log("Datos:", response.data);

      // Django por defecto devuelve un array directamente
      let data = Array.isArray(response.data) ? response.data : [];

      if (!data || data.length === 0) {
        console.warn("⚠️ La API respondió con éxito pero la lista de roles está VACÍA en la BD.");
      } else {
        console.log("✅ Roles encontrados:", data.length);
      }

      // Mapear roles con la estructura correcta
      const roles = data.map(role => {
        const roleName = role.role_name || role.id || String(role);
        // Capitalizar correctamente: "admin" -> "Admin"
        const capitalizedLabel = roleName.charAt(0).toUpperCase() + roleName.slice(1).toLowerCase();
        
        return {
          value: roleName,
          label: capitalizedLabel,
        };
      });

      console.log("📋 Roles procesados para el Select:", roles);
      console.groupEnd();

      dispatch({
        type: 'ROLES_FETCH_SUCCESS',
        payload: roles,
      });

      console.log("%c ✅ ROLES CARGADOS EXITOSAMENTE", "background: #27ae60; color: #fff");

    } catch (error) {
      console.error("%c ❌ ERROR CRÍTICO al cargar roles:", "background: #e74c3c; color: #fff", error);
      console.error("Detalles del error:", error.response);
      console.error("Configuración de axios:", axios.defaults);

      if (error.response) {
        console.error("Status:", error.response.status);
        console.error("Data:", error.response.data);
        console.error("Headers:", error.response.headers);
      } else if (error.request) {
        console.error("No se recibió respuesta del servidor:", error.request);
      } else {
        console.error("Error al configurar la petición:", error.message);
      }
    }
  },

  doCreate: (values) => async (dispatch) => {
    try {
      dispatch({
        type: 'USERS_FORM_CREATE_STARTED',
      });

      // Convertir a FormData para manejar correctamente el Avatar y campos booleanos
      const formData = new FormData();
      
      // Campos que manejaremos de forma especial
      const handledKeys = ['avatar', 'disabled', 'role', 'is_active'];

      for (const key in values) {
        const value = values[key];
        // Añadimos campos normales (no vacíos)
        if (value !== null && value !== undefined && value !== "" && !handledKeys.includes(key)) {
          formData.append(key, value);
        }
      }

      // 1. Manejar Avatar (solo si es un archivo nuevo seleccionado)
      if (Array.isArray(values.avatar) && values.avatar.length > 0) {
        const fileItem = values.avatar[0] instanceof File ? values.avatar[0] : values.avatar[0].file;
        if (fileItem instanceof File) {
          formData.append('avatar', fileItem);
        }
      }

      // 2. Mapear 'disabled' (UI) a 'is_active' (Backend)
      formData.append('is_active', values.disabled ? 'false' : 'true');

      // 3. Manejar Role (Enviamos el nombre del rol para el SlugRelatedField)
      if (values.role && values.role !== "") {
        formData.append('role', values.role);
      }

      await axios.post('users/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      dispatch({
        type: 'USERS_FORM_CREATE_SUCCESS',
      });

      Swal.fire({
        title: '¡Usuario Creado!',
        text: 'Los datos se han guardado correctamente.',
        icon: 'success',
        confirmButtonColor: '#4d53e0',
        timer: 3000,
        timerProgressBar: true,
      });

      dispatch(push('/template/users'));
      
    } catch (error) {
      Errors.handle(error);

      dispatch({
        type: 'USERS_FORM_CREATE_ERROR',
      });
    }
  },

  doUpdate: (id, values, isProfile) => async (dispatch, getState) => {
    try {
      dispatch({
        type: 'USERS_FORM_UPDATE_STARTED',
      });

      const formData = new FormData();
      const handledKeys = ['avatar', 'disabled', 'role', 'is_active'];

      for (const key in values) {
        const value = values[key];
        if (value !== null && value !== undefined && value !== "" && !handledKeys.includes(key)) {
          formData.append(key, value);
        }
      }

      // 1. Manejar Avatar - Solo si es un archivo NUEVO seleccionado
      if (Array.isArray(values.avatar) && values.avatar.length > 0) {
        const fileItem = values.avatar[0];
        // Verificar si es un archivo nuevo (no una URL existente)
        if (fileItem instanceof File) {
          formData.append('avatar', fileItem);
        } else if (fileItem && fileItem.file && fileItem.file instanceof File) {
          // Para el caso donde viene envuelto en un objeto
          formData.append('avatar', fileItem.file);
        }
        // Si no es un archivo, no enviamos el campo avatar (mantener el existente)
      }

      // 2. Estado de cuenta
      if (values.disabled !== undefined) {
        formData.append('is_active', values.disabled ? 'false' : 'true');
      }

      // 3. Rol
      if (values.role && values.role !== "") {
        formData.append('role', values.role);
      }

      if (isProfile) {
        // Para ProfileView, enviamos los datos directamente en el cuerpo de la petición
        await axios.put('auth/me/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        // Para UserViewSet, enviamos los datos directamente en el cuerpo de la petición
        await axios.patch(`users/${id}/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      }

      dispatch(doInit());

      dispatch({
        type: 'USERS_FORM_UPDATE_SUCCESS',
      });

      if (isProfile) {
        toast.success('Profile updated');
      } else {
        Swal.fire({
          title: '¡Usuario Actualizado!',
          text: 'Los datos se han guardado correctamente.',
          icon: 'success',
          confirmButtonColor: '#4d53e0',
          timer: 3000,
          timerProgressBar: true,
        });
        dispatch(push('/template/users'));
      }
    } catch (error) {
      Errors.handle(error);

      dispatch({
        type: 'USERS_FORM_UPDATE_ERROR',
      });
    }
  },

  doUpdatePassword: (newPassword, currentPassword) => async (dispatch) => {
    try {
      dispatch({
        type: 'USERS_FORM_CREATE_STARTED',
      });
      await axios.put('auth/password-update/', {newPassword, currentPassword})
      dispatch({
        type: 'USERS_PASSWORD_UPDATE_SUCCESS',
      });

      toast.success('Password has been updated');
      dispatch(push('/template/users'));

    } catch (error) {
      Errors.handle(error);

      dispatch({
        type: 'USERS_FORM_CREATE_ERROR',
      });
    }
  },

  doChangePassword: (values) => async (dispatch) => {
    const { currentPassword, newPassword, confirmNewPassword } = values;
    
    // Validar que las nuevas contraseñas coincidan
    if (newPassword !== confirmNewPassword) {
      Errors.showMessage('Las nuevas contraseñas no coinciden');
      return;
    }

    // Validar que no esté vacía
    if (!currentPassword || !newPassword) {
      Errors.showMessage('Todos los campos son requeridos');
      return;
    }

    try {
      dispatch({
        type: 'USERS_FORM_CREATE_STARTED',
      });

      await axios.put('auth/password-update/', {newPassword, currentPassword});

      dispatch({
        type: 'USERS_PASSWORD_UPDATE_SUCCESS',
      });

      Swal.fire({
        title: '¡Contraseña Actualizada!',
        text: 'Tu contraseña ha sido cambiada correctamente.',
        icon: 'success',
        confirmButtonColor: '#4d53e0',
        timer: 3000,
        timerProgressBar: true,
      });

      dispatch(push('/template/user/profile'));

    } catch (error) {
      Errors.handle(error);

      dispatch({
        type: 'USERS_FORM_CREATE_ERROR',
      });
    }
  },
};

export default actions;
