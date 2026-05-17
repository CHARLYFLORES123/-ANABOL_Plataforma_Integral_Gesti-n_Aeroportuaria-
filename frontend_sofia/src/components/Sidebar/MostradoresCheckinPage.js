import React, { useState, useEffect } from "react";
import { Row, Col, Button, Modal, ModalHeader, ModalBody, ModalFooter, FormGroup, Label, Input, Badge } from "reactstrap";
import BootstrapTable from "react-bootstrap-table-next";
import ToolkitProvider from 'react-bootstrap-table2-toolkit/dist/react-bootstrap-table2-toolkit';
import Swal from 'sweetalert2';
import Widget from "../../components/Widget/Widget.js";
import Loader from "../../components/Loader/Loader";
import axios from "axios";
import 'react-bootstrap-table-next/dist/react-bootstrap-table2.min.css';

const MostradoresCheckinPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [aerolineas, setAerolineas] = useState([]);
  const [vuelos, setVuelos] = useState([]);

  // Endpoint unificado según la configuración de tu urls.py
  const endpoint = "recursos-rms/mostradores/";

  useEffect(() => {
    fetchRecords();
    fetchDependencies();
  }, []);

  const fetchRecords = () => {
    setLoading(true);
    axios.get(endpoint)
      .then(res => setData(Array.isArray(res.data) ? res.data : res.data.results || []))
      .catch(() => Swal.fire('Error', 'No se pudieron cargar los mostradores', 'error'))
      .finally(() => setLoading(false));
  };

  const fetchDependencies = async () => {
    try {
      const [resAero, resVuelos] = await Promise.all([
        axios.get("seguridad/aerolineas/"),
        axios.get("vuelos/operaciones/")
      ]);
      setAerolineas(resAero.data.results || resAero.data);
      setVuelos(resVuelos.data.results || resVuelos.data);
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
      link.setAttribute('download', 'mostradores_checkin.csv');
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
      link.setAttribute('download', 'reporte_mostradores.pdf');
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

    // Limpiar campos nulos para integridad en el backend
    if (!payload.aerolinea_empresa) payload.aerolinea_empresa = null;
    if (!payload.vuelo_diario) payload.vuelo_diario = null;
    if (!payload.hora_apertura) payload.hora_apertura = null;
    if (!payload.hora_cierre) payload.hora_cierre = null;

    try {
      if (editData) await axios.put(`${endpoint}${editData.id}/`, payload);
      else await axios.post(endpoint, payload);
      
      Swal.fire('Éxito', 'Mostrador guardado correctamente', 'success');
      fetchRecords();
      setModalOpen(false);
    } catch (error) {
      Swal.fire('Error', 'No se pudo procesar la solicitud', 'error');
    }
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: '¿Eliminar mostrador?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      confirmButtonColor: '#fd5f00'
    }).then((result) => {
      if (result.isConfirmed) {
        axios.delete(`${endpoint}${id}/`).then(() => {
          fetchRecords();
          Swal.fire('Eliminado', 'El registro ha sido removido.', 'success');
        }).catch(() => Swal.fire('Error', 'No se pudo eliminar', 'error'));
      }
    });
  };

  const columns = [
    { dataField: "numero_mostrador", text: "# Mostrador", sort: true, headerAlign: 'center', align: 'center' },
    { dataField: "aerolinea_nombre", text: "Aerolínea", sort: true, formatter: val => val || <span className="text-muted">Libre/Multiaerolínea</span> },
    { dataField: "vuelo_numero", text: "Vuelo", sort: true, formatter: val => val || <span className="text-muted">N/A</span> },
    { 
      dataField: "estado", 
      text: "Estado", 
      formatter: c => <Badge color={c === 'ACTIVO' ? 'success' : 'secondary'}>{c}</Badge> 
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
          <div className="headline-2 mb-3">Recursos RMS: Mostradores de Check-in</div>
          {loading ? <Loader /> : (
            <ToolkitProvider keyField="id" data={data} columns={columns} search>
              {props => (
                <div>
                  <div className="d-flex align-items-center justify-content-end mb-3 pr-2">
                    {isSearchOpen && (
                      <Input
                        size="sm" className="mr-2" placeholder="Buscar..." autoFocus
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
                  <BootstrapTable { ...props.baseProps } bordered={false} classes="table-hover table-striped" noDataIndication="No hay mostradores configurados" />
                </div>
              )}
            </ToolkitProvider>
          )}
        </Widget>
      </Col>

      <Modal isOpen={modalOpen} toggle={() => setModalOpen(!modalOpen)}>
        <form onSubmit={handleSubmit}>
          <ModalHeader>{editData ? 'Editar' : 'Registrar'} Mostrador de Check-in</ModalHeader>
          <ModalBody>
            <FormGroup>
              <Label>Número de Mostrador (ID Visual)</Label>
              <Input name="numero_mostrador" defaultValue={editData?.numero_mostrador} placeholder="Ej: 01" required />
            </FormGroup>
            <FormGroup>
              <Label>Aerolínea Asignada</Label>
              <Input type="select" name="aerolinea_empresa" defaultValue={editData?.aerolinea_empresa || ""}>
                <option value="">Uso General / Compartido</option>
                {aerolineas.map(a => <option key={a.id} value={a.id}>{a.razon_social}</option>)}
              </Input>
            </FormGroup>
            <FormGroup>
              <Label>Vuelo Operando (Opcional)</Label>
              <Input type="select" name="vuelo_diario" defaultValue={editData?.vuelo_diario || ""}>
                <option value="">Ninguno</option>
                {vuelos.map(v => <option key={v.id} value={v.id}>{v.numero_vuelo} - {v.fecha_operacion}</option>)}
              </Input>
            </FormGroup>
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label>Hora Apertura</Label>
                  <Input type="datetime-local" name="hora_apertura" defaultValue={formatDateTimeForInput(editData?.hora_apertura)} />
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label>Hora Cierre</Label>
                  <Input type="datetime-local" name="hora_cierre" defaultValue={formatDateTimeForInput(editData?.hora_cierre)} />
                </FormGroup>
              </Col>
            </Row>
            <FormGroup>
              <Label>Estado del Recurso</Label>
              <Input type="select" name="estado" defaultValue={editData?.estado || 'CERRADO'}>
                <option value="ACTIVO">ACTIVO (Abierto al público)</option>
                <option value="CERRADO">CERRADO</option>
              </Input>
            </FormGroup>
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button color="primary" type="submit">Guardar Cambios</Button>
          </ModalFooter>
        </form>
      </Modal>
    </Row>
  );
};

export default MostradoresCheckinPage;
