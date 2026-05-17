import React from "react";
import { logoutUser } from "./actions/auth";
import { Redirect, Route } from "react-router";
import hasToken from "./services/authService";

export const AdminRoute = ({ currentUser, dispatch, component, ...rest }) => {
  if (!hasToken()) {
    dispatch(logoutUser()); // Asegura que el estado de Redux se limpie
    return (<Redirect to="/login"/>)
  }

  const userRole = currentUser?.role;
  const roleName = typeof userRole === 'string' ? userRole : userRole?.role_name;
  const isAdmin = roleName && roleName.toLowerCase().includes('admin');

  if (!currentUser || !isAdmin) {
    return (<Redirect to="/template"/>)
  }

  return (
    <Route {...rest} render={props => (React.createElement(component, props))}/>
  );
};

export const UserRoute = ({ dispatch, component, ...rest }) => {
  if (!hasToken()) {
    dispatch(logoutUser());
    return (<Redirect to="/login"/>)
  } else {
    return (
      <Route {...rest} render={props => (React.createElement(component, props))}/>
    );
  }
};

export const AuthRoute = ({ dispatch, component, ...rest }) => {
  const { from } = rest.location.state || { from: { pathname: '/template'} };

  if (hasToken()) {
    return (
      <Redirect to={from} />
    );
  } else {
    return (
      <Route {...rest} render={props => (React.createElement(component, props))}/>
    )
  }
}
