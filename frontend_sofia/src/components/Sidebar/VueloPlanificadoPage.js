import React, { useState, useEffect } from "react";
import { Row, Col, Button, Modal, ModalHeader, ModalBody, ModalFooter, FormGroup, Label, Input, Badge } from "reactstrap";
import BootstrapTable from "react-bootstrap-table-next";
import ToolkitProvider from 'react-bootstrap-table2-toolkit/dist/react-bootstrap-table2-toolkit';
import Swal from 'sweetalert2';
import Widget from "../../components/Widget/Widget.js";
import Loader from "../../components/Loader/Loader";
import axios from "axios";
import 'react-bootstrap-table-next/dist/react-bootstrap-table2.min.css';

const VueloPlanificadoPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Estados para las listas desplegables (Foreign Keys)
  const [aerolineas, setAerolineas] = useState([]);
  const [aeronaves, setAeronaves] = useState([]);
  const [aeropuertos, setAeropuertos] = useState([]);

  // Estado para los checkboxes de días de la semana
  const [selectedDays, setSelectedDays] = useState([]);

  const daysOfWeek = [
    { label: 'Lun', value: '1' },
    { label: 'Mar', value: '2' },
    { label: 'Mie', value: '3' },
    { label: 'Jue', value: '4' },
    { label: 'Vie', value: '5' },
    { label: 'Sab', value: '6' },
    { label: 'Dom', value: '7' },
  ];

  const endpoint = "vuelos/planificacion/";

  useEffect(() => {
    fetchRecords();
    fetchDependencies();
  }, []);

  // Sincronizar días seleccionados cuando se abre el modal para editar
  useEffect(() => {
    if (modalOpen) {
      if (editData && editData.dias_semana) {
        setSelectedDays(editData.dias_semana.split(","));
      } else {
        setSelectedDays([]);
      }
    }
  }, [modalOpen, editData]);

  const fetchRecords = () => {
    setLoading(true);
    axios.get(endpoint)
      .then(res => setData(Array.isArray(res.data) ? res.data : res.data.results || []))
      .catch(() => Swal.fire('Error', 'No se pudieron cargar los vuelos planificados', 'error'))
      .finally(() => setLoading(false));
  };

  const fetchDependencies = async () => {
    try {
      const [resAero, resPlanes, resPorts] = await Promise.all([
        axios.get("seguridad/aerolineas/"),
        axios.get("config/aeronaves/"),
        axios.get("config/aeropuertos/")
      ]);
      setAerolineas(resAero.data.results || resAero.data);
      setAeronaves(resPlanes.data.results || resPlanes.data);
      setAeropuertos(resPorts.data.results || resPorts.data);
    } catch (error) {
      console.error("Error cargando dependencias", error);
    }
  };

  const handleDayChange = (value) => {
    setSelectedDays(prev => 
      prev.includes(value) ? prev.filter(d => d !== value) : [...prev, value].sort()
    );
  };

  const toggleSearch = (e, onSearch) => {
    e.preventDefault();
    if (!isSearchOpen) setIsSearchOpen(true);
    else if (searchTerm.trim()) onSearch(searchTerm);
    else setIsSearchOpen(false);
  };

  const handleRefresh = (e, onSearch) => {
    e.preventDefault();
    setSearchTerm("");
    onSearch("");
    fetchRecords();
  };

  const handleExportExcel = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.get(`${endpoint}export/excel/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'planificacion_vuelos.csv');
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
      link.setAttribute('download', 'reporte_planificacion.pdf');
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
    
    payload.activo = formData.get("activo") === "on";
    // Convertimos el array de días en el string separado por comas que espera el backend
    payload.dias_semana = selectedDays.join(",");

    // Validación: Aeropuerto Origen vs Destino
    if (payload.aeropuerto_origen === payload.aeropuerto_destino) {
      Swal.fire('Error de validación', 'El aeropuerto de origen no puede ser el mismo que el de destino.', 'warning');
      return;
    }

    if (selectedDays.length === 0) {
      Swal.fire('Atención', 'Debe seleccionar al menos un día de la semana', 'warning');
      return;
    }

    try {
      if (editData) await axios.put(`${endpoint}${editData.id}/`, payload);
      else await axios.post(endpoint, payload);
      
      Swal.fire('Éxito', 'Vuelo planificado guardado', 'success');
      fetchRecords();
      setModalOpen(false);
    } catch (error) {
      Swal.fire('Error', 'No se pudo guardar la planificación', 'error');
    }
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: '¿Eliminar planificación?',
      text: "Esta acción no se puede deshacer",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar'
    }).then((result) => {
      if (result.isConfirmed) {
        axios.delete(`${endpoint}${id}/`).then(() => {
          fetchRecords();
          Swal.fire('Eliminado', '', 'success');
        });
      }
    });
  };

  const columns = [
    { dataField: "numero_vuelo", text: "Vuelo", sort: true },
    { dataField: "aerolinea_nombre", text: "Aerolínea", sort: true },
    { dataField: "aeropuerto_origen_nombre", text: "Origen", sort: true },
    { dataField: "aeropuerto_destino_nombre", text: "Destino", sort: true },
    { 
      dataField: "hora_salida_prog", 
      text: "Salida/Llegada (Prog)", 
      formatter: (cell, row) => `${row.hora_salida_prog} - ${row.hora_llegada_prog}` 
    },
    { 
      dataField: "activo", 
      text: "Estado", 
      formatter: cell => <Badge color={cell ? "success" : "danger"}>{cell ? "Activo" : "Inactivo"}</Badge> 
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
          <div className="headline-2 mb-3">Planificación de Vuelos</div>
          {loading ? <Loader /> : (
            <ToolkitProvider keyField="id" data={data} columns={columns} search>
              {props => (
                <div>
                  <div className="d-flex align-items-center justify-content-end mb-3 pr-2">
                    {isSearchOpen && (
                      <Input
                        size="sm" className="mr-2" placeholder="Buscar vuelo..." autoFocus
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); props.searchProps.onSearch(e.target.value); }}
                        style={{ width: '200px' }}
                      />
                    )}
                    <a href="/#" className="ml-3" onClick={(e) => toggleSearch(e, props.searchProps.onSearch)}><i className="eva eva-search" title="Filtrar" /></a>
                    <a href="/#" className="ml-3" onClick={handleExportExcel}><i className="eva eva-file-text" title="Exportar Excel" /></a>
                    <a href="/#" className="ml-3" onClick={handleExportPDF}><i className="eva eva-printer" title="Exportar PDF" /></a>
                    <a href="/#" className="ml-3" onClick={(e) => handleRefresh(e, props.searchProps.onSearch)}><i className="eva eva-refresh" title="Limpiar" /></a>
                    <a href="/#" className="ml-3" onClick={(e) => { e.preventDefault(); setEditData(null); setModalOpen(true); }}><i className="eva eva-plus" title="Planificar Vuelo" /></a>
                  </div>
                  <BootstrapTable { ...props.baseProps } bordered={false} classes="table-hover table-striped" noDataIndication={() => "No hay vuelos planificados"} />
                </div>
              )}
            </ToolkitProvider>
          )}
        </Widget>
      </Col>

      <Modal isOpen={modalOpen} toggle={() => setModalOpen(!modalOpen)} size="lg">
        <form onSubmit={handleSubmit}>
          <ModalHeader>{editData ? 'Editar' : 'Agregar'} Planificación</ModalHeader>
          <ModalBody>
            <Row>
              <Col md={6}>
                <FormGroup><Label>Aerolínea</Label><Input type="select" name="aerolinea_empresa" defaultValue={editData?.aerolinea_empresa} required>
                  <option value="">Seleccione...</option>
                  {aerolineas.map(a => <option key={a.id} value={a.id}>{a.razon_social}</option>)}
                </Input></FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup><Label>Aeronave</Label><Input type="select" name="aeronave" defaultValue={editData?.aeronave} required>
                  <option value="">Seleccione...</option>
                  {aeronaves.map(a => <option key={a.id} value={a.id}>{a.modelo}</option>)}
                </Input></FormGroup>
              </Col>
            </Row>
            <Row>
              <Col md={4}><FormGroup><Label>Número de Vuelo</Label><Input name="numero_vuelo" defaultValue={editData?.numero_vuelo} placeholder="Ej: AV123" required /></FormGroup></Col>
              <Col md={4}><FormGroup><Label>Origen</Label><Input type="select" name="aeropuerto_origen" defaultValue={editData?.aeropuerto_origen} required>
                <option value="">Seleccione...</option>
                {aeropuertos.map(a => <option key={a.id} value={a.id}>{a.codigo_iata} - {a.nombre_completo}</option>)}
              </Input></FormGroup></Col>
              <Col md={4}><FormGroup><Label>Destino</Label><Input type="select" name="aeropuerto_destino" defaultValue={editData?.aeropuerto_destino} required>
                <option value="">Seleccione...</option>
                {aeropuertos.map(a => <option key={a.id} value={a.id}>{a.codigo_iata} - {a.nombre_completo}</option>)}
              </Input></FormGroup></Col>
            </Row>
            <Row>
              <Col md={6}><FormGroup><Label>Hora Salida (Prog)</Label><Input type="time" name="hora_salida_prog" defaultValue={editData?.hora_salida_prog} required /></FormGroup></Col>
              <Col md={6}><FormGroup><Label>Hora Llegada (Prog)</Label><Input type="time" name="hora_llegada_prog" defaultValue={editData?.hora_llegada_prog} required /></FormGroup></Col>
            </Row>
            <FormGroup>
              <Label>Días de la semana</Label>
              <div className="d-flex flex-wrap p-2 border rounded">
                {daysOfWeek.map(day => (
                  <FormGroup check key={day.value} className="mr-4 mb-0">
                    <Label check>
                      <Input type="checkbox" checked={selectedDays.includes(day.value)} onChange={() => handleDayChange(day.value)} /> {day.label}
                    </Label>
                  </FormGroup>
                ))}
              </div>
            </FormGroup>
            <Row>
              <Col md={6}><FormGroup><Label>Inicio Temporada</Label><Input type="date" name="inicio_temporada" defaultValue={editData?.inicio_temporada} required /></FormGroup></Col>
              <Col md={6}><FormGroup><Label>Fin Temporada</Label><Input type="date" name="fin_temporada" defaultValue={editData?.fin_temporada} required /></FormGroup></Col>
            </Row>
            <FormGroup check><Label check><Input type="checkbox" name="activo" defaultChecked={editData ? editData.activo : true} /> Planificación Activa</Label></FormGroup>
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button color="primary" type="submit">Guardar Planificación</Button>
          </ModalFooter>
        </form>
      </Modal>
    </Row>
  );
};

export default VueloPlanificadoPage;
