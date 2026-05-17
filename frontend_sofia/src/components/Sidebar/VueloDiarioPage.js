import React, { useState, useEffect } from "react";
import { Row, Col, Button, Modal, ModalHeader, ModalBody, ModalFooter, FormGroup, Label, Input, Badge } from "reactstrap";
import BootstrapTable from "react-bootstrap-table-next";
import ToolkitProvider from 'react-bootstrap-table2-toolkit/dist/react-bootstrap-table2-toolkit';
import Swal from 'sweetalert2';
import Widget from "../../components/Widget/Widget.js";
import Loader from "../../components/Loader/Loader";
import axios from "axios";
import 'react-bootstrap-table-next/dist/react-bootstrap-table2.min.css';

const VueloDiarioPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [aerolineas, setAerolineas] = useState([]);
  const [aeronaves, setAeronaves] = useState([]);
  const [aeropuertos, setAeropuertos] = useState([]);
  const [planes, setPlanes] = useState([]);

  const endpoint = "vuelos/operaciones/";

  useEffect(() => {
    fetchRecords();
    fetchDependencies();
  }, []);

  const fetchRecords = () => {
    setLoading(true);
    axios.get(endpoint)
      .then(res => setData(Array.isArray(res.data) ? res.data : res.data.results || []))
      .catch(() => Swal.fire('Error', 'No se pudieron cargar las operaciones', 'error'))
      .finally(() => setLoading(false));
  };

  const fetchDependencies = async () => {
    try {
      const [resAero, resPlanes, resPorts, resSched] = await Promise.all([
        axios.get("seguridad/aerolineas/"),
        axios.get("config/aeronaves/"),
        axios.get("config/aeropuertos/"),
        axios.get("vuelos/planificacion/")
      ]);
      setAerolineas(resAero.data.results || resAero.data);
      setAeronaves(resPlanes.data.results || resPlanes.data);
      setAeropuertos(resPorts.data.results || resPorts.data);
      setPlanes(resSched.data.results || resSched.data);
    } catch (error) {
      console.error("Error cargando dependencias", error);
    }
  };

  const formatDateTimeForInput = (dateString) => {
    if (!dateString) return "";
    // Evitamos toISOString() porque convierte a UTC. Extraemos los componentes locales.
    const d = new Date(dateString.replace('Z', ''));
    if (isNaN(d.getTime())) return "";
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = Object.fromEntries(formData.entries());

    if (payload.aeropuerto_origen === payload.aeropuerto_destino) {
      Swal.fire('Validación', 'Origen y Destino no pueden ser iguales', 'warning');
      return;
    }

    // Limpiar campos vacíos para evitar errores de formato en el backend
    ['vuelo_planificado', 'etd', 'atd', 'eta', 'ata'].forEach(f => { if (!payload[f]) payload[f] = null; });

    try {
      if (editData) await axios.put(`${endpoint}${editData.id}/`, payload);
      else await axios.post(endpoint, payload);
      Swal.fire('Éxito', 'Registro guardado', 'success');
      fetchRecords();
      setModalOpen(false);
    } catch (error) {
      Swal.fire('Error', 'No se pudo guardar la operación', 'error');
    }
  };

  const handleExportCSV = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.get(`${endpoint}export/excel/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'operaciones_vuelo.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error exportando operaciones:", error);
    }
  };

  const handleExportPDF = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.get(`${endpoint}export/pdf/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'reporte_operaciones.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error exportando PDF:", error);
    }
  };

  const columns = [
    { dataField: "numero_vuelo", text: "Vuelo", sort: true },
    { dataField: "aerolinea_nombre", text: "Aerolínea", sort: true },
    { dataField: "aeropuerto_origen_nombre", text: "Origen", sort: true },
    { dataField: "aeropuerto_destino_nombre", text: "Destino", sort: true },
    { dataField: "tipo_operacion", text: "Tipo", formatter: c => <Badge color={c === 'SALIDA' ? 'warning' : 'primary'}>{c}</Badge> },
    { dataField: "estado", text: "Estado", formatter: c => <Badge color="info">{c.replace('_', ' ')}</Badge> },
    { dataField: "fecha_operacion", text: "Fecha", sort: true },
    { 
      dataField: "id", text: "Acciones", 
      formatter: (cell, row) => (
        <div className="d-flex justify-content-center">
          <Button size="sm" color="info" className="mr-1" onClick={() => { setEditData(row); setModalOpen(true); }}><i className="eva eva-edit-2" /></Button>
          <Button size="sm" color="danger" onClick={() => {
            Swal.fire({ title: '¿Eliminar?', icon: 'warning', showCancelButton: true }).then(r => {
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
          <div className="headline-2 mb-3">Operaciones del Día (AODB Live)</div>
          {loading ? <Loader /> : (
            <ToolkitProvider keyField="id" data={data} columns={columns} search>
              {props => (
                <div>
                  <div className="d-flex align-items-center justify-content-end mb-3 pr-2">
                    {isSearchOpen && <Input size="sm" className="mr-2" placeholder="Buscar..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); props.searchProps.onSearch(e.target.value); }} style={{ width: '200px' }} />}
                    <a href="/#" className="ml-3" onClick={e => { e.preventDefault(); setIsSearchOpen(!isSearchOpen); }}><i className="eva eva-search" /></a>
                    <a href="/#" className="ml-3" onClick={handleExportCSV}><i className="eva eva-file-text" title="Exportar CSV" /></a>
                    <a href="/#" className="ml-3" onClick={handleExportPDF}><i className="eva eva-printer" title="Exportar PDF" /></a>
                    <a href="/#" className="ml-3" onClick={e => { e.preventDefault(); fetchRecords(); }}><i className="eva eva-refresh" /></a>
                    <a href="/#" className="ml-3" onClick={e => { e.preventDefault(); setEditData(null); setModalOpen(true); }}><i className="eva eva-plus" /></a>
                  </div>
                  <BootstrapTable { ...props.baseProps } bordered={false} classes="table-hover table-striped" noDataIndication="No hay vuelos para hoy" />
                </div>
              )}
            </ToolkitProvider>
          )}
        </Widget>
      </Col>
      <Modal isOpen={modalOpen} toggle={() => setModalOpen(!modalOpen)} size="xl">
        <form onSubmit={handleSubmit}>
          <ModalHeader>{editData ? 'Actualizar' : 'Registrar'} Operación</ModalHeader>
          <ModalBody>
            <Row>
              <Col md={4}><FormGroup><Label>Plan Relacionado</Label><Input type="select" name="vuelo_planificado" defaultValue={editData?.vuelo_planificado}>
                <option value="">Ninguno</option>
                {planes.map(p => <option key={p.id} value={p.id}>{p.numero_vuelo} - {p.aerolinea_nombre}</option>)}
              </Input></FormGroup></Col>
              <Col md={4}><FormGroup><Label>Aerolínea</Label><Input type="select" name="aerolinea_empresa" defaultValue={editData?.aerolinea_empresa} required>
                <option value="">Seleccione...</option>
                {aerolineas.map(a => <option key={a.id} value={a.id}>{a.razon_social}</option>)}
              </Input></FormGroup></Col>
              <Col md={4}><FormGroup><Label>Aeronave</Label><Input type="select" name="aeronave" defaultValue={editData?.aeronave} required>
                <option value="">Seleccione...</option>
                {aeronaves.map(a => <option key={a.id} value={a.id}>{a.modelo}</option>)}
              </Input></FormGroup></Col>
            </Row>
            <Row>
              <Col md={3}><FormGroup><Label>Vuelo #</Label><Input name="numero_vuelo" defaultValue={editData?.numero_vuelo} required /></FormGroup></Col>
              <Col md={3}><FormGroup><Label>Tipo</Label><Input type="select" name="tipo_operacion" defaultValue={editData?.tipo_operacion || 'SALIDA'}>
                <option value="SALIDA">Salida</option><option value="LLEGADA">Llegada</option>
              </Input></FormGroup></Col>
              <Col md={3}><FormGroup><Label>Estado</Label><Input type="select" name="estado" defaultValue={editData?.estado || 'A_TIEMPO'}>
                <option value="A_TIEMPO">A Tiempo</option><option value="DEMORADO">Demorado</option>
                <option value="CANCELADO">Cancelado</option><option value="LANDED">Aterrizado</option>
                <option value="BOARDING">Embarcando</option><option value="DEPARTED">Despegado</option>
              </Input></FormGroup></Col>
              <Col md={3}><FormGroup><Label>Fecha Op.</Label><Input type="date" name="fecha_operacion" defaultValue={editData?.fecha_operacion} required /></FormGroup></Col>
            </Row>
            <Row>
              <Col md={6}><FormGroup><Label>Origen</Label><Input type="select" name="aeropuerto_origen" defaultValue={editData?.aeropuerto_origen} required>
                {aeropuertos.map(a => <option key={a.id} value={a.id}>{a.codigo_iata} - {a.nombre_completo}</option>)}
              </Input></FormGroup></Col>
              <Col md={6}><FormGroup><Label>Destino</Label><Input type="select" name="aeropuerto_destino" defaultValue={editData?.aeropuerto_destino} required>
                {aeropuertos.map(a => <option key={a.id} value={a.id}>{a.codigo_iata} - {a.nombre_completo}</option>)}
              </Input></FormGroup></Col>
            </Row>
            <hr />
            <Row>
              <Col md={6}>
                <h6>Tiempos de Salida</h6>
                <FormGroup><Label>STD (Prog.)</Label><Input type="datetime-local" name="std" defaultValue={formatDateTimeForInput(editData?.std)} required /></FormGroup>
                <FormGroup><Label>ETD (Est.)</Label><Input type="datetime-local" name="etd" defaultValue={formatDateTimeForInput(editData?.etd)} /></FormGroup>
                <FormGroup><Label>ATD (Real)</Label><Input type="datetime-local" name="atd" defaultValue={formatDateTimeForInput(editData?.atd)} /></FormGroup>
              </Col>
              <Col md={6}>
                <h6>Tiempos de Llegada</h6>
                <FormGroup><Label>STA (Prog.)</Label><Input type="datetime-local" name="sta" defaultValue={formatDateTimeForInput(editData?.sta)} required /></FormGroup>
                <FormGroup><Label>ETA (Est.)</Label><Input type="datetime-local" name="eta" defaultValue={formatDateTimeForInput(editData?.eta)} /></FormGroup>
                <FormGroup><Label>ATA (Real)</Label><Input type="datetime-local" name="ata" defaultValue={formatDateTimeForInput(editData?.ata)} /></FormGroup>
              </Col>
            </Row>
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" onClick={() => setModalOpen(false)}>Cerrar</Button>
            <Button color="primary" type="submit">Guardar Cambios</Button>
          </ModalFooter>
        </form>
      </Modal>
    </Row>
  );
};

export default VueloDiarioPage;
