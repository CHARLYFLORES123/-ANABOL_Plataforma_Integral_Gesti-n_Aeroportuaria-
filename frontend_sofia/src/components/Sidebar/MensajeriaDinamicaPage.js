import React, { useState, useEffect } from "react";
import { Row, Col, Button, Modal, ModalHeader, ModalBody, ModalFooter, FormGroup, Label, Input, Badge } from "reactstrap";
import BootstrapTable from "react-bootstrap-table-next";
import ToolkitProvider from 'react-bootstrap-table2-toolkit/dist/react-bootstrap-table2-toolkit';
import Swal from 'sweetalert2';
import Widget from "../../components/Widget/Widget.js";
import Loader from "../../components/Loader/Loader";
import axios from "axios";
import 'react-bootstrap-table-next/dist/react-bootstrap-table2.min.css';

const MensajeriaDinamicaPage = () => {
  const [data, setData] = useState([]);
  const [dispositivos, setDispositivos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Cambiado de mensajeria/ a alertas/ para coincidir con el modelo AlertaFids del backend
  const endpoint = "fids/alertas/";

  useEffect(() => {
    fetchRecords();
    fetchDependencies();
  }, []);

  const fetchRecords = () => {
    setLoading(true);
    axios.get(endpoint)
      .then(res => setData(Array.isArray(res.data) ? res.data : res.data.results || []))
      .catch(() => Swal.fire('Error', 'No se pudieron cargar las alertas FIDS', 'error'))
      .finally(() => setLoading(false));
  };

  const fetchDependencies = () => {
    axios.get("fids/dispositivos/")
      .then(res => setDispositivos(Array.isArray(res.data) ? res.data : res.data.results || []))
      .catch(err => console.error("Error cargando dispositivos:", err));

    axios.get("users/")
      .then(res => setUsuarios(Array.isArray(res.data) ? res.data : res.data.results || []))
      .catch(err => console.error("Error cargando usuarios:", err));
  };

  const formatDateTimeForInput = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toISOString().slice(0, 16);
  };

  const handleExportExcel = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.get(`${endpoint}export/excel/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'mensajes_fids.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error al exportar Excel:", error);
      Swal.fire('Error', 'No se pudo generar el archivo Excel', 'error');
    }
  };

  const handleExportPDF = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.get(`${endpoint}export/pdf/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'reporte_mensajes_fids.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error al exportar PDF:", error);
      Swal.fire('Error', 'No se pudo generar el reporte PDF', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = Object.fromEntries(formData.entries());

    // Convertir el checkbox a booleano para el backend
    payload.activo = formData.get("activo") === "on";

    try {
      if (editData) await axios.put(`${endpoint}${editData.id}/`, payload);
      else await axios.post(endpoint, payload);
      
      Swal.fire('Éxito', 'Mensaje guardado correctamente', 'success');
      fetchRecords();
      setModalOpen(false);
    } catch (error) {
      const msg = error.response?.data ? JSON.stringify(error.response.data) : "Error al guardar";
      Swal.fire('Error', msg, 'error');
    }
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: '¿Eliminar mensaje?',
      text: "Esta acción no se puede deshacer",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      confirmButtonColor: '#fd5f00'
    }).then((result) => {
      if (result.isConfirmed) {
        axios.delete(`${endpoint}${id}/`).then(() => {
          fetchRecords();
          Swal.fire('Eliminado', 'El mensaje ha sido removido.', 'success');
        }).catch(() => Swal.fire('Error', 'No se pudo eliminar el registro', 'error'));
      }
    });
  };

  const gravityFormatter = (cell) => {
    const color = cell === "URGENTE" ? "danger" : "info";
    return <Badge color={color}>{cell}</Badge>;
  };

  const deviceFormatter = (cell) => {
    const dev = dispositivos.find(d => d.id === cell);
    return dev ? dev.codigo_pantalla : <span className="text-muted">General</span>;
  };

  const userFormatter = (cell) => {
    const user = usuarios.find(u => u.id === cell);
    return user ? user.username : <span className="text-muted">Sistema</span>;
  }

  const columns = [
    { dataField: "mensaje_alerta", text: "Mensaje Alerta", sort: true },
    { dataField: "tipo_gravedad", text: "Gravedad", sort: true, formatter: gravityFormatter },
    { dataField: "pantalla_destino", text: "Pantalla Destino", sort: true, formatter: deviceFormatter },
    { dataField: "usuario_emisor", text: "Emisor", sort: true, formatter: userFormatter },
    { dataField: "expira_at", text: "Expira", sort: true, formatter: val => val ? new Date(val).toLocaleString() : 'N/A' },
    { 
      dataField: "activo", 
      text: "Estado", 
      sort: true, 
      formatter: cell => <Badge color={cell ? "success" : "secondary"}>{cell ? "ACTIVO" : "INACTIVO"}</Badge> 
    },
    { 
      dataField: "id", text: "Acciones", 
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
          <div className="headline-2 mb-3">Pantallas FIDS: Mensajería Dinámica</div>
          {loading ? <Loader /> : (
            <ToolkitProvider keyField="id" data={data} columns={columns} search>
              {props => (
                <div>
                  <div className="d-flex align-items-center justify-content-end mb-3 pr-2">
                    {isSearchOpen && (
                      <Input
                        size="sm" className="mr-2" placeholder="Buscar mensaje..." autoFocus
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); props.searchProps.onSearch(e.target.value); }}
                        style={{ width: '200px' }}
                      />
                    )}
                    <a href="/#" className="ml-3" onClick={e => { e.preventDefault(); setIsSearchOpen(!isSearchOpen); }}><i className="eva eva-search" /></a>
                    <a href="/#" className="ml-3" onClick={handleExportExcel}><i className="eva eva-file-text" title="Exportar Excel" /></a>
                    <a href="/#" className="ml-3" onClick={handleExportPDF}><i className="eva eva-printer" title="Exportar PDF" /></a>
                    <a href="/#" className="ml-3" onClick={e => { e.preventDefault(); fetchRecords(); }}><i className="eva eva-refresh" /></a>
                    <a href="/#" className="ml-3" onClick={e => { e.preventDefault(); setEditData(null); setModalOpen(true); }}><i className="eva eva-plus" /></a>
                  </div>
                  <BootstrapTable { ...props.baseProps } bordered={false} classes="table-hover table-striped" noDataIndication="No hay mensajes activos" />
                </div>
              )}
            </ToolkitProvider>
          )}
        </Widget>
      </Col>

      <Modal isOpen={modalOpen} toggle={() => setModalOpen(!modalOpen)} size="lg">
        <form onSubmit={handleSubmit}>
          <ModalHeader>{editData ? 'Editar' : 'Registrar'} Mensaje FIDS</ModalHeader>
          <ModalBody>
            <FormGroup>
              <Label>Mensaje alerta</Label>
              <Input type="textarea" name="mensaje_alerta" defaultValue={editData?.mensaje_alerta} placeholder="Contenido de la alerta..." required style={{ minHeight: '100px' }} />
            </FormGroup>
            <Row>
              <Col md={6}>
                <FormGroup><Label>Tipo gravedad</Label>
                  <Input type="select" name="tipo_gravedad" defaultValue={editData?.tipo_gravedad || 'INFORMATIVO'}>
                    <option value="INFORMATIVO">Informativo</option>
                    <option value="URGENTE">Urgente</option>
                  </Input></FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup><Label>Pantalla destino</Label>
                  <Input type="select" name="pantalla_destino" defaultValue={editData?.pantalla_destino} required>
                    <option value="">Seleccione pantalla...</option>
                    {dispositivos.map(d => <option key={d.id} value={d.id}>{d.codigo_pantalla} ({d.direccion_ip})</option>)}
                  </Input></FormGroup>
              </Col>
            </Row>
            <Row>
              <Col md={6}><FormGroup><Label>Usuario emisor</Label><Input type="select" name="usuario_emisor" defaultValue={editData?.usuario_emisor} required><option value="">Seleccione...</option>{usuarios.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}</Input></FormGroup></Col>
              <Col md={6}><FormGroup><Label>Expira at</Label><Input type="datetime-local" name="expira_at" defaultValue={formatDateTimeForInput(editData?.expira_at)} required /></FormGroup></Col>
            </Row>
            <FormGroup check className="ml-1"><Label check><Input type="checkbox" name="activo" defaultChecked={editData ? editData.activo : true} /> Alerta Activa</Label></FormGroup>
          </ModalBody>
          <ModalFooter><Button color="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button><Button color="primary" type="submit">Guardar Cambios</Button></ModalFooter>
        </form>
      </Modal>
    </Row>
  );
};

export default MensajeriaDinamicaPage;