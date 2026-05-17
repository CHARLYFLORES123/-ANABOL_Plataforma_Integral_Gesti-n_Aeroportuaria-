import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import {
  Col,
  Row,
  Table,
  Pagination,
  PaginationItem,
  PaginationLink,
  Input,
  Badge, // Importar Badge
  Button, // Importar Button
  Label,
} from "reactstrap";
import axios from "axios";
import Swal from 'sweetalert2';
import { toast } from "react-toastify";
import config from "../../config"; // Importamos la configuración para obtener la URL del backend
import { v4 as uuidv4 } from "uuid";
import Widget from "../../components/Widget/Widget.js";
import CustomModal from "../../components/CustomModal/CustomModal";
import UsersForm from "../Users/form/UsersForm";
import actions from "../../actions/usersListActions";
import formActions from "../../actions/usersFormActions";
import { push } from "connected-react-router"; // Importar push para redirección

import s from "../../pages/tables/Tables.module.scss";

const UsersList = (props) => {
  const { dispatch, rows, count, currentUser, roles, loadingRoles } = props; // Añadimos 'roles' aquí
  const [currentPage, setCurrentPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const pageSize = 10;

  useEffect(() => {
    dispatch(actions.doFetch());
  }, [dispatch]);

  // Cargar roles cuando el modal de añadir usuario se abre
  useEffect(() => {
    if (isAddModalOpen) {
      dispatch(formActions.doFetchRoles());
    }
  }, [isAddModalOpen, dispatch]);

  const setPage = (e, index) => {
    e.preventDefault();
    setCurrentPage(index);
  };

  // Función para manejar la eliminación de un usuario
  const doDelete = (id) => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "¡No podrás revertir esta acción!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#4d53e0',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(actions.doDelete(id));
      }
    });
  };

  // Nos aseguramos de que rows sea un array. Si el backend devuelve un objeto paginado, extraemos 'results'
  const rawData = Array.isArray(rows) ? rows : (rows && rows.results) || [];

  // Funcionalidad de Búsqueda local
  const filteredData = rawData.filter(user => 
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const usersData = filteredData;
  const totalCount = filteredData.length || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  // Funciones para las acciones de la cabecera
  const handleRefresh = (e) => {
    e.preventDefault();
    setSearchTerm("");
    dispatch(actions.doFetch());
  };

  const doAddUser = async (id, data) => {
    await dispatch(formActions.doCreate(data));
    setIsAddModalOpen(false);
    dispatch(actions.doFetch()); // Refrescar la tabla para ver al nuevo usuario
  };

  const handleExportExcel = async (e) => {
    e.preventDefault();
    try {
      // Axios envía automáticamente el token configurado en auth.js
      const response = await axios.get('users/export/excel/', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'usuarios_registrados.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error al exportar Excel:", error);
      toast.error("Error al generar el archivo Excel");
    }
  };

  const handleExportPDF = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.get('users/export/pdf/', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'reporte_usuarios.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error al exportar PDF:", error);
      toast.error("Error al generar el reporte PDF");
    }
  };

  const getAvatarUrl = (item) => {
    const avatar = item.avatar;
    // Intentar obtener URL de arreglo (publicUrl o url) o de string (Django)
    let url = (Array.isArray(avatar) && avatar.length > 0 ? (avatar[0].publicUrl || avatar[0].url) : null) || 
              (typeof avatar === 'string' ? avatar : null) || 
              item.img;
    
    // Si es una ruta relativa de Django (/media/...), añadir el host del backend
    if (url && !url.startsWith('http')) {
      const host = config.hostApi + (config.portApi ? `:${config.portApi}` : '');
      url = `${host}${url}`;
    }

    if (url) return url;
    
    // Fallback dinámico con iniciales si el servicio de placeholder falla
    const name = item.username || item.firstName || 'U';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`;
  };

  return (
    <div>
      <Row className="mb-4">
        <Col>
          <Widget>
            <div className={s.tableTitle}>
              <div className="headline-2">Gestión de Usuarios</div>
              <div className="d-flex align-items-center">
                {isSearchOpen && (
                  <Input
                    size="sm"
                    className="mr-2"
                    placeholder="Buscar usuario..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ width: '200px' }}
                  />
                )}
                <a href="/#" className="ml-3" onClick={(e) => { e.preventDefault(); setIsSearchOpen(!isSearchOpen); }}><i className="eva eva-search" title="Buscar" /></a>
                <a href="/#" className="ml-3 d-none d-sm-block" onClick={handleRefresh}><i className="eva eva-refresh" title="Limpiar" /></a>
                <a href="/#" className="ml-3" onClick={handleExportExcel}><i className="eva eva-file-text" title="Exportar a Excel" /></a>
                <a href="/#" className="ml-3 d-none d-sm-block" onClick={handleExportPDF}><i className="eva eva-printer" title="Exportar a PDF" /></a>
                
                <CustomModal
                  show={isAddModalOpen}
                  toggle={() => setIsAddModalOpen(!isAddModalOpen)}
                  buttonLabel={<i className="eva eva-plus" title="Agregar usuario" />}
                  buttonColor="link"
                  buttonClass="ml-3 p-0"
                  className="p-0"
                  modalTitle=""
                  size="lg"
                >
                  <UsersForm
                    onSubmit={doAddUser}
                    onCancel={() => setIsAddModalOpen(false)}
                    isEditing={false}
                    isProfile={false}
                    roles={roles} // Pasamos los roles al formulario
                    loadingRoles={loadingRoles}
                    currentUser={currentUser}
                  />
                </CustomModal>
              </div>
            </div>
            <div className="widget-table-overflow">
              <Table className={`table-striped table-borderless table-hover ${s.statesTable}`} responsive>
                <thead>
                  <tr>
                   
                    <th>USUARIO</th>
                    <th>EMAIL</th>
                    <th>NOMBRE</th>
                    <th>APELLIDOS</th>
                    <th>TELÉFONO</th>
                    <th>ROL</th>
                    <th>STAFF</th>
                    <th>ESTADO</th>
                    <th className="text-center">ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {usersData.slice(currentPage * pageSize, (currentPage + 1) * pageSize).map((item) => (
                      <tr key={item.id}>
                        <td className="d-flex align-items-center">
                          <img
                            className={s.image}
                            src={getAvatarUrl(item)}
                            alt="User"
                          />
                          <span className="ml-3">
                            {item.username || `${item.firstName} ${item.lastName || ''}`}
                          </span>
                        </td>
                        <td>{item.email}</td>
                        <td>{item.firstName}</td>
                        <td>{item.lastName}</td>
                        <td>{item.phoneNumber || 'N/A'}</td>
                        <td>{item.role}</td>
                        <td>
                          <Badge color={item.isStaff ? "primary" : "danger"}>
                            {item.isStaff ? "Sí" : "No"}
                          </Badge>
                        </td>
                        <td>
                          <Badge color={item.disabled ? "danger" : "success"}>
                            {item.disabled ? "Desactivado" : "Activo"}
                          </Badge>
                        </td>
                        <td className="text-center">
                          <Button color="primary" size="sm" className="mr-2" onClick={() => dispatch(push(`/template/users/${item.id}/edit`))}>
                            <i className="eva eva-edit-outline" />
                          </Button>
                          <Button color="danger" size="sm" onClick={() => doDelete(item.id)}>
                            <i className="eva eva-trash-2-outline" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </Table>
              <Pagination className="pagination-borderless" aria-label="Page navigation example">
                <PaginationItem disabled={currentPage <= 0}>
                  <PaginationLink onClick={(e) => setPage(e, currentPage - 1)} previous href="#top" />
                </PaginationItem>
                {[...Array(totalPages)].map((_, i) => (
                  <PaginationItem active={i === currentPage} key={i}>
                    <PaginationLink onClick={(e) => setPage(e, i)} href="#top">
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem disabled={currentPage >= totalPages - 1}>
                  <PaginationLink onClick={(e) => setPage(e, currentPage + 1)} next href="#top" />
                </PaginationItem>
              </Pagination>
            </div>
          </Widget>
        </Col>
      </Row>
    </div>
  );
};

function mapStateToProps(state) {
  return {
    rows: state.users.list.rows,
    count: state.users.list.count,
    currentUser: state.auth.currentUser,
    roles: state.users.form.roles || [], // Obtenemos los roles del estado, asegurando que sea un array
    loadingRoles: state.users.form.loadingRoles,
  };
}

export default connect(mapStateToProps)(UsersList);