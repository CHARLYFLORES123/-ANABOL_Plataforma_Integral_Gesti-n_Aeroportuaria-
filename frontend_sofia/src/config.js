const hostApi = process.env.NODE_ENV === "development"
  ? "http://localhost"
  : "https://sing-generator-node.herokuapp.com";

const portApi = process.env.NODE_ENV === "development"
  ? 8000 // Django por defecto usa el puerto 8000
  : "";

// Eliminamos la barra final para evitar dobles slashes en peticiones compuestas
const baseURLApi = `${hostApi}${portApi ? `:${portApi}` : ``}/api/`;
const redirectUrl = process.env.NODE_ENV === "development"
  ? "http://localhost:3000/sofia-react"
  : "https://demo.flatlogic.com/sofia-react";


export default {
  redirectUrl,
  hostApi,
  portApi: portApi,
  baseURLApi,
  remote: "https://sing-generator-node.herokuapp.com",
  isBackend: true, // Forzamos a true para que use el backend de Django
  auth: {
    email: 'admin@flatlogic.com',
    password: 'password'
  },
};
