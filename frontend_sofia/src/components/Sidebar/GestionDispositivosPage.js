import React, { useState, useEffect } from "react";
import { Row, Col, Button, Modal, ModalHeader, ModalBody, ModalFooter, FormGroup, Label, Input, Badge } from "reactstrap";
import BootstrapTable from "react-bootstrap-table-next";
import ToolkitProvider from 'react-bootstrap-table2-toolkit/dist/react-bootstrap-table2-toolkit';
import Swal from 'sweetalert2';
import Widget from "../../components/Widget/Widget.js";
import Loader from "../../components/Loader/Loader";
import axios from "axios";
import 'react-bootstrap-table-next/dist/react-bootstrap-table2.min.css';

const GestionDispositivosPage = () => {
  const [data, setData] = useState([]);
  const [zonas, setZonas] = useState([]);
  const [plantillas, setPlantillas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const endpoint = "fids/dispositivos/";

  useEffect(() => {
    fetchRecords();
    fetchDependencies();
  }, []);

  const fetchRecords = () => {
    setLoading(true);
    axios.get(endpoint)
      .then(res => setData(Array.isArray(res.data) ? res.data : res.data.results || []))
      .catch(() => Swal.fire('Error', 'No se pudieron cargar los dispositivos', 'error'))
      .finally(() => setLoading(false));
  };

  const fetchDependencies = () => {
    axios.get("fids/plantillas/")
      .then(res => setPlantillas(Array.isArray(res.data) ? res.data : res.data.results || []))
      .catch(err => console.error("Error cargando plantillas:", err));

    axios.get("fids/zonas/")
      .then(res => setZonas(Array.isArray(res.data) ? res.data : res.data.results || []))
      .catch(err => console.error("Error cargando zonas:", err));
  };

  const handleExportExcel = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.get(`${endpoint}export/excel/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'dispositivos_fids.csv');
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
      link.setAttribute('download', 'reporte_dispositivos_fids.pdf');
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

    try {
      if (editData) await axios.put(`${endpoint}${editData.id}/`, payload);
      else await axios.post(endpoint, payload);
      
      Swal.fire('Éxito', 'Dispositivo guardado correctamente', 'success');
      fetchRecords();
      setModalOpen(false);
    } catch (error) {
      const msg = error.response?.data ? JSON.stringify(error.response.data) : "Error al guardar";
      Swal.fire('Error', msg, 'error');
    }
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: '¿Eliminar dispositivo?',
      text: "Esta acción no se puede deshacer",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      confirmButtonColor: '#fd5f00'
    }).then((result) => {
      if (result.isConfirmed) {
        axios.delete(`${endpoint}${id}/`).then(() => {
          fetchRecords();
          Swal.fire('Eliminado', 'El dispositivo ha sido removido.', 'success');
        }).catch(() => Swal.fire('Error', 'No se pudo eliminar el dispositivo', 'error'));
      }
    });
  };

  const statusFormatter = (cell) => {
    let color = "secondary";
    let label = cell;
    switch (cell) {
      case "ONLINE": color = "success"; label = "En línea"; break;
      case "OFFLINE": color = "danger"; label = "Fuera de linea"; break;
      case "MANTENIMIENTO": color = "warning"; label = "Mantenimiento"; break;
      default: color = "info"; label = cell;
    }
    return <Badge color={color}>{label}</Badge>;
  };

  const zonaFormatter = (cell) => {
    const zona = zonas.find(z => z.id === cell);
    return zona ? zona.nombre_zona : "Desconocida";
  };

  const columns = [
    { dataField: "codigo_pantalla", text: "Código Pantalla", sort: true },
    { dataField: "direccion_ip", text: "Dirección IP", sort: true },
    { dataField: "zona_fids", text: "Zona FIDS", sort: true, formatter: zonaFormatter },
    { dataField: "estado_conexion", text: "Estado", sort: true, formatter: statusFormatter },
    { dataField: "plantilla_nombre", text: "Plantilla", sort: true, formatter: val => val || <span className="text-muted">Sin asignar</span> },
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
          <div className="headline-2 mb-3">Pantallas FIDS: Gestión de Dispositivos</div>
          {loading ? <Loader /> : (
            <ToolkitProvider keyField="id" data={data} columns={columns} search>
              {props => (
                <div>
                  <div className="d-flex align-items-center justify-content-end mb-3 pr-2">
                    {isSearchOpen && (
                      <Input
                        size="sm" className="mr-2" placeholder="Buscar dispositivo..." autoFocus
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
                  <BootstrapTable { ...props.baseProps } bordered={false} classes="table-hover table-striped" noDataIndication="No hay dispositivos registrados" />
                </div>
              )}
            </ToolkitProvider>
          )}
        </Widget>
      </Col>

      <Modal isOpen={modalOpen} toggle={() => setModalOpen(!modalOpen)} size="lg">
        <form onSubmit={handleSubmit}>
          <ModalHeader>{editData ? 'Editar' : 'Registrar'} Dispositivo FIDS</ModalHeader>
          <ModalBody>
            <FormGroup>
              <Label>Código de Pantalla</Label>
              <Input name="codigo_pantalla" defaultValue={editData?.codigo_pantalla} placeholder="Ej: PANT-01" required />
            </FormGroup>
            <Row>
              <Col md={6}><FormGroup><Label>Dirección IP</Label><Input name="direccion_ip" defaultValue={editData?.direccion_ip} placeholder="192.168.x.x" required /></FormGroup></Col>
              <Col md={6}>
                <FormGroup>
                  <Label>Zona FIDS</Label>
                  <Input type="select" name="zona_fids" defaultValue={editData?.zona_fids} required>
                    <option value="">Seleccione zona...</option>
                    {zonas.map(z => (
                      <option key={z.id} value={z.id}>{z.nombre_zona}</option>
                    ))}
                  </Input>
                </FormGroup>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label>Estado de Conexión</Label>
                  <Input type="select" name="estado_conexion" defaultValue={editData?.estado_conexion || 'OFFLINE'}>
                    <option value="ONLINE">En línea</option>
                    <option value="OFFLINE">Fuera de linea</option>
                  </Input>
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label>Plantilla Asignada</Label>
                  <Input type="select" name="plantilla" defaultValue={editData?.plantilla} required>
                    <option value="">Seleccione plantilla...</option>
                    {plantillas.map(p => <option key={p.id} value={p.id}>{p.nombre_plantilla}</option>)}
                  </Input>
                </FormGroup>
              </Col>
            </Row>
          </ModalBody>
          <ModalFooter><Button color="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button><Button color="primary" type="submit">Guardar Cambios</Button></ModalFooter>
        </form>
      </Modal>
    </Row>
  );
};

export default GestionDispositivosPage;