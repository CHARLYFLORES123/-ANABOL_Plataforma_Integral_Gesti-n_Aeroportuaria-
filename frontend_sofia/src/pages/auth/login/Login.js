import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { withRouter, Link, Redirect } from "react-router-dom";
import config from "../../../config";
import { connect } from "react-redux";
import { push } from "connected-react-router";
import jwt from "jsonwebtoken";
import { loginUser, receiveToken, doInit } from "../../../actions/auth";
import {
  Container,
  Row,
  Col,
  Button,
  FormGroup,
  FormText,
  Input,
} from "reactstrap";
import CustomAlert from "../../../components/CustomAlert/CustomAlert";
import Widget from "../../../components/Widget/Widget";
import Footer from "../../../components/Footer/Footer";

import loginImage from "../../../assets/LoginImage.jpeg";
import SofiaLogo from "../../../components/Icons/SofiaLogo";
import GoogleIcon from "../../../components/Icons/AuthIcons/GoogleIcon.js";
import TwitterIcon from "../../../components/Icons/AuthIcons/TwitterIcon.js";
import FacebookIcon from "../../../components/Icons/AuthIcons/FacebookIcon.js";
import GithubIcon from "../../../components/Icons/AuthIcons/GithubIcon.js";
import LinkedinIcon from "../../../components/Icons/AuthIcons/LinkedinIcon.js";

const Login = (props) => {
  const [state, setState] = useState({
    username: 'admin', // Django SimpleJWT usa 'username' por defecto
    password: 'admin',
  })
  const [showPassword, setShowPassword] = useState(false)

  const doLogin = (e) => {
    e.preventDefault();
    props.dispatch(loginUser({ username: state.username, password: state.password })) // Asegura que se envíen 'username' y 'password'
  }

  const changeCreds = (event) => {
    setState({ ...state, [event.target.name]: event.target.value })
  }

  useEffect(() => {
    const params = new URLSearchParams(props.location.search)
    const token = params.get('token');
    if (token) {
      props.dispatch(receiveToken(token))
      props.dispatch(doInit())
    }
  }, []); // El array vacío asegura que esto solo corra al montar el componente

  // Redirigir al dashboard si ya está autenticado
  if (props.isAuthenticated) {
    return <Redirect to="/template/dashboard" />;
  }

  return (
    <div className="auth-page" style={{ 
      backgroundImage: `url(${loginImage})`, 
      backgroundSize: 'cover', 
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Container className="my-auto">
        <Row className="justify-content-center">
          
            <Widget className="widget-auth widget-p-lg">
              <div className="text-center mb-4">
                <div className="logo-block mb-3">
                  <SofiaLogo />
                  <p className="mb-0">ANABOL</p>
                </div>
                <p className="auth-header mb-0">Bienvenido Usuario👋</p>
              </div>

              <form onSubmit={(event) => doLogin(event)}>
                <FormGroup className="my-3">
                  <FormText>Usuario</FormText>
                  <Input
                    id="username"
                    className="input-transparent pl-3"
                    value={state.username}
                    onChange={(event) => changeCreds(event)}
                    type="text"
                    required
                    name="username"
                    placeholder="Usuario"
                  />
                </FormGroup>
                <FormGroup  className="my-3">
                  <div className="d-flex justify-content-between">
                    <FormText>Contraseña</FormText>
                    <Link to="/error">¿Has olvidado tu contraseña?</Link>
                  </div>
                  <div className="position-relative">
                    <Input
                      id="password"
                      className="input-transparent pl-3 pr-5"
                      value={state.password}
                      onChange={(event) => changeCreds(event)}
                      type={showPassword ? "text" : "password"}
                      required
                      name="password"
                      placeholder="Contraseña"
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex="-1"
                    >
                      <i className={`eva ${showPassword ? 'eva-eye-off' : 'eva-eye'}`} />
                    </button>
                  </div>
                </FormGroup>
                 {/* Lógica de Alertas */}
              {props.errorMessage && (
                <CustomAlert 
                  key={typeof props.errorMessage === 'string' ? props.errorMessage : JSON.stringify(props.errorMessage)}
                  type="error" 
                  withIcon
                >
                  {typeof props.errorMessage === 'string' 
                    ? props.errorMessage 
                    : (props.errorMessage.detail || "Error al iniciar sesión")}
                </CustomAlert>
              )}
                <div className="bg-widget d-flex justify-content-center">
                  <Button className="rounded-pill my-3" type="submit" color="secondary-red">Ingresar</Button>
                </div>
              </form>
            </Widget>
        </Row>
      </Container>
    </div>
  )

}

Login.propTypes = {
  dispatch: PropTypes.func.isRequired,
}

function mapStateToProps(state) {
  return {
    isFetching: state.auth.isFetching,
    isAuthenticated: state.auth.isAuthenticated,
    errorMessage: state.auth.errorMessage,
  };
}

export default withRouter(connect(mapStateToProps)(Login));
