import React, { useState, useEffect } from "react";
import { Row, Col, Button, Modal, ModalHeader, ModalBody, ModalFooter, FormGroup, Label, Input, Badge } from "reactstrap";
import BootstrapTable from "react-bootstrap-table-next";
import ToolkitProvider, { Search } from 'react-bootstrap-table2-toolkit/dist/react-bootstrap-table2-toolkit';
import Swal from 'sweetalert2';
import Widget from "../../components/Widget/Widget.js";
import Loader from "../../components/Loader/Loader";
import axios from "axios";
import { toast } from "react-toastify";
import 'react-bootstrap-table-next/dist/react-bootstrap-table2.min.css'; // Asegúrate de que esta importación esté presente

const TorreControlPage = () => {
  const [data, setData] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false); // Nuevo estado para la visibilidad del buscador
  const [searchTerm, setSearchTerm] = useState(""); // Nuevo estado para el término de búsqueda

  const endpoint = "seguridad/personal-atc/";
  
  useEffect(() => {
    fetchRecords();
    fetchUsers();
  }, []);

  const fetchRecords = () => {
    setLoading(true);
    axios.get(endpoint)
      .then(res => setData(Array.isArray(res.data) ? res.data : res.data.results || []))
      .catch(() => Swal.fire('Error', 'No se pudo cargar el personal ATC', 'error'))
      .finally(() => setLoading(false));
  };

  const fetchUsers = () => {
    axios.get("users/")
      .then(res => setUsers(Array.isArray(res.data) ? res.data : res.data.results || []))
      .catch(err => console.error("Error cargando usuarios:", err));
  };

  // Funciones para el buscador y refrescar
  const toggleSearch = (e, onSearch) => {
    e.preventDefault();
    if (!isSearchOpen) {
      setIsSearchOpen(true);
    } else if (isSearchOpen && searchTerm.trim()) {
      // Si el buscador está abierto y hay un término, ejecutar la búsqueda
      onSearch(searchTerm);
    } else {
      // Si el buscador está abierto pero vacío, cerrarlo
      setIsSearchOpen(false);
    }
  };

  const handleRefresh = (e, onSearch) => {
    e.preventDefault();
    setSearchTerm(""); // Limpiar el término de búsqueda
    onSearch(""); // Limpiar la búsqueda en la tabla
    fetchRecords(); // Volver a cargar todos los registros
  };

  const toggleModal = () => setModalOpen(!modalOpen);


  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = Object.fromEntries(formData.entries());
    
    // Convertir checkbox a booleano
    payload.certificado_medico_vigente = formData.get("certificado_medico_vigente") === "on";

    // Si estamos editando, el campo 'usuario' está deshabilitado y no se incluye en formData.
    // Debemos añadirlo explícitamente desde editData.
    if (editData && !payload.usuario) {
      payload.usuario = editData.usuario;
    }
    try {
      if (editData) {
        await axios.put(`${endpoint}${editData.id}/`, payload);
        Swal.fire('Actualizado', 'Perfil ATC actualizado con éxito', 'success');
      } else {
        await axios.post(endpoint, payload);
        Swal.fire('Creado', 'Perfil ATC creado con éxito', 'success');
      }
      fetchRecords();
      setModalOpen(false);
    } catch (error) {
      const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : "Error en la operación";
      Swal.fire('Error', errorMsg, 'error');
    }
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: '¿Eliminar perfil ATC?',
      text: "Esta acción no eliminará al usuario, solo su registro de personal técnico.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      confirmButtonColor: '#fd5f00'
    }).then((result) => {
      if (result.isConfirmed) {
        axios.delete(`${endpoint}${id}/`).then(() => {
          fetchRecords();
          Swal.fire('Eliminado', 'El registro ha sido removido.', 'success');
        });
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
      link.setAttribute('download', 'personal_atc_reporte.csv');
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
      link.setAttribute('download', 'personal_atc_reporte.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error al exportar PDF:", error);
      toast.error("Error al generar el reporte PDF");
    }
  };

  const columns = [
    { 
      dataField: "usuario_nombre", 
      text: "Usuario", 
      sort: true,
      formatter: (cell, row) => <strong>{cell || `ID: ${row.usuario}`}</strong>
    },
    { dataField: "numero_licencia_atc", text: "Licencia #", sort: true },
    { dataField: "cargo_atc", text: "Cargo", sort: true },
    { dataField: "vencimiento_licencia", text: "Vencimiento", sort: true },
    { 
      dataField: "certificado_medico_vigente", 
      text: "Médico", 
      formatter: cell => <Badge color={cell ? "success" : "danger"}>{cell ? "Vigente" : "Vencido"}</Badge>
    },
    { 
      dataField: "id", 
      text: "Acciones", 
      headerAlign: 'center',
      formatter: (cell, row) => (
        <div className="d-flex justify-content-center">
          <Button size="sm" color="info" className="mr-1" onClick={() => { setEditData(row); setModalOpen(true); }}>
            <i className="eva eva-edit-2" />
          </Button>
          <Button size="sm" color="danger" onClick={() => handleDelete(row.id)}>
            <i className="eva eva-trash-2" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <Row className="mb-4">
      <Col xs={12}>
        <Widget className="widget-p-md">
          <div className="headline-2 mb-3">Control de Personal - Torre de Control</div>
          <p className="body-1 muted">Gestión de licencias, cargos y vigencia médica del personal operativo ATC.</p>

          {loading ? <Loader /> : (
            <ToolkitProvider keyField="id" data={data} columns={columns} search>
              {props => (
                <div>
                  <div className="d-flex align-items-center justify-content-end mb-3 pr-2">
                    {isSearchOpen && (
                      <Input
                        size="sm"
                        className="mr-2"
                        placeholder="Buscar personal..."
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
                    <a href="/#" className="ml-3" onClick={(e) => { e.preventDefault(); setEditData(null); setModalOpen(true); }}><i className="eva eva-plus" title="Registrar Personal ATC" /></a>
                  </div>
                  <BootstrapTable 
                    { ...props.baseProps } 
                    bordered={false} 
                    classes="table-hover table-striped" 
                    noDataIndication={() => (loading ? "Cargando..." : "No hay registros")}
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
            {editData ? 'Editar Perfil ATC' : 'Registrar Nuevo ATC'}
          </ModalHeader>
          <ModalBody>
            <FormGroup>
              <Label>Usuario Vinculado</Label>
              <Input type="select" name="usuario" defaultValue={editData?.usuario} required disabled={!!editData}>
                <option value="">Seleccione un usuario...</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.username} ({u.firstName} {u.lastName})</option>
                ))}
              </Input>
              {editData && <small className="text-muted">La vinculación de usuario no puede cambiarse una vez creada.</small>}
            </FormGroup>
            <FormGroup><Label>Número de Licencia ATC</Label><Input name="numero_licencia_atc" defaultValue={editData?.numero_licencia_atc} required /></FormGroup>
            <FormGroup><Label>Cargo ATC</Label><Input name="cargo_atc" defaultValue={editData?.cargo_atc} required placeholder="Ej: CONTROLADOR_TIERRA" /></FormGroup>
            <FormGroup><Label>Función Operativa</Label><Input type="textarea" name="funcion_operativa" defaultValue={editData?.funcion_operativa} /></FormGroup>
            <FormGroup><Label>Fecha Vencimiento Licencia</Label><Input type="date" name="vencimiento_licencia" defaultValue={editData?.vencimiento_licencia} required /></FormGroup>
            <FormGroup check className="mb-3">
              <Label check>
                <Input type="checkbox" name="certificado_medico_vigente" defaultChecked={editData?.certificado_medico_vigente} /> Certificado Médico Vigente
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

export default TorreControlPage;