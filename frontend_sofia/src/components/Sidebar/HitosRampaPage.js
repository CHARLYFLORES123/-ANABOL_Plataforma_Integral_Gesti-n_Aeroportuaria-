import React, { useState, useEffect } from "react";
import { Row, Col, Button, Modal, ModalHeader, ModalBody, ModalFooter, FormGroup, Label, Input, Badge } from "reactstrap";
import BootstrapTable from "react-bootstrap-table-next";
import ToolkitProvider from 'react-bootstrap-table2-toolkit/dist/react-bootstrap-table2-toolkit';
import Swal from 'sweetalert2';
import Widget from "../../components/Widget/Widget.js";
import Loader from "../../components/Loader/Loader";
import axios from "axios";
import 'react-bootstrap-table-next/dist/react-bootstrap-table2.min.css';

const HitosRampaPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [vuelos, setVuelos] = useState([]);
  const [operadores, setOperadores] = useState([]);

  const endpoint = "vuelos/hitos/";

  useEffect(() => {
    fetchRecords();
    fetchDependencies();
  }, []);

  const fetchRecords = () => {
    setLoading(true);
    axios.get(endpoint)
      .then(res => setData(Array.isArray(res.data) ? res.data : res.data.results || []))
      .catch(() => Swal.fire('Error', 'No se pudieron cargar los hitos', 'error'))
      .finally(() => setLoading(false));
  };

  const fetchDependencies = async () => {
    try {
      const [resVuelos, resUsers] = await Promise.all([
        axios.get("vuelos/operaciones/"),
        axios.get("users/")
      ]);
      setVuelos(resVuelos.data.results || resVuelos.data);
      setOperadores(resUsers.data.results || resUsers.data);
    } catch (error) {
      console.error("Error cargando dependencias", error);
    }
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
      link.setAttribute('download', 'hitos_rampa.csv');
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
      link.setAttribute('download', 'reporte_hitos_rampa.pdf');
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

    // Si estamos editando, el campo 'vuelo_diario' está deshabilitado y no viene en formData.
    // Debemos incluirlo manualmente desde editData.
    if (editData && !payload.vuelo_diario) {
      payload.vuelo_diario = editData.vuelo_diario;
    }

    // Limpiar campos de fecha vacíos para evitar errores de formato
    const timeFields = ['catering_inicio', 'catering_fin', 'combustible_inicio', 'combustible_fin', 'maletas_inicio', 'maletas_fin', 'pushback_realizado'];
    timeFields.forEach(field => { if (!payload[field]) payload[field] = null; });

    try {
      if (editData) await axios.put(`${endpoint}${editData.id}/`, payload);
      else await axios.post(endpoint, payload);
      
      Swal.fire('Éxito', 'Hitos de rampa actualizados', 'success');
      fetchRecords();
      setModalOpen(false);
    } catch (error) {
      const msg = error.response?.data ? JSON.stringify(error.response.data) : "Error al guardar";
      Swal.fire('Error', msg, 'error');
    }
  };

  const columns = [
    { dataField: "vuelo_numero", text: "Vuelo", sort: true },
    { dataField: "operador_nombre", text: "Operador", sort: true },
    { 
      dataField: "pushback_realizado", 
      text: "Pushback", 
      formatter: val => val ? new Date(val).toLocaleTimeString() : <Badge color="secondary">Pendiente</Badge> 
    },
    { 
      dataField: "id", text: "Acciones", 
      formatter: (cell, row) => (
        <div className="d-flex justify-content-center">
          <Button size="sm" color="info" className="mr-1" onClick={() => { setEditData(row); setModalOpen(true); }}><i className="eva eva-edit-2" /></Button>
          <Button size="sm" color="danger" onClick={() => {
            Swal.fire({ title: '¿Eliminar registro?', icon: 'warning', showCancelButton: true }).then(r => {
              if (r.isConfirmed) axios.delete(`${endpoint}${row.id}/`).then(() => { fetchRecords(); Swal.fire('Eliminado', '', 'success'); });
            });
          }}><i className="eva eva-trash-2" /></Button>
        </div>
      )
    }
  ];

  return (
    <Row className="mb-4">
      <Col xs={12}>
        <Widget className="widget-p-md">
          <div className="headline-2 mb-3">Gestión de Hitos de Rampa</div>
          {loading ? <Loader /> : (
            <ToolkitProvider keyField="id" data={data} columns={columns} search>
              {props => (
                <div>
                  <div className="d-flex align-items-center justify-content-end mb-3 pr-2">
                    {isSearchOpen && <Input size="sm" className="mr-2" placeholder="Buscar..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); props.searchProps.onSearch(e.target.value); }} style={{ width: '200px' }} />}
                    <a href="/#" className="ml-3" onClick={e => { e.preventDefault(); setIsSearchOpen(!isSearchOpen); }}><i className="eva eva-search" /></a>
                    <a href="/#" className="ml-3" onClick={handleExportExcel}><i className="eva eva-file-text" title="Exportar Excel" /></a>
                    <a href="/#" className="ml-3" onClick={handleExportPDF}><i className="eva eva-printer" title="Exportar PDF" /></a>
                    <a href="/#" className="ml-3" onClick={e => { e.preventDefault(); fetchRecords(); }}><i className="eva eva-refresh" /></a>
                    <a href="/#" className="ml-3" onClick={e => { e.preventDefault(); setEditData(null); setModalOpen(true); }}><i className="eva eva-plus" /></a>
                  </div>
                  <BootstrapTable { ...props.baseProps } bordered={false} classes="table-hover table-striped" noDataIndication="No hay hitos registrados" />
                </div>
              )}
            </ToolkitProvider>
          )}
        </Widget>
      </Col>
      <Modal isOpen={modalOpen} toggle={() => setModalOpen(!modalOpen)} size="lg">
        <form onSubmit={handleSubmit}>
          <ModalHeader>{editData ? 'Editar' : 'Registrar'} Tiempos de Rampa</ModalHeader>
          <ModalBody>
            <Row>
              <Col md={6}><FormGroup><Label>Vuelo Diario</Label>
                <Input type="select" name="vuelo_diario" defaultValue={editData?.vuelo_diario} required disabled={!!editData}>
                  <option value="">Seleccione vuelo...</option>
                  {vuelos.map(v => <option key={v.id} value={v.id}>{v.numero_vuelo} - {v.fecha_operacion}</option>)}
                </Input>
              </FormGroup></Col>
              <Col md={6}><FormGroup><Label>Operador Responsable</Label>
                <Input type="select" name="operador_rampa" defaultValue={editData?.operador_rampa}>
                  <option value="">Seleccione operador...</option>
                  {operadores.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                </Input>
              </FormGroup></Col>
            </Row>
            <hr />
            <Row>
              <Col md={6}>
                <h6>Catering</h6>
                <FormGroup><Label>Inicio</Label><Input type="datetime-local" name="catering_inicio" defaultValue={formatDateTimeForInput(editData?.catering_inicio)} /></FormGroup>
                <FormGroup><Label>Fin</Label><Input type="datetime-local" name="catering_fin" defaultValue={formatDateTimeForInput(editData?.catering_fin)} /></FormGroup>
              </Col>
              <Col md={6}>
                <h6>Combustible</h6>
                <FormGroup><Label>Inicio</Label><Input type="datetime-local" name="combustible_inicio" defaultValue={formatDateTimeForInput(editData?.combustible_inicio)} /></FormGroup>
                <FormGroup><Label>Fin</Label><Input type="datetime-local" name="combustible_fin" defaultValue={formatDateTimeForInput(editData?.combustible_fin)} /></FormGroup>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <h6>Equipaje / Maletas</h6>
                <FormGroup><Label>Inicio</Label><Input type="datetime-local" name="maletas_inicio" defaultValue={formatDateTimeForInput(editData?.maletas_inicio)} /></FormGroup>
                <FormGroup><Label>Fin</Label><Input type="datetime-local" name="maletas_fin" defaultValue={formatDateTimeForInput(editData?.maletas_fin)} /></FormGroup>
              </Col>
              <Col md={6}>
                <h6>Finalización</h6>
                <FormGroup><Label>Pushback Realizado</Label><Input type="datetime-local" name="pushback_realizado" defaultValue={formatDateTimeForInput(editData?.pushback_realizado)} /></FormGroup>
              </Col>
            </Row>
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

export default HitosRampaPage;
