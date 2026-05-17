const initialData = {
  findLoading: false,
  saveLoading: false,
  record: null,
  // Aseguramos que 'roles' sea un array desde el inicio
  roles: [], // Nuevo estado para almacenar los roles dinámicos
  loadingRoles: false, // Estado para indicar si los roles están cargando
};

export default (state = initialData, { type, payload }) => {
  if (type === 'USERS_FORM_RESET') {
    return {
      ...initialData,
      roles: state.roles, // Mantenemos los roles actuales al resetear el formulario
    };
  }

  if (type === 'USERS_FORM_FIND_STARTED') {
    return {
      ...state,
      record: null,
      findLoading: true,
    };
  }

  if (type === 'USERS_FORM_FIND_SUCCESS') {
    return {
      ...state,
      record: payload,
      findLoading: false,
    };
  }

  if (type === 'USERS_FORM_FIND_ERROR') {
    return {
      ...state,
      record: null,
      findLoading: false,
    };
  }

  if (type === 'USERS_FORM_CREATE_STARTED') {
    return {
      ...state,
      saveLoading: true,
    };
  }

  if (type === 'USERS_FORM_CREATE_SUCCESS') {
    return  {
      ...state,
      saveLoading: false,
    };
  }

  if (type === 'USERS_FORM_CREATE_ERROR') {
    return {
      ...state,
      saveLoading: false,
    };
  }

  if (type === 'USERS_FORM_UPDATE_STARTED') {
    return {
      ...state,
      saveLoading: true,
    };
  }

  if (type === 'USERS_FORM_UPDATE_SUCCESS') {
    return {
      ...state,
      saveLoading: false,
    };
  }

  if (type === 'USERS_FORM_UPDATE_ERROR') {
    return {
      ...state,
      saveLoading: false,
    };
  }

  // Casos para la carga de roles
  if (type === 'ROLES_FETCH_STARTED') {
    return {
      ...state,
      loadingRoles: true,
      error: null,
    };
  }

  if (type === 'ROLES_FETCH_SUCCESS') {
    console.log("%c REDUCER: Guardando roles en el store ->", "background: #2ecc71; color: #000", payload);
    return {
      ...state,
      loadingRoles: false,
      roles: payload,
    };
  }

  if (type === 'ROLES_FETCH_ERROR') {
    return {
      ...state,
      loadingRoles: false,
      error: payload, // Puedes pasar el error en el payload si lo deseas
    };
  }

  return state;
};
