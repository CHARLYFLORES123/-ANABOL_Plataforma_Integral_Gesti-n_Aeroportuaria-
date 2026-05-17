import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { Switch, Route, withRouter, Redirect } from "react-router";
import UsersList from '../Sidebar/UsersList'; // Importa tu componente UsersList

import Header from "../Header/Header";
import Sidebar from "../Sidebar/Sidebar";
import Footer from "../Footer/Footer";
import Breadcrumbs from "../Breadbrumbs/Breadcrumbs";

import Dashboard from "../../pages/dashboard/Dashboard";
import Profile from "../../pages/profile/Profile";
import UserListPage from "../Users/list/UsersListPage";
import UserViewPage from "../Users/view/UsersViewPage";
import ChangePasswordFormPage from "../Users/changePassword/ChangePasswordFormPage";
import UserFormPage from "../Users/form/UserFormPage";
import RolesListPage from "../../pages/Roles/list/RolesListPage"; // Import from pages directory
import SeguridadIamPage from "../../pages/modules/SeguridadIamPage";
import VuelosAodbPage from "../../pages/modules/VuelosAodbPage";
import RecursosRmsPage from "../../pages/modules/RecursosRmsPage";
import PantallasFidsPage from "../../pages/modules/PantallasFidsPage";
import PermisosAdminPage from "../../pages/modules/PermisosAdminPage";
import DiccionariosPage from "../Sidebar/DiccionariosPage";
import DisenadorPlantillasPage from "../Sidebar/DisenadorPlantillasPage";
import GestionDispositivosPage from "../Sidebar/GestionDispositivosPage";
import MensajeriaDinamicaPage from "../Sidebar/MensajeriaDinamicaPage";
import AgrupamientoZonasPage from "../Sidebar/AgrupamientoZonasPage";
import MonitorSalidasPage from "../Sidebar/MonitorSalidasPage";

import ConfiguracionLocalPage from "../Sidebar/ConfiguracionLocalPage";
import IntegracionesPage from "../Sidebar/IntegracionesPage";
import MonedaTasasPage from "../Sidebar/MonedaTasasPage";
import VueloPlanificadoPage from '../Sidebar/VueloPlanificadoPage'; 
import VueloDiarioPage from '../Sidebar/VueloDiarioPage';
import HitosRampaPage from '../Sidebar/HitosRampaPage';
import ManifiestoPasajerosPage from '../Sidebar/ManifiestoPasajerosPage';
import MostradoresCheckinPage from '../Sidebar/MostradoresCheckinPage';
import CintasEquipajePage from '../Sidebar/CintasEquipajePage';
import PuertasEmbarquePage from '../Sidebar/PuertasEmbarquePage';
import PosicionesRampaPage from '../Sidebar/PosicionesRampaPage';
import AerolineasEmpresasPage from "../Sidebar/AerolineasEmpresasPage";
import TorreControlPage from "../Sidebar/TorreControlPage";
import LogsAuditoriaPage from "../Sidebar/LogsAuditoriaPage";
import SesionesCredencialesPage from "../Sidebar/SesionesCredencialesPage"; // Nueva importación
import Typography from "../../pages/core/typography/Typography";
import Colors from "../../pages/core/colors/Colors";
import Grid from "../../pages/core/grid/Grid";
import Notifications from "../../pages/uielements/notifications/Notifications";
import Tables from "../../pages/tables/Tables";
import Alerts from "../../pages/uielements/alerts/Alerts";
import Badges from "../../pages/uielements/badges/Badges";
import Buttons from "../../pages/uielements/buttons/Buttons";
import Cards from "../../pages/uielements/cards/Cards";
import Carousel from "../../pages/uielements/carousel/Carousel";
import Charts from "../../pages/extra/charts/Charts";
import Jumbotron from "../../pages/uielements/jumbotron/Jumbotron";
import Icons from "../../pages/uielements/icons/IconsPage";
import Lists from "../../pages/uielements/lists/Lists";
import Navbars from "../../pages/uielements/navbar/Navbars"
import Navs from "../../pages/uielements/navs/Navs";
import Modal from "../../pages/uielements/modal/Modal";
import Progress from "../../pages/uielements/progress/Progress";
import Popover from "../../pages/uielements/popovers/Popovers";
import Elements from "../../pages/forms/elements/Elements";
import Validation from "../../pages/forms/validation/Validation";
import Wizard from "../../pages/forms/wizard/Wizard";
import BarCharts from "../../pages/charts/bar/BarCharts";
import LineCharts from "../../pages/charts/line/LineCharts";
import PieCharts from "../../pages/charts/pie/PieCharts";
import OtherCharts from "../../pages/charts/other/OtherCharts";
import Maps from "../../pages/maps/google/GoogleMapPage";
import VectorMap from "../../pages/maps/vector/Vector";
import VuelosCalendarioPage from "../Sidebar/VuelosCalendarioPage";

