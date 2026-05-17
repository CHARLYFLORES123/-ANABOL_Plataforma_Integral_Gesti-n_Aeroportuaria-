import React, { useState, useEffect } from "react";
import { Row, Col, Button, Modal, ModalHeader, ModalBody, ModalFooter, FormGroup, Label, Input, Badge } from "reactstrap";
import BootstrapTable from "react-bootstrap-table-next";
import ToolkitProvider from 'react-bootstrap-table2-toolkit/dist/react-bootstrap-table2-toolkit';
import Swal from 'sweetalert2';
import Widget from "../../components/Widget/Widget.js";
import Loader from "../../components/Loader/Loader";
import axios from "axios";
import 'react-bootstrap-table-next/dist/react-bootstrap-table2.min.css';

const ManifiestoPasajerosPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [vuelos, setVuelos] = useState([]);

  const endpoint = "vuelos/manifiestos/";

  useEffect(() => {
    fetchRecords();
    fetchDependencies();
  }, []);

  const fetchRecords = () => {
    setLoading(true);
    axios.get(endpoint)
      .then(res => setData(Array.isArray(res.data) ? res.data : res.data.results || []))
      .catch(() => Swal.fire('Error', 'No se pudieron cargar los manifiestos', 'error'))
      .finally(() => setLoading(false));
  };

  const fetchDependencies = async () => {
    try {
      const resVuelos = await axios.get("vuelos/operaciones/");
      setVuelos(resVuelos.data.results || resVuelos.data);
    } catch (error) {
      console.error("Error cargando dependencias", error);
    }
  };

  const handleExportExcel = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.get(`${endpoint}export/excel/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'manifiesto_pasajeros.csv');
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
      link.setAttribute('download', 'reporte_manifiesto.pdf');
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

    // Solución al problema de campo deshabilitado al editar
    if (editData && !payload.vuelo_diario) {
      payload.vuelo_diario = editData.vuelo_diario;
    }

    // Convertir campos numéricos de string a Int/Float
    const numFields = ['total_pax', 'pax_ejecutivo', 'pax_turista', 'pax_conexion', 'pax_silla_ruedas', 'infantes_menores', 'peso_equipaje_total_kg', 'peso_carga_total_kg'];
    numFields.forEach(field => {
      payload[field] = payload[field] ? (field.includes('peso') ? parseFloat(payload[field]) : parseInt(payload[field])) : 0;
    });

    try {
      if (editData) await axios.put(`${endpoint}${editData.id}/`, payload);
      else await axios.post(endpoint, payload);
      
      Swal.fire('Éxito', 'Manifiesto guardado correctamente', 'success');
      fetchRecords();
      setModalOpen(false);
    } catch (error) {
      const msg = error.response?.data ? JSON.stringify(error.response.data) : "Error al guardar";
      Swal.fire('Error', msg, 'error');
    }
  };

  const columns = [
    { dataField: "vuelo_numero", text: "Vuelo", sort: true },
    { dataField: "vuelo_fecha", text: "Fecha", sort: true },
    { dataField: "total_pax", text: "Total PAX", sort: true, headerAlign: 'center', align: 'center' },
    { dataField: "peso_equipaje_total_kg", text: "Equipaje (Kg)", sort: true },
    { dataField: "peso_carga_total_kg", text: "Carga (Kg)", sort: true },
    { 
      dataField: "id", text: "Acciones", 
      formatter: (cell, row) => (
        <div className="d-flex justify-content-center">
          <Button size="sm" color="info" className="mr-1" onClick={() => { setEditData(row); setModalOpen(true); }}>
            <i className="eva eva-edit-2" />
          </Button>
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
          <div className="headline-2 mb-3">Manifiesto de Pasajeros y Carga</div>
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
                  <BootstrapTable { ...props.baseProps } bordered={false} classes="table-hover table-striped" noDataIndication="No hay manifiestos registrados" />
                </div>
              )}
            </ToolkitProvider>
          )}
        </Widget>
      </Col>
      <Modal isOpen={modalOpen} toggle={() => setModalOpen(!modalOpen)} size="lg">
        <form onSubmit={handleSubmit}>
          <ModalHeader>{editData ? 'Editar' : 'Registrar'} Datos de Carga y Ocupación</ModalHeader>
          <ModalBody>
            <Row>
              <Col md={12}><FormGroup><Label>Vuelo Diario</Label>
                <Input type="select" name="vuelo_diario" defaultValue={editData?.vuelo_diario} required disabled={!!editData}>
                  <option value="">Seleccione vuelo...</option>
                  {vuelos.map(v => <option key={v.id} value={v.id}>{v.numero_vuelo} - {v.fecha_operacion} ({v.tipo_operacion})</option>)}
                </Input>
              </FormGroup></Col>
            </Row>
            <hr />
            <h6 className="mb-3">Desglose de Pasajeros</h6>
            <Row>
              <Col md={3}><FormGroup><Label>Total PAX</Label><Input type="number" name="total_pax" defaultValue={editData?.total_pax || 0} required /></FormGroup></Col>
              <Col md={3}><FormGroup><Label>Ejecutivo</Label><Input type="number" name="pax_ejecutivo" defaultValue={editData?.pax_ejecutivo || 0} /></FormGroup></Col>
              <Col md={3}><FormGroup><Label>Turista</Label><Input type="number" name="pax_turista" defaultValue={editData?.pax_turista || 0} /></FormGroup></Col>
              <Col md={3}><FormGroup><Label>Infantes</Label><Input type="number" name="infantes_menores" defaultValue={editData?.infantes_menores || 0} /></FormGroup></Col>
            </Row>
            <Row>
              <Col md={6}><FormGroup><Label>Pasajeros en Conexión</Label><Input type="number" name="pax_conexion" defaultValue={editData?.pax_conexion || 0} /></FormGroup></Col>
              <Col md={6}><FormGroup><Label>Sillas de Ruedas</Label><Input type="number" name="pax_silla_ruedas" defaultValue={editData?.pax_silla_ruedas || 0} /></FormGroup></Col>
            </Row>
            <hr />
            <h6 className="mb-3">Pesos Totales</h6>
            <Row>
              <Col md={6}><FormGroup><Label>Equipaje Total (Kg)</Label><Input type="number" step="0.01" name="peso_equipaje_total_kg" defaultValue={editData?.peso_equipaje_total_kg || 0} /></FormGroup></Col>
              <Col md={6}><FormGroup><Label>Carga / Correo (Kg)</Label><Input type="number" step="0.01" name="peso_carga_total_kg" defaultValue={editData?.peso_carga_total_kg || 0} /></FormGroup></Col>
            </Row>
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button color="primary" type="submit">Guardar Manifiesto</Button>
          </ModalFooter>
        </form>
      </Modal>
    </Row>
  );
};

export default ManifiestoPasajerosPage;
