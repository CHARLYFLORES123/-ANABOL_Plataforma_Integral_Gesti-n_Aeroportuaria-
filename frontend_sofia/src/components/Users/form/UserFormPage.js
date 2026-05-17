import React, { useState, useEffect } from 'react';
import UsersForm from "./UsersForm";
import { goBack, push } from "connected-react-router";
import { connect } from 'react-redux';
import actions from "../../../actions/usersFormActions";
import { Alert, Row, Col } from 'reactstrap';
import cx from 'classnames';
import Widget from "../../Widget/Widget";

import s from "../Users.module.scss";

const UserFormPage = (props) => {
  const [dispatched, setDispatched] = useState(false)
  const [promoAlert, setPromoAlert] = useState(false)

  const {
    dispatch,
    match,
    saveLoading,
    findLoading,
    record,
    roles,
    loadingRoles,
    isProfile, // Añadido para obtener la prop isProfile de mapStateToProps
    currentUser
  } = props;

  const showPromoAlert = () => {
    setPromoAlert(true)
  }

  const isEditing = () => {
    return !!match.params.id;
  }

  

  const doSubmit = (id, data) => {
    if (isEditing() || isProfile) {
      dispatch(actions.doUpdate(id, data, isProfile));
     } else {
      dispatch(actions.doCreate(data))
    }
  }

  useEffect(() => {
    console.log("%c 🔄 UserFormPage useEffect ejecutándose", "background: #9b59b6; color: #fff");
    console.log("Roles actuales:", roles, "Length:", roles?.length, "Loading:", loadingRoles);
    
    // Solo cargar si no tenemos roles todavía y no estamos ya cargando
    if ((!roles || roles.length === 0) && !loadingRoles) {
      console.log("%c 🚀 UserFormPage: Disparando doFetchRoles()", "background: #ffcc00; color: #000");
      dispatch(actions.doFetchRoles());
    } else if (roles && roles.length > 0) {
      console.log("%c ✅ Ya tenemos roles, no cargamos de nuevo", "background: #27ae60; color: #fff");
    }

    if (isEditing()) {
      dispatch(actions.doFind(match.params.id, false));
    } else if (isProfile) {
      // Para el perfil, el backend identifica al usuario por el token JWT
      dispatch(actions.doFind(null, true));
    } else {
      dispatch(actions.doNew());
    }
    setDispatched(true)
    setTimeout(() => {
      showPromoAlert();
    }, 100)
  }, [match, dispatch, isProfile, roles, loadingRoles]) // Añadido isProfile, roles y loadingRoles a las dependencias

  console.log("UserFormPage - roles from store:", roles, "loadingRoles from store:", loadingRoles);

  return (
    <React.Fragment>
      <div className="page-top-line">
        <h2 className="page-title">{isProfile ? 'Editar Mi Perfil' : (isEditing() ? 'Editar Usuario' : '')}</h2>
        
      </div>
      {dispatched && (
        <Row className="justify-content-center">
          <Col lg={9} md={11} xs={12}>
            <Widget className="widget-p-md">
              <UsersForm
                saveLoading={saveLoading}
                findLoading={findLoading}
                currentUser={currentUser}
                record={
                  (isEditing() || isProfile) ? record : {} 
                }
                roles={roles}
                loadingRoles={loadingRoles}
                isEditing={isEditing()}
                isProfile={isProfile} 
                onSubmit={doSubmit}
                onCancel={() => dispatch(push('/template/users'))}
              />
            </Widget>
          </Col>
        </Row>
      )}
    </React.Fragment>
  );
}

function mapStateToProps(store) {
  const pathname = store.router.location.pathname;
  return {
    findLoading: store.users.form.findLoading,
    saveLoading: store.users.form.saveLoading,
    record: store.users.form.record,
    roles: store.users.form.roles || [],
    loadingRoles: store.users.form.loadingRoles,
    currentUser: store.auth.currentUser,
    isProfile: pathname.includes('/template/user/profile') || pathname.includes('/template/edit_profile'),
  };
}

export default connect(mapStateToProps)(UserFormPage);
