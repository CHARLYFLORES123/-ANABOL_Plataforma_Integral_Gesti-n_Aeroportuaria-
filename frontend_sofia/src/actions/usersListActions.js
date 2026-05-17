import axios from "axios";
import Errors from "../components/FormItems/error/errors";

const actions = {
  doFetch: () => async (dispatch) => {
    try {
      dispatch({
        type: 'USERS_LIST_FETCH_STARTED',
      });

      // Realiza la petición GET a tu endpoint de usuarios
      const response = await axios.get('users/');
      const records = response.data; // Esperamos un array directo gracias a pagination_class = None en el backend

      dispatch({
        type: 'USERS_LIST_FETCH_SUCCESS',
        payload: {
          rows: records,
          count: records.length, // Si no hay paginación, el count es la longitud del array
        },
      });
    } catch (error) {
      Errors.handle(error);
      dispatch({
        type: 'USERS_LIST_FETCH_ERROR',
      });
    }
  },

  doDelete: (id) => async (dispatch) => {
    try {
      dispatch({
        type: 'USERS_LIST_DELETE_STARTED',
      });
      await axios.delete(`/users/${id}/`);
      dispatch({ type: 'USERS_LIST_DELETE_SUCCESS' });
      // Después de eliminar, volvemos a cargar la lista para que la UI se actualice
      dispatch(actions.doFetch());
    } catch (error) {
      Errors.handle(error);
      dispatch({ type: 'USERS_LIST_DELETE_ERROR' });
    }
  },
};

export default actions;
