import React from 'react';
import {createRoot} from "react-dom/client";
import { routerMiddleware } from "connected-react-router";
import { createStore, applyMiddleware, compose } from "redux";
import ReduxThunk from "redux-thunk";
import { Provider } from 'react-redux';
import * as serviceWorker from './serviceWorker';
import axios from "axios";

import App from './App';
import config from './config';
import createRootReducer from './reducers';

import { doInit } from "./actions/auth";
import { createHashHistory } from "history";

// ** Fake Database
// import './fakeDB';

const history = createHashHistory();

export function getHistory() {
  return history;
}

axios.defaults.baseURL = config.baseURLApi;
axios.defaults.headers.common['Content-Type'] = "application/json";
const token = localStorage.getItem('token');
if (token) {
  axios.defaults.headers.common['Authorization'] = "Bearer " + token;
}

// Interceptor para corregir errores de rutas con doble slash (ej: api//file)
// común en componentes que usan rutas absolutas con un baseURL que termina en /
axios.interceptors.request.use(
  (requestConfig) => {
    if (requestConfig.baseURL && requestConfig.url && requestConfig.url.startsWith('/') && requestConfig.baseURL.endsWith('/')) {
      requestConfig.url = requestConfig.url.substring(1);
    }
    return requestConfig;
  },
  (error) => Promise.reject(error)
);

export const store = createStore(
  createRootReducer(history),
  compose(
    applyMiddleware(
      routerMiddleware(history),
      ReduxThunk)
  )
);

store.dispatch(doInit());

const container = document.getElementById("root");
const root = createRoot(container);
root.render(
    <Provider store={store}>
        <App/>
    </Provider>
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
