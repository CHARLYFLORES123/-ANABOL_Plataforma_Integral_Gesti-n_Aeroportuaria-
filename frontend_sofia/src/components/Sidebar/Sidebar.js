import React, {useEffect, useState} from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import cn from "classnames";
import s from "./Sidebar.module.scss";
import LinksGroup from "./LinksGroup/LinksGroup";
import { changeActiveSidebarItem } from "../../actions/navigation.js";
import SofiaLogo from "../Icons/SofiaLogo.js";
import "eva-icons/style/eva-icons.css";

const Sidebar = (props) => {
  const {
    currentUser,
    activeItem = "",
    ...restProps
  } = props;

  const userRole = currentUser?.role || "";
  const isAdmin = userRole === "Administrator";

  // Función para validar acceso según la tabla de permisos proporcionada
  const hasAccess = (module) => {
    if (isAdmin) return true; // El administrador tiene acceso a todo

    switch (module) {
      case "seguridad-iam":
        // Full Access o View Only para estos roles
        return ["Operations Manager"].includes(userRole);
      
      case "vuelos-aodb":
        return ["Operations Manager", "FIDS Operator", "Despachador de Vuelo", "Agente de Servicio al Pasajero"].includes(userRole);
      
      case "recursos-rms":
        return ["Operations Manager", "Despachador de Vuelo", "Agente de Servicio al Pasajero", "Agente de Rampa"].includes(userRole);
      
      case "pantallas-fids":
        return ["Operations Manager", "FIDS Operator", "Agente de Servicio al Pasajero"].includes(userRole);
      
      case "config-global":
        return ["Operations Manager"].includes(userRole);

      default:
        return true; // Dashboard y funciones básicas de usuario (Perfil) se muestran siempre
    }
  };
      // HASTA AQUI
  const [burgerBtnToggled, setBurgerBtnToggled] = useState(false);

  useEffect(() => {
    if (props.sidebarOpened) {
      setBurgerBtnToggled(true)
    } else {
      setTimeout(() => {
        setBurgerBtnToggled(false)
      }, 0)
    }
  },  [props.sidebarOpened])

  return (
    <nav className={cn(s.root, {[s.sidebarOpen]: burgerBtnToggled})}>
      <header className={s.logo}>
        <SofiaLogo/>
        <span className={s.title}>ANABOL</span>
      </header>
      <ul className={s.nav}>
        <LinksGroup
          onActiveSidebarItemChange={activeItem => props.dispatch(changeActiveSidebarItem(activeItem))}
          activeItem={props.activeItem}
          header="Dashboard"
          isHeader
          iconName={<i className="eva eva-home-outline"/>}
          link="/template/dashboard"
          index="dashboard"
        />
          <LinksGroup
          onActiveSidebarItemChange={activeItem => props.dispatch(changeActiveSidebarItem(activeItem))}
          activeItem={props.activeItem}
          header="Usuarios"
          isHeader
          iconName={<i className="eva eva-person-outline"/>}
          link="/template/users"
          index="users"
          exact={false}
          childrenLinks={[
            {
              header: 'Mi Perfil', link: '/template/user/profile',
            },
            {
              header: 'Lista de Usuarios', link: '/template/users', hidden: !["Administrator"].includes(userRole)
            },
            {
              header: 'Roles y Permisos', link: '/template/roles', hidden: !["Administrator"].includes(userRole)
            },
            {
              header: 'Editar Perfil', link: '/template/edit_profile',
            },
            {
              header: 'Cambio de contraseña', link: '/template/password',
            },
          ].filter(link => !link.hidden)}
        />

        {/* trabaja de aqui */}

        {hasAccess("seguridad-iam") && (
        <LinksGroup
          onActiveSidebarItemChange={activeItem => props.dispatch(changeActiveSidebarItem(activeItem))}
          activeItem={props.activeItem}
          header="Seguridad e IAM"
          isHeader
          iconName={<i className="eva eva-shield-outline"/>}
          link="/template/seguridad-iam"
          index="seguridad-iam"
          childrenLinks={[
            {
              header: 'Aerolínea Empresas', link: '/template/seguridad-iam/aerolineas',
            },
            {
              header: 'Personal Torre Control', link: '/template/seguridad-iam/personal',
            },
            {
              header: 'Logs de Auditoría', link: '/template/seguridad-iam/logs',
            },
            {
              header: 'Sesiones y Credenciales', link: '/template/seguridad-iam/sesiones',
            },
          ]}
        />
        )}

        {hasAccess("vuelos-aodb") && (
        <LinksGroup
          onActiveSidebarItemChange={activeItem => props.dispatch(changeActiveSidebarItem(activeItem))}
          activeItem={props.activeItem}
          header="Vuelos AODB"
          isHeader
          iconName={<i className="eva eva-navigation-outline"/>}
          link="/template/vuelos-aodb"
          index="vuelos-aodb"
          childrenLinks={[
            {
              header: 'Planificación de Vuelos', link: '/template/vuelos-aodb/planificacion',
            },
            {
              header: 'Operaciones del Día', link: '/template/vuelos-aodb/operaciones',
            },
            {
              header: 'Hitos de Rampa', link: '/template/vuelos-aodb/hitos',
            },
            {
              header: 'Manifiesto de Pasajeros', link: '/template/vuelos-aodb/manifiesto',
            },
            {
              header: 'Calendario', link: '/template/vuelos-aodb/calendario',
            },
          ]}
        />
        )}

        {hasAccess("recursos-rms") && (
        <LinksGroup
          onActiveSidebarItemChange={activeItem => props.dispatch(changeActiveSidebarItem(activeItem))}
          activeItem={props.activeItem}
          header="Recursos RMS"
          isHeader
          iconName={<i className="eva eva-briefcase-outline"/>}
          link="/template/recursos-rms"
          index="recursos-rms"
          childrenLinks={[
            {
              header: 'Puertas de Embarque', link: '/template/recursos-rms/puertas',
            },
            {
              header: 'Mostradores Check-in', link: '/template/recursos-rms/counters',
            },
            {
              header: 'Cintas de Equipaje', link: '/template/recursos-rms/cintas',
            },
            {
              header: 'Mapa de Plataforma', link: '/template/recursos-rms/plataforma',
            },
          ]}
        />
        )}

        {hasAccess("pantallas-fids") && (
        <LinksGroup
          onActiveSidebarItemChange={activeItem => props.dispatch(changeActiveSidebarItem(activeItem))}
          activeItem={props.activeItem}
          header="Pantallas FIDS"
          isHeader
          iconName={<i className="eva eva-monitor-outline"/>}
          link="/template/pantallas-fids"
          index="pantallas-fids"
          childrenLinks={[
            {
              header: 'Monitor Salidas (Real)', link: '/template/pantallas-fids/monitor-salidas',
            },
            {
              header: 'Diseñador y Plantillas', link: '/template/pantallas-fids/disenador',
            },
            {
              header: 'Gestión de Dispositivos', link: '/template/pantallas-fids/dispositivos',
            },
            {
              header: 'Mensajería Dinámica', link: '/template/pantallas-fids/mensajeria',
            },
            {
              header: 'Agrupamiento de Zonas', link: '/template/pantallas-fids/zonas',
            },
          ]}
        />
        )}

        {hasAccess("config-global") && (
        <LinksGroup
          onActiveSidebarItemChange={activeItem => props.dispatch(changeActiveSidebarItem(activeItem))}
          activeItem={props.activeItem}
          header="Config. Global"
          isHeader
          iconName={<i className="eva eva-globe-outline"/>}
          link="/template/permisos-admin"
          index="permisos-admin"
          childrenLinks={[
            {
              header: 'Diccionarios Maestros', link: '/template/config-global/diccionarios',
            },
            {
              header: 'Configuración Local', link: '/template/config-global/local',
            },
            {
              header: 'Integraciones y Webhooks', link: '/template/config-global/integraciones',
            },
            {
              header: 'Tasas y Multi-moneda', link: '/template/config-global/moneda',
            },
          ]}
        />
        )}
      </ul>
    </nav>
  );
}

Sidebar.propTypes = {
  sidebarOpened: PropTypes.bool,
  dispatch: PropTypes.func.isRequired,
  activeItem: PropTypes.string,
  location: PropTypes.shape({
    pathname: PropTypes.string,
  }).isRequired,
  currentUser: PropTypes.object,
}

function mapStateToProps(store) {
  return {
    sidebarOpened: store.navigation.sidebarOpened,
    activeItem: store.navigation.activeItem,
    currentUser: store.auth.currentUser,
  };
};

export default withRouter(connect(mapStateToProps)(Sidebar));
