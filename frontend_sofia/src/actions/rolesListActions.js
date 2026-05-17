import axios from "axios";
import Errors from "../components/FormItems/error/errors";

const actions = {
  doFetch: () => async (dispatch) => {
    try {
      dispatch({
        type: 'ROLES_LIST_FETCH_STARTED',
      });

      const response = await axios.get('roles/');
      const records = response.data;

      dispatch({
        type: 'ROLES_LIST_FETCH_SUCCESS',
        payload: {
          rows: records,
          count: records.length,
        },
      });
    } catch (error) {
      Errors.handle(error);
      dispatch({
        type: 'ROLES_LIST_FETCH_ERROR',
      });
    }
  },

  doDelete: (id) => async (dispatch) => {
    try {
      dispatch({
        type: 'ROLES_LIST_DELETE_STARTED',
      });

      await axios.delete(`roles/${encodeURIComponent(id)}/`);

      dispatch({
        type: 'ROLES_LIST_DELETE_SUCCESS',
      });
      dispatch(actions.doFetch());
    } catch (error) {
      Errors.handle(error);
      dispatch({
        type: 'ROLES_LIST_DELETE_ERROR',
      });
    }
  },

  doUpdate: (id, data) => async (dispatch) => {
    try {
      dispatch({
        type: 'ROLES_LIST_UPDATE_STARTED',
      });

      await axios.patch(`roles/${encodeURIComponent(id)}/`, data);

      dispatch({
        type: 'ROLES_LIST_UPDATE_SUCCESS',
      });
      dispatch(actions.doFetch());
    } catch (error) {
      Errors.handle(error);
      dispatch({
        type: 'ROLES_LIST_UPDATE_ERROR',
      });
    }
  },

  doCreate: (data) => async (dispatch) => {
    try {
      dispatch({
        type: 'ROLES_LIST_CREATE_STARTED',
      });

      await axios.post('roles/', data);

      dispatch({
        type: 'ROLES_LIST_CREATE_SUCCESS',
      });
      dispatch(actions.doFetch());
    } catch (error) {
      Errors.handle(error);
      dispatch({
        type: 'ROLES_LIST_CREATE_ERROR',
      });
    }
  },
};

export default actions;
