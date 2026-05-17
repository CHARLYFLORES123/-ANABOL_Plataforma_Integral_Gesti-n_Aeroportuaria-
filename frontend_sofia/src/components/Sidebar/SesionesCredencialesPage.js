import React, { useState, useEffect } from "react";
import { Row, Col, Button, Modal, ModalHeader, ModalBody, ModalFooter, FormGroup, Label, Input, Badge } from "reactstrap";
import BootstrapTable from "react-bootstrap-table-next";
import ToolkitProvider, { Search } from 'react-bootstrap-table2-toolkit/dist/react-bootstrap-table2-toolkit';
import Swal from 'sweetalert2';
import Widget from "../../components/Widget/Widget.js";
import Loader from "../../components/Loader/Loader";
import axios from "axios";
import { toast } from "react-toastify";
import 'react-bootstrap-table-next/dist/react-bootstrap-table2.min.css';

const SesionesCredencialesPage = () => {
  const [data, setData] = useState([]);
  const [users, setUsers] = useState([]); // Para el dropdown de usuarios
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const endpoint = "seguridad/sesiones/"; // Asegúrate que tu baseURL de axios ya incluya /api/

  useEffect(() => {
    fetchRecords();
    fetchUsers(); // Cargar usuarios para el selector
  }, []);

  const fetchRecords = () => {
    setLoading(true);
    axios.get(endpoint)
      .then(res => setData(Array.isArray(res.data) ? res.data : res.data.results || []))
      .catch(() => Swal.fire('Error', 'No se pudieron cargar las sesiones', 'error'))
      .finally(() => setLoading(false));
  };

  const fetchUsers = () => {
    axios.get("users/") // Asumiendo que tienes un endpoint para listar usuarios
      .then(res => setUsers(Array.isArray(res.data) ? res.data : res.data.results || []))
      .catch(err => console.error("Error cargando usuarios:", err));
  };

  const toggleSearch = (e, onSearch) => {
    e.preventDefault();
    if (!isSearchOpen) {
      setIsSearchOpen(true);
    } else if (isSearchOpen && searchTerm.trim()) {
      onSearch(searchTerm);
    } else {
      setIsSearchOpen(false);
    }
  };

  const handleRefresh = (e, onSearch) => {
    e.preventDefault();
    setSearchTerm("");
    onSearch("");
    fetchRecords();
  };

  const toggleModal = () => setModalOpen(!modalOpen);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = Object.fromEntries(formData.entries());
    
    // Convertir checkboxes a booleanos
    payload.mfa_verificado = formData.get("mfa_verificado") === "on";

    // Asegurarse de que el usuario se envíe si estamos editando y el campo está deshabilitado
    if (editData && !payload.usuario) {
      payload.usuario = editData.usuario;
    }

    // Asegurarse de que el token_jti se envíe si estamos editando y el campo está deshabilitado
    if (editData && !payload.token_jti) {
      payload.token_jti = editData.token_jti;
    }

    try {
      if (editData) {
        await axios.put(`${endpoint}${editData.id}/`, payload);
        Swal.fire('Éxito', 'Sesión actualizada', 'success');
      } else {
        // Para crear una sesión manualmente, se necesitaría un token_jti y expira_at válidos.
        // Esto es más complejo y generalmente se maneja en el backend al iniciar sesión.
        // Por ahora, si se intenta crear, se puede mostrar una advertencia o simplificar.
        // Aquí asumimos que el backend puede generar un token_jti y expira_at si no se proveen,
        // o que el administrador los proveerá manualmente (lo cual es poco común).
        await axios.post(endpoint, payload);
        Swal.fire('Éxito', 'Sesión creada', 'success');
      }
      fetchRecords();
      setModalOpen(false);
    } catch (error) {
      const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : "Error en la operación";
      Swal.fire('Error', `No se pudo guardar: ${errorMsg}`, 'error');
    }
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: '¿Cerrar sesión?',
      text: "Esta acción finalizará la sesión del usuario en el dispositivo.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cerrar',
      confirmButtonColor: '#fd5f00'
    }).then((result) => {
      if (result.isConfirmed) {
        axios.delete(`${endpoint}${id}/`).then(() => {
          fetchRecords();
          Swal.fire('Cerrada', 'La sesión ha sido finalizada.', 'success');
        }).catch(() => Swal.fire('Error', 'No se pudo cerrar la sesión', 'error'));
      }
    });
  };

  const handleExportCSV = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.get(`${endpoint}export/excel/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'sesiones_usuarios.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error al exportar CSV:", error);
      toast.error("Error al generar el archivo CSV");
    }
  };

  const handleExportPDF = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.get(`${endpoint}export/pdf/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'reporte_sesiones.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error al exportar PDF:", error);
      toast.error("Error al generar el reporte PDF");
    }
  };

  const statusFormatter = (cell) => {
    let color = "secondary";
    switch (cell) {
      case "ACTIVA": color = "success"; break;
      case "EXPIRADA": color = "warning"; break;
      case "CERRADA": color = "danger"; break;
      default: color = "secondary";
    }
    return <Badge color={color}>{cell}</Badge>;
  };

  const mfaFormatter = (cell) => (
    <Badge color={cell ? "success" : "danger"}>{cell ? "Verificado" : "Pendiente"}</Badge>
  );

  const columns = [
    { dataField: "usuario_nombre", text: "Usuario", sort: true },
    { dataField: "dispositivo", text: "Dispositivo", sort: true },
    { dataField: "ip_origen", text: "IP Origen", sort: true },
    { dataField: "mfa_verificado", text: "MFA", sort: true, formatter: mfaFormatter },
    { dataField: "estado", text: "Estado", sort: true, formatter: statusFormatter },
    { dataField: "ultimo_acceso", text: "Último Acceso", sort: true, formatter: val => val ? new Date(val).toLocaleString() : 'N/A' },
    { 
      dataField: "id", text: "Acciones", 
      formatter: (cell, row) => (
        <div className="d-flex justify-content-center">
          <Button size="sm" color="info" className="mr-1" onClick={() => { setEditData(row); setModalOpen(true); }}><i className="eva eva-edit-2" /></Button>
          <Button size="sm" color="danger" onClick={() => handleDelete(row.id)}><i className="eva eva-power" /></Button>
        </div>
      )
    }
  ];

  return (
    <Row className="mb-4">
      <Col xs={12}>
        <Widget className="widget-p-md">
          <div className="headline-2 mb-3">Gestión de Sesiones y Credenciales</div>
          <p className="body-1 muted">Monitoreo y control de sesiones activas de usuarios.</p>
          
          {loading ? <Loader /> : (
            <ToolkitProvider keyField="id" data={data} columns={columns} search>
              {props => (
                <div>
                  <div className="d-flex align-items-center justify-content-end mb-3 pr-2">
                    {isSearchOpen && (
                      <Input
                        size="sm"
                        className="mr-2"
                        placeholder="Buscar sesión..."
                        autoFocus
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          props.searchProps.onSearch(e.target.value);
                        }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            props.searchProps.onSearch(searchTerm);
                          }
                        }}
                        style={{ width: '200px' }}
                      />
                    )}
                    <a href="/#" className="ml-3" onClick={(e) => toggleSearch(e, props.searchProps.onSearch)}><i className="eva eva-search" title="Filtrar" /></a>
                    <a href="/#" className="ml-3" onClick={handleExportCSV}><i className="eva eva-file-text" title="Exportar CSV (Excel)" /></a>
                    <a href="/#" className="ml-3" onClick={handleExportPDF}><i className="eva eva-printer" title="Exportar PDF" /></a>
                    <a href="/#" className="ml-3" onClick={(e) => handleRefresh(e, props.searchProps.onSearch)}><i className="eva eva-refresh" title="Limpiar" /></a>
                    <a href="/#" className="ml-3" onClick={(e) => { e.preventDefault(); setEditData(null); setModalOpen(true); }}><i className="eva eva-plus" title="Crear Sesión (Admin)" /></a>
                  </div>
                  <BootstrapTable 
                    { ...props.baseProps } 
                    bordered={false} 
                    classes="table-hover table-striped" 
                    noDataIndication={() => (loading ? "Cargando..." : "No hay registros de sesiones")}
                  />
                </div>
              )}
            </ToolkitProvider>
          )}
        </Widget>
      </Col>

      <Modal isOpen={modalOpen} toggle={() => setModalOpen(!modalOpen)}>
        <form onSubmit={handleSubmit}>
          <ModalHeader toggle={() => setModalOpen(!modalOpen)}>
            {editData ? 'Editar Sesión' : 'Crear Nueva Sesión'}
          </ModalHeader>
          <ModalBody>
            <FormGroup>
              <Label>Usuario</Label>
              <Input type="select" name="usuario" defaultValue={editData?.usuario} required disabled={!!editData}>
                <option value="">Seleccione un usuario...</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.username} ({u.firstName} {u.lastName})</option>
                ))}
              </Input>
              {editData && <small className="text-muted">El usuario de la sesión no puede cambiarse.</small>}
            </FormGroup>
            <FormGroup><Label>Token JTI</Label><Input name="token_jti" defaultValue={editData?.token_jti} required disabled={!!editData} /></FormGroup>
            <FormGroup><Label>Dispositivo</Label><Input name="dispositivo" defaultValue={editData?.dispositivo} required /></FormGroup>
            <FormGroup><Label>IP Origen</Label><Input name="ip_origen" defaultValue={editData?.ip_origen} required /></FormGroup>
            <FormGroup><Label>Estado</Label><Input type="select" name="estado" defaultValue={editData?.estado} required>
              <option value="ACTIVA">ACTIVA</option>
              <option value="EXPIRADA">EXPIRADA</option>
              <option value="CERRADA">CERRADA</option>
            </Input></FormGroup>
            <FormGroup><Label>Expira At</Label><Input type="datetime-local" name="expira_at" defaultValue={editData?.expira_at ? new Date(editData.expira_at).toISOString().substring(0, 16) : ''} required /></FormGroup>
            <FormGroup check className="mb-3">
              <Label check>
                <Input type="checkbox" name="mfa_verificado" defaultChecked={editData?.mfa_verificado} /> MFA Verificado
              </Label>
            </FormGroup>
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button color="primary" type="submit">Guardar Registro</Button>
          </ModalFooter>
        </form>
      </Modal>
    </Row>
  );
};

export default SesionesCredencialesPage;