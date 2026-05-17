import React, { useState } from "react";
import PropTypes from "prop-types";
import { withRouter } from "react-router";
import { Link } from "react-router-dom";
import { connect } from "react-redux";
import {
  Navbar,
  Nav,
  NavItem,
  NavLink,
  InputGroupAddon,
  InputGroup,
  Input,
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Form,
  FormGroup,
} from "reactstrap";
import { logoutUser } from "../../actions/auth.js";
import { closeSidebar, openSidebar } from "../../actions/navigation.js";
import MenuIcon from "../Icons/HeaderIcons/MenuIcon.js";
import SearchBarIcon from "../Icons/HeaderIcons/SearchBarIcon.js";
import BellIcon from "../Icons/HeaderIcons/BellIcon.js";
import SearchIcon from "../Icons/HeaderIcons/SearchIcon.js";

import ProfileIcon from "../../assets/navbarMenus/pfofileIcons/ProfileIcon.js";
import MessagesIcon from "../../assets/navbarMenus/pfofileIcons/MessagesIcon.js";
import TasksIcon from "../../assets/navbarMenus/pfofileIcons/TasksIcon.js";

import logoutIcon from "../../assets/navbarMenus/pfofileIcons/logoutOutlined.svg";
import basketIcon from "../../assets/navbarMenus/basketIcon.svg";
import calendarIcon from "../../assets/navbarMenus/calendarIcon.svg";
import envelopeIcon from "../../assets/navbarMenus/envelopeIcon.svg";
import mariaImage from "../../assets/navbarMenus/mariaImage.jpg";
import notificationImage from "../../assets/navbarMenus/notificationImage.jpg";
import userImg from "../../assets/user.svg";

import s from "./Header.module.scss";
import "animate.css";

const Header = (props) => {
  const { currentUser } = props;
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Simulación de notificaciones relacionadas al sistema
  const [notifications] = useState([
    { id: 1, text: "Vuelo AV456: Hito de combustible iniciado", time: "2 min", type: "ramp", icon: basketIcon },
    { id: 2, text: "Alerta: Vuelo demorado por clima en origen", time: "15 min", type: "delay", icon: calendarIcon },
    { id: 3, text: "Nuevo mensaje de Torre de Control", time: "1h", type: "message", icon: envelopeIcon },
  ]);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  }

  const toggleNotifications = () => {
    setNotificationsOpen(!notificationsOpen)
  }

  const doLogout = () => {
    props.dispatch(logoutUser());
  }

  const toggleSidebar = () => {
    if (props.sidebarOpened) {
      props.dispatch(closeSidebar())
    } else {
      props.dispatch(openSidebar());
    }
  }

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Redirige a la lista de usuarios con el término de búsqueda
      props.history.push(`/template/users?search=${encodeURIComponent(searchQuery)}`);
    }
  }

  return (
    <Navbar className={`header-navbar d-print-none`}>
      <div>
        <NavLink
          onClick={() => toggleSidebar()}
          className={`d-md-none mr-3`}
          href="#"
        >
          <MenuIcon className={s.menuIcon} />
        </NavLink>
      </div>
      <Form className="d-none d-sm-block" inline onSubmit={handleSearch}>
        <FormGroup>
          <InputGroup>
            <Input 
              id="search-input" 
              placeholder="Buscar en el sistema..." 
              className='focus no-border'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <InputGroupAddon addonType="prepend">
              <span className="d-flex align-self-center px-3" style={{ cursor: 'pointer' }} onClick={handleSearch}>
                <SearchBarIcon/>
              </span>
            </InputGroupAddon>
          </InputGroup>
        </FormGroup>
      </Form>
      <Nav className="ml-auto">
        <NavItem className="d-sm-none mr-4">
          <NavLink
            className=""
            href="#"
          >
            <SearchIcon />
          </NavLink>
        </NavItem>
        <Dropdown nav isOpen={menuOpen} toggle={() => toggleMenu()} className="tutorial-dropdown mr-2 mr-sm-3">
          <DropdownToggle nav>
            <div className={s.navbarBlock}>
              <BellIcon maskId={114}></BellIcon>
              {notifications.length > 0 && <div className={s.count}></div>}
            </div>
          </DropdownToggle>
          <DropdownMenu right className="navbar-dropdown notifications-dropdown" style={{ width: "340px" }}>
            <DropdownItem header className="text-center">Notificaciones del Sistema</DropdownItem>
            {notifications.map(notif => (
              <DropdownItem key={notif.id} className="py-3">
                <div className="d-flex align-items-center">
                  <img src={notif.icon} alt="Icon" className="mr-3" style={{ width: '20px' }} />
                  <div className="d-flex flex-column" style={{ whiteSpace: 'normal' }}>
                    <span className="body-3">{notif.text}</span>
                    <span className="label muted">{notif.time} ago</span>
                  </div>
                </div>
              </DropdownItem>
            ))}
            <DropdownItem divider />
            <DropdownItem className="text-center text-primary">Ver todas las alertas</DropdownItem>
          </DropdownMenu>
        </Dropdown>
        <Dropdown isOpen={notificationsOpen} toggle={() => toggleNotifications()} nav id="basic-nav-dropdown" className="ml-3">
          <DropdownToggle nav caret className="navbar-dropdown-toggle">
            <div className={`${s.avatar} rounded-circle float-left mr-2`}>
              <img 
                src={currentUser?.avatar?.[0]?.url || userImg} 
                alt="User"
                onError={(e) => e.target.src = userImg}
              />
            </div>
            <span className="small d-none d-sm-block ml-1 mr-2 body-1">
              {currentUser ? (currentUser.firstName || currentUser.username) : "Cargando..."}
            </span>
          </DropdownToggle>
          <DropdownMenu className="navbar-dropdown profile-dropdown" style={{ width: "194px" }}>
            <DropdownItem tag={Link} to="/template/user/profile" className={s.dropdownProfileItem}>
              <ProfileIcon/><span>Perfil</span>
            </DropdownItem>
            <DropdownItem tag={Link} to="/template/edit_profile" className={s.dropdownProfileItem}>
              <i className="eva eva-edit-2-outline" /><span>Editar Perfil</span>
            </DropdownItem>
            <DropdownItem tag={Link} to="/template/password" className={s.dropdownProfileItem}>
              <i className="eva eva-lock-outline" /><span>Cambiar Contraseña</span>
            </DropdownItem>
            <DropdownItem divider />
            <DropdownItem className={s.dropdownProfileItem} onClick={() => doLogout()}>
              <i className="eva eva-log-out-outline mr-2" style={{ fontSize: '18px' }} />
              <span>Cerrar Sesión</span>
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </Nav>
    </Navbar>
  )
}

Header.propTypes = {
  dispatch: PropTypes.func.isRequired,
  sidebarOpened: PropTypes.bool,
}

function mapStateToProps(store) {
  return {
    sidebarOpened: store.navigation.sidebarOpened,
    currentUser: store.auth.currentUser,

  };
}

export default withRouter(connect(mapStateToProps)(Header));
