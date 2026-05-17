import * as yup from 'yup'; // Asegúrate de que 'yup' esté instalado (npm install yup)

const usersFields = {
  id: {
    label: 'ID',
    readOnly: true,
  },
  username: {
    label: 'Nombre de Usuario',
    placeholder: 'Ej. juanperez',
    validation: yup.string().trim().required('El nombre de usuario es requerido'),
  },
  password: {
    label: 'Contraseña',
    placeholder: '********',
    type: 'password',
    validation: yup.string().trim().min(6, 'Mínimo 6 caracteres').required('La contraseña es requerida'),
  },
  email: {
    label: 'Correo Electrónico',
    placeholder: 'Ej. correo@example.com',
    validation: yup.string().trim().email('Formato de correo inválido').required('El correo es requerido'),
  },
  firstName: {
    label: 'Nombre',
    placeholder: 'Ej. Juan',
    validation: yup.string().trim().required('El nombre es requerido'),
  },
  lastName: {
    label: 'Apellidos',
    placeholder: 'Ej. Pérez',
    validation: yup.string().trim().required('El apellido es requerido'),
  },
  phoneNumber: {
    label: 'Número de Teléfono',
    placeholder: 'Ej. +51 987 654 321',
    validation: yup.string().trim().nullable(),
  },
  role: {
    label: 'Rol',
    type: 'radio',
    defaultValue: 'user',
    validation: yup.string().required('El rol es requerido'),
  },
  isStaff: {
    label: '¿Es Staff?',
    type: 'boolean',
    validation: yup.boolean(),
  },
  disabled: {
    label: 'Desactivar Usuario',
    type: 'boolean',
    validation: yup.boolean(),
  },
  avatar: {
    label: 'Avatar',
    type: 'images',
    validation: yup.array().nullable(),
  },
};

export default usersFields;
