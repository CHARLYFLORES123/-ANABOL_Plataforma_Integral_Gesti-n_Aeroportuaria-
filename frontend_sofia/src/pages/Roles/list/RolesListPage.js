import React, { useEffect, useState } from "react";
import { Col, Row, Button, Spinner, Modal, ModalHeader, ModalBody, ModalFooter, FormGroup, Label, Input, Badge } from "reactstrap";
import { connect } from "react-redux";
import axios from "axios";
import { toast } from "react-toastify";
import BootstrapTable from "react-bootstrap-table-next";
import 'react-bootstrap-table-next/dist/react-bootstrap-table2.min.css';
import ToolkitProvider, { Search } from 'react-bootstrap-table2-toolkit/dist/react-bootstrap-table2-toolkit';
import Swal from 'sweetalert2'; // Import SweetAlert2
import Widget from "../../../components/Widget/Widget";
import actions from "../../../actions/rolesListActions";
import config from "../../../config";

import s from "../../tables/Tables.module.scss";

const { SearchBar } = Search;

const RolesListPage = (props) => {
  const { rows = [], loading, dispatch } = props;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [editRoleName, setEditRoleName] = useState("");
  const [editPermIam, setEditPermIam] = useState(0);
  const [editPermAodb, setEditPermAodb] = useState(0);
  const [editPermRms, setEditPermRms] = useState(0);
  const [editPermFids, setEditPermFids] = useState(0);
  const [editPermAdmin, setEditPermAdmin] = useState(0);
  const [savingEdit, setSavingEdit] = useState(false);
  const [formError, setFormError] = useState("");

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);

  useEffect(() => {
    dispatch(actions.doFetch());
  }, [dispatch]);

  const openDeleteConfirm = (id) => {
    setDeleteId(id);
    setConfirmOpen(true);
  };

  const closeDeleteConfirm = () => {
    setDeleteId(null);
    setConfirmOpen(false);
  };

  const handleDelete = () => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "¡No podrás revertir esta acción!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#4d53e0',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        await dispatch(actions.doDelete(deleteId));
        Swal.fire('¡Eliminado!', 'El rol ha sido eliminado.', 'success');
        closeDeleteConfirm();
      }
    });
  };

  const openEditModal = (role) => {
    setEditingRole(role);
    setEditRoleName(role.role_name || "");
    setEditPermIam(role.perm_iam || 0);
    setEditPermAodb(role.perm_aodb || 0);
    setEditPermRms(role.perm_rms || 0);
    setEditPermFids(role.perm_fids || 0);
    setEditPermAdmin(role.perm_admin || 0);
    setFormError("");
    setEditOpen(true);
  };

  const openCreateModal = () => {
    setEditingRole(null);
    setEditRoleName("");
    setEditPermIam(0);
    setEditPermAodb(0);
    setEditPermRms(0);
    setEditPermFids(0);
    setEditPermAdmin(0);
    setFormError("");
    setEditOpen(true);
  };

  const closeEditModal = () => {
    setEditingRole(null);
    setEditOpen(false);
    setFormError("");
  };

  const handleEditSave = async () => {
    if (!editRoleName.trim()) {
      setFormError('El nombre del rol no puede quedar vacío');
      return;
    }

    const payload = {
      role_name: editRoleName.trim(),
      perm_iam: Number(editPermIam),
      perm_aodb: Number(editPermAodb),
      perm_rms: Number(editPermRms),
      perm_fids: Number(editPermFids),
      perm_admin: Number(editPermAdmin),
    };

    try {
      setSavingEdit(true);
      if (editingRole) {
        await dispatch(actions.doUpdate(editingRole.id, payload));
         Swal.fire({
          title: '¡Actualizado!',
          text: 'El rol ha sido actualizado correctamente.',
          icon: 'success',
          confirmButtonColor: '#4d53e0',
        });
      } else {
        await dispatch(actions.doCreate(payload));
        Swal.fire({
          title: '¡Creado!',
          text: 'El nuevo rol ha sido creado correctamente.',
          icon: 'success',
          confirmButtonColor: '#4d53e0',
        });
      }
      closeEditModal();
    } finally {
      setSavingEdit(false);
    }
  };
  const toggleSearch = (e, onSearch) => {
    e.preventDefault();
    if (!isSearchOpen) {
      // Si está cerrado, lo abre
      setIsSearchOpen(true);
    } else if (isSearchOpen && searchTerm.trim()) {
      // Si está abierto y hay texto, ejecuta la búsqueda
      onSearch(searchTerm);
    } else {
      // Si está abierto pero no hay texto, lo cierra
      setIsSearchOpen(false);
    }
  };
  const handleRefresh = (e, onSearch) => {
    e.preventDefault();
    setSearchTerm("");
    onSearch("");
    dispatch(actions.doFetch());
  };

  const handleExportExcel = async (e) => {
    e.preventDefault();
    setExportingExcel(true);
    try {
      console.log('Exportando Excel...');
      const response = await axios.get('roles/export/excel/', {
        responseType: 'blob',
        timeout: 30000
      });
      console.log('Respuesta Excel:', response);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'roles_registrados.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Archivo Excel generado correctamente");
    } catch (error) {
      console.error("Error al exportar Excel:", error);
      if (error.response) {
        console.error('Error response:', error.response);
        toast.error(`Error ${error.response.status}: ${error.response.statusText}`);
      } else if (error.request) {
        console.error('Error request:', error.request);
        toast.error("No se pudo conectar con el servidor");
      } else {
        toast.error("Error al generar el archivo Excel");
      }
    } finally {
      setExportingExcel(false);
    }
  };

  const handleExportPDF = async (e) => {
    e.preventDefault();
    setExportingPDF(true);
    try {
      console.log('Exportando PDF...');
      const response = await axios.get('roles/export/pdf/', {
        responseType: 'blob',
        timeout: 30000
      });
      console.log('Respuesta PDF:', response);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'reporte_roles.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Archivo PDF generado correctamente");
    } catch (error) {
      console.error("Error al exportar PDF:", error);
      if (error.response) {
        console.error('Error response:', error.response);
        toast.error(`Error ${error.response.status}: ${error.response.statusText}`);
      } else if (error.request) {
        console.error('Error request:', error.request);
        toast.error("No se pudo conectar con el servidor");
      } else {
        toast.error("Error al generar el reporte PDF");
      }
    } finally {
      setExportingPDF(false);
    }
  };

  const actionFormatter = (cell, row) => {
    return (
      <div className="d-flex align-items-center">
        <Button
          size="sm"
          color="info"
          className="p-1 mr-1"
          onClick={() => openEditModal(row)}
        >
          <i className="eva eva-edit-2" />
        </Button>
        <Button
          size="sm"
          color="danger"
          className="p-1"
          onClick={() => openDeleteConfirm(row.id)}
        >
          <i className="eva eva-trash-2" />
        </Button>
      </div>
    );
  };

  const columns = [
    {
      dataField: "id",
      sort: true,
      text: "ID",
    },
    {
      dataField: "role_name",
      sort: true,
      text: "Nombre Rol",
    },
    {
      dataField: "perm_iam",
      sort: true,
      text: "SEGURIDAD E IAM",
      formatter: (cell) => {
        if (cell === 0) return 'Sin acceso';
        if (cell === 1) return 'Solo ver';
        if (cell === 2) return 'Total';
        return cell;
      },
    },
    {
      dataField: "perm_aodb",
      sort: true,
      text: "VUELOS AODB",
      formatter: (cell) => {
        if (cell === 0) return 'Sin acceso';
        if (cell === 1) return 'Solo ver';
        if (cell === 2) return 'Total';
        return cell;
      },
    },
    {
      dataField: "perm_rms",
      sort: true,
      text: "RECURSOS RMS",
      formatter: (cell) => {
        if (cell === 0) return 'Sin acceso';
        if (cell === 1) return 'Solo ver';
        if (cell === 2) return 'Total';
        return cell;
      },
    },
    {
      dataField: "perm_fids",
      sort: true,
      text: "PANTALLAS FIDS",
      formatter: (cell) => {
        if (cell === 0) return 'Sin acceso';
        if (cell === 1) return 'Solo ver';
        if (cell === 2) return 'Total';
        return cell;
      },
    },
    {
      dataField: "perm_admin",
      sort: true,
      text: "CONFIG. GLOBAL",
      formatter: (cell) => {
        if (cell === 0) return 'Sin acceso';
        if (cell === 1) return 'Solo ver';
        if (cell === 2) return 'Total';
        return cell;
      },
    },
    {
      dataField: "id",
      formatter: actionFormatter,
      text: "Acciones",
    },
  ];

  return (
    <div>
      <div className="page-top-line">
        
      </div>
      <Row>
        <Col xs={12}>
          <Widget className="widget-p-md">
            {loading ? (
              <div className="text-center py-5">
                <Spinner color="primary" />
              </div>
            ) : (
              <>
                <ToolkitProvider
                  columns={columns}
                  data={rows}
                  keyField="id"
                  search
                >
                  {(toolkitProps) => (
                    <>
                      <div className={s.tableTitle}>
                        <div className="headline-2">Listado de Roles</div>
                        <div className="d-flex align-items-center">
                          {isSearchOpen && (
                            <Input
                              size="sm"
                              className="mr-2"
                              placeholder="Buscar rol..."
                              autoFocus
                              value={searchTerm}
                              onChange={(e) => {
                                setSearchTerm(e.target.value);
                                toolkitProps.searchProps.onSearch(e.target.value);
                              }}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  toolkitProps.searchProps.onSearch(searchTerm);
                                }
                              }}
                              style={{ width: '200px' }}
                            />
                          )}
                          <a href="/#" className="ml-3" onClick={(e) => toggleSearch(e, toolkitProps.searchProps.onSearch)}><i className="eva eva-search" title="Filtrar" /></a>
                          <a href="/#" className="ml-3 d-none d-sm-block" onClick={(e) => handleRefresh(e, toolkitProps.searchProps.onSearch)}><i className="eva eva-refresh" title="Limpiar" /></a>
                          <a href="/#" className="ml-3" onClick={handleExportExcel} disabled={exportingExcel}>
                            {exportingExcel ? (
                              <i className="eva eva-loader-outline" title="Exportando..." />
                            ) : (
                              <i className="eva eva-file-text" title="Exportar Excel" />
                            )}
                          </a>
                          <a href="/#" className="ml-3 d-none d-sm-block" onClick={handleExportPDF} disabled={exportingPDF}>
                            {exportingPDF ? (
                              <i className="eva eva-loader-outline" title="Exportando..." />
                            ) : (
                              <i className="eva eva-printer" title="Exportar PDF" />
                            )}
                          </a>
                          <a href="/#" className="ml-3" onClick={(e) => { e.preventDefault(); openCreateModal(); }}><i className="eva eva-plus" title="Nuevo Rol" /></a>
                        </div>
                      </div>
                      <BootstrapTable
                        bordered={false}
                        classes="table-striped table-hover mt-4"
                        {...toolkitProps.baseProps}
                      />
                    </>
                  )}
                </ToolkitProvider>




                <Modal size="sm" isOpen={confirmOpen} toggle={closeDeleteConfirm}>
                  <ModalHeader toggle={closeDeleteConfirm}>Confirmar eliminación</ModalHeader>
                  <ModalBody>
                    ¿Estás seguro de que quieres eliminar este rol?
                  </ModalBody>
                  <ModalFooter>
                    <Button color="secondary" onClick={closeDeleteConfirm}>
                      Cancelar
                    </Button>
                    <Button color="danger" onClick={handleDelete}>
                      Eliminar
                    </Button>
                  </ModalFooter>
                </Modal>

                <Modal isOpen={editOpen} toggle={closeEditModal}>
                  <ModalHeader toggle={closeEditModal}>{editingRole ? 'Editar rol' : 'Agregar rol'}</ModalHeader>
                  <ModalBody>
                    {formError && (
                      <div className="text-danger mb-3">{formError}</div>
                    )}
                    <FormGroup>
                      <Label> Nombre Rol</Label>
                      <Input
                        type="text"
                        value={editRoleName}
                        onChange={(event) => setEditRoleName(event.target.value)}
                      />
                    </FormGroup>
                    <FormGroup>
                      <Label>Permiso SEGURIDAD E IAM</Label>
                      <Input
                        type="select"
                        value={editPermIam}
                        onChange={(event) => setEditPermIam(event.target.value)}
                      >
                        <option value={0}>Sin acceso</option>
                        <option value={1}>Solo ver</option>
                        <option value={2}>Total</option>
                      </Input>
                    </FormGroup>
                    <FormGroup>
                      <Label>Permiso VUELOS AODB</Label>
                      <Input
                        type="select"
                        value={editPermAodb}
                        onChange={(event) => setEditPermAodb(event.target.value)}
                      >
                        <option value={0}>Sin acceso</option>
                        <option value={1}>Solo ver</option>
                        <option value={2}>Total</option>
                      </Input>
                    </FormGroup>
                    <FormGroup>
                      <Label>Permiso RECURSOS RMS</Label>
                      <Input
                        type="select"
                        value={editPermRms}
                        onChange={(event) => setEditPermRms(event.target.value)}
                      >
                        <option value={0}>Sin acceso</option>
                        <option value={1}>Solo ver</option>
                        <option value={2}>Total</option>
                      </Input>
                    </FormGroup>
                    <FormGroup>
                      <Label>Permiso PANTALLAS FIDS</Label>
                      <Input
                        type="select"
                        value={editPermFids}
                        onChange={(event) => setEditPermFids(event.target.value)}
                      >
                        <option value={0}>Sin acceso</option>
                        <option value={1}>Solo ver</option>
                        <option value={2}>Total</option>
                      </Input>
                    </FormGroup>
                    <FormGroup>
                      <Label>Config. Global</Label>
                      <Input
                        type="select"
                        value={editPermAdmin}
                        onChange={(event) => setEditPermAdmin(event.target.value)}
                      >
                        <option value={0}>Sin acceso</option>
                        <option value={1}>Solo ver</option>
                        <option value={2}>Total</option>
                      </Input>
                    </FormGroup>
                  </ModalBody>
                  <ModalFooter>
                    <Button color="secondary" onClick={closeEditModal}>
                      Cancelar
                    </Button>
                    <Button color="primary" onClick={handleEditSave} disabled={savingEdit}>
                      {savingEdit ? 'Guardando...' : editingRole ? 'Guardar cambios' : 'Crear rol'}
                    </Button>
                  </ModalFooter>
                </Modal>
              </>
            )}
          </Widget>
        </Col>
      </Row>
    </div>
  );
};

const mapStateToProps = (state) => ({
  rows: state.rolesList?.rows || [],
  loading: state.rolesList?.loading || false,
});

export default connect(mapStateToProps)(RolesListPage);