import Calendar from "../../pages/calendar/Calendar";
import Login from "../../pages/auth/login/Login";
import Register from "../../pages/auth/register/Register";

import s from "./Layout.module.scss";

const Layout = (props) => {
  return (
    <div className={s.root}>
      <div className={s.wrap}>
        <Header />
        <Sidebar />
        <main className={s.content}>
          <Breadcrumbs url={props.location.pathname} />
          <Switch>
            <Route path="/template" exact render={() => <Redirect to="template/dashboard"/>} />
            <Route path="/template/dashboard" exact component={Dashboard}/>
            <Route path="/template/user" exact render={() => <Redirect to={"/template/user/profile"} />}/>
            <Route path="/template/user/profile" exact component={Profile} />
            <Route path="/template/users" exact component={UsersList} />
            <Route path="/template/users/:id/edit" exact component={UserFormPage} />
            <Route path="/template/roles" exact component={RolesListPage} />
            
            {/* Seguridad e IAM */}
            <Route path="/template/seguridad-iam" exact component={SeguridadIamPage} />
            <Route path="/template/seguridad-iam/aerolineas" exact component={AerolineasEmpresasPage} />
            <Route path="/template/seguridad-iam/personal" exact component={TorreControlPage} />
            <Route path="/template/seguridad-iam/logs" exact component={LogsAuditoriaPage} />
            <Route path="/template/seguridad-iam/sesiones" exact component={SesionesCredencialesPage} />

            {/* Vuelos AODB */}
            <Route path="/template/vuelos-aodb" exact component={VuelosAodbPage} />
            <Route path="/template/vuelos-aodb/planificacion" exact component={VueloPlanificadoPage} />
            <Route path="/template/vuelos-aodb/operaciones" exact component={VueloDiarioPage} />
            <Route path="/template/vuelos-aodb/hitos" exact component={HitosRampaPage} />
            <Route path="/template/vuelos-aodb/calendario" exact component={VuelosCalendarioPage} />
            <Route path="/template/vuelos-aodb/manifiesto" exact component={ManifiestoPasajerosPage} />

            {/* Recursos RMS */}
            <Route path="/template/recursos-rms" exact component={RecursosRmsPage} />
            <Route path="/template/recursos-rms/puertas" exact component={PuertasEmbarquePage} />
            <Route path="/template/recursos-rms/counters" exact component={MostradoresCheckinPage} />
            <Route path="/template/recursos-rms/cintas" exact component={CintasEquipajePage} />
            <Route path="/template/recursos-rms/plataforma" exact component={PosicionesRampaPage} />

            {/* Pantallas FIDS */}
            <Route path="/template/pantallas-fids" exact component={PantallasFidsPage} />
            <Route path="/template/pantallas-fids/monitor-salidas" exact component={MonitorSalidasPage} />
            <Route path="/template/pantallas-fids/disenador" exact component={DisenadorPlantillasPage} />
            <Route path="/template/pantallas-fids/dispositivos" exact component={GestionDispositivosPage} />
            <Route path="/template/pantallas-fids/mensajeria" exact component={MensajeriaDinamicaPage} />
            <Route path="/template/pantallas-fids/zonas" exact component={AgrupamientoZonasPage} />

            {/* Config Global */}
            <Route path="/template/permisos-admin" exact component={PermisosAdminPage} />
            <Route path="/template/config-global/diccionarios" exact component={DiccionariosPage} />
            <Route path="/template/config-global/local" exact component={ConfiguracionLocalPage} />
            <Route path="/template/config-global/integraciones" exact component={IntegracionesPage} />
            <Route path="/template/config-global/moneda" exact component={MonedaTasasPage} />

            <Route path="/admin" exact render={() => <Redirect to="/admin/users" />} />
            <Route path="/admin/users" exact component={UserListPage} />
            <Route path="/admin/users/new" exact component={UserFormPage} />
            <Route path="/admin/users/:id/edit" exact component={UserFormPage} />
            
            <Route path="/admin/users/:id" exact component={UserViewPage} />
            <Route path="/template/password" exact component={ChangePasswordFormPage} />
            <Route path="/template/edit_profile" exact component={UserFormPage} />
            <Route path="/template/core" exact render={() => <Redirect to={"/template/core/typography"} />} />
            <Route path="/template/core/typography" exact component={Typography} />
            <Route path="/template/core/colors" exact component={Colors} />
            <Route path="/template/core/grid" exact component={Grid} />
            <Route path="/template/calendar" exact component={Calendar} />
            <Route path="/template/tables" exact component={Tables} />
            <Route path="/template/ui-elements" exact render={() => <Redirect to={"/template/ui-elements/alerts"} />} />
            <Route path="/template/ui-elements/alerts" exact component={Alerts} />
            <Route path="/template/ui-elements/badges" exact component={Badges} />
            <Route path="/template/ui-elements/buttons" exact component={Buttons} />
            <Route path="/template/ui-elements/cards" exact component={Cards} />
            <Route path="/template/ui-elements/carousel" exact component={Carousel} />
            <Route path="/template/ui-elements/jumbotron" exact component={Jumbotron} />
            <Route path="/template/ui-elements/icons" exact component={Icons} />
            <Route path="/template/ui-elements/lists" exact component={Lists} />
            <Route path="/template/ui-elements/modal" exact component={Modal} />
            <Route path="/template/ui-elements/navbars" exact component={Navbars} />
            <Route path="/template/ui-elements/navs" exact component={Navs} />
            <Route path="/template/ui-elements/notifications" exact component={Notifications} />
            <Route path="/template/ui-elements/progress" exact component={Progress} />
            <Route path="/template/ui-elements/popovers" exact component={Popover} />
            <Route path="/template/forms" exact render={() => <Redirect to={"/template/forms/elements"}/>} />
            <Route path="/template/forms/elements" exact component={Elements} />
            <Route path="/template/forms/validation" exact component={Validation} />
            <Route path="/template/forms/wizard" exact component={Wizard} />
            <Route path="/template/charts" exact render={() => <Redirect to={"/template/charts/other"}/>} />
            <Route path="/template/charts/line" exact component={LineCharts} />
            <Route path="/template/charts/pie" exact component={PieCharts} />
            <Route path="/template/charts/bar" exact component={BarCharts} />
            <Route path="/template/charts/other" exact component={OtherCharts} />
            <Route path="/template/maps" exact render={() => <Redirect to={"/template/maps/google"}/>} />
            <Route path="/template/maps/google" exact component={Maps} />
            <Route path="/template/maps/vector" exact component={VectorMap} />
            <Route path="/template/extra" exact render={() => <Redirect to={"/template/extra/charts"}/>} />
            <Route path="/template/extra/charts" exact component={Charts} />
            <Route path="/template/extra/login" exact component={Login} />
            <Route path="/template/extra/register" exact component={Register} />
            <Route path="/register" exact component={Register} />
            <Route path='*' exact render={() => <Redirect to="/error" />} />
          </Switch>
        </main>
        <Footer />
      </div>
    </div>
  );
}

Layout.propTypes = {
  sidebarOpened: PropTypes.bool,
  dispatch: PropTypes.func.isRequired,
}

function mapStateToProps(store) {
  return {
    sidebarOpened: store.navigation.sidebarOpened,
    currentUser: store.auth.currentUser,
  };
}

export default withRouter(connect(mapStateToProps)(Layout));
