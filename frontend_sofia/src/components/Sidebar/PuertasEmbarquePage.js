import React, { useState, useEffect } from "react";
import { Row, Col, Button, Modal, ModalHeader, ModalBody, ModalFooter, FormGroup, Label, Input, Badge } from "reactstrap";
import BootstrapTable from "react-bootstrap-table-next";
import ToolkitProvider from 'react-bootstrap-table2-toolkit/dist/react-bootstrap-table2-toolkit';
import Swal from 'sweetalert2';
import Widget from "../../components/Widget/Widget.js";
import Loader from "../../components/Loader/Loader";
import axios from "axios";
import 'react-bootstrap-table-next/dist/react-bootstrap-table2.min.css';

const PuertasEmbarquePage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [vuelos, setVuelos] = useState([]);

  // Cambiamos a recursos-rms para que coincida con el backend y las rutas de Layout
  const endpoint = "recursos-rms/puertas/";

  useEffect(() => {
    fetchRecords();
    fetchDependencies();
  }, []);

  const fetchRecords = () => {
    setLoading(true);
    axios.get(endpoint)
      .then(res => setData(Array.isArray(res.data) ? res.data : res.data.results || []))
      .catch(() => Swal.fire('Error', 'No se pudieron cargar las puertas de embarque', 'error'))
      .finally(() => setLoading(false));
  };

  const fetchDependencies = async () => {
    try {
      const resVuelos = await axios.get("vuelos/operaciones/");
      setVuelos(resVuelos.data.results || resVuelos.data);
    } catch (error) {
      console.error("Error cargando vuelos", error);
    }
  };

  const handleExportExcel = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.get(`${endpoint}export/excel/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'puertas_embarque.csv');
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
      link.setAttribute('download', 'reporte_puertas_embarque.pdf');
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

    // Limpiar el vuelo si no se selecciona ninguno
    if (!payload.vuelo_diario) payload.vuelo_diario = null;

    try {
      if (editData) await axios.put(`${endpoint}${editData.id}/`, payload);
      else await axios.post(endpoint, payload);
      
      Swal.fire('Éxito', 'Puerta guardada correctamente', 'success');
      fetchRecords();
      setModalOpen(false);
    } catch (error) {
      const msg = error.response?.data ? JSON.stringify(error.response.data) : "Error al guardar";
      Swal.fire('Error', msg, 'error');
    }
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: '¿Eliminar puerta?',
      text: "Esta acción no se puede deshacer",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      confirmButtonColor: '#fd5f00'
    }).then((result) => {
      if (result.isConfirmed) {
        axios.delete(`${endpoint}${id}/`).then(() => {
          fetchRecords();
          Swal.fire('Eliminado', 'La puerta ha sido removida del sistema.', 'success');
        }).catch(() => Swal.fire('Error', 'No se pudo eliminar el registro', 'error'));
      }
    });
  };

  const statusFormatter = (cell) => {
    let color = "secondary";
    switch (cell) {
      case "DISPONIBLE": color = "success"; break;
      case "OCUPADA": color = "warning"; break;
      case "MANTENIMIENTO": color = "danger"; break;
      default: color = "info";
    }
    return <Badge color={color}>{cell}</Badge>;
  };

  const columns = [
    { dataField: "codigo_puerta", text: "Código Puerta", sort: true, headerAlign: 'center', align: 'center' },
    { dataField: "envergadura_maxima_aceptada", text: "Cat. Envergadura", sort: true },
    { dataField: "vuelo_numero", text: "Vuelo Actual", sort: true, formatter: val => val || <span className="text-muted">N/A</span> },
    { dataField: "estado", text: "Estado", sort: true, formatter: statusFormatter },
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
          <div className="headline-2 mb-3">Recursos RMS: Puertas de Embarque</div>
          {loading ? <Loader /> : (
            <ToolkitProvider keyField="id" data={data} columns={columns} search>
              {props => (
                <div>
                  <div className="d-flex align-items-center justify-content-end mb-3 pr-2">
                    {isSearchOpen && (
                      <Input
                        size="sm" className="mr-2" placeholder="Buscar puerta..." autoFocus
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); props.searchProps.onSearch(e.target.value); }}
                        style={{ width: '200px' }}
                      />
                    )}
                    <a href="/#" className="ml-3" onClick={e => { e.preventDefault(); setIsSearchOpen(!isSearchOpen); }}><i className="eva eva-search" /></a>
                    <a href="/#" className="ml-3" onClick={handleExportExcel}><i className="eva eva-file-text" title="Exportar Excel" /></a>
                    <a href="/#" className="ml-3" onClick={handleExportPDF}><i className="eva eva-printer" title="Exportar PDF" /></a>
                    <a href="/#" className="ml-3" onClick={e => { e.preventDefault(); fetchRecords(); }}><i className="eva eva-refresh" /></a>
                    <a href="/#" className="ml-3" onClick={e => { e.preventDefault(); setEditData(null); setModalOpen(true); }}><i className="eva eva-plus" title="Registrar Puerta" /></a>
                  </div>
                  <BootstrapTable { ...props.baseProps } bordered={false} classes="table-hover table-striped" noDataIndication="No hay puertas configuradas" />
                </div>
              )}
            </ToolkitProvider>
          )}
        </Widget>
      </Col>

      <Modal isOpen={modalOpen} toggle={() => setModalOpen(!modalOpen)}>
        <form onSubmit={handleSubmit}>
          <ModalHeader>{editData ? 'Editar' : 'Registrar'} Puerta de Embarque</ModalHeader>
          <ModalBody>
            <FormGroup>
              <Label>Código de Puerta</Label>
              <Input name="codigo_puerta" defaultValue={editData?.codigo_puerta} placeholder="Ej: GATE-01" required />
            </FormGroup>
            <FormGroup>
              <Label>Categoría Máxima de Envergadura</Label>
              <Input type="select" name="envergadura_maxima_aceptada" defaultValue={editData?.envergadura_maxima_aceptada || 'CAT_C'}>
                <option value="CAT_A">Categoría A (Pequeña)</option>
                <option value="CAT_B">Categoría B</option>
                <option value="CAT_C">Categoría C (Media - Ej: A320/B737)</option>
                <option value="CAT_D">Categoría D</option>
                <option value="CAT_E">Categoría E (Grande - Ej: B777/A350)</option>
                <option value="CAT_F">Categoría F (Gigante - Ej: A380)</option>
              </Input>
            </FormGroup>
            <FormGroup>
              <Label>Estado de la Puerta</Label>
              <Input type="select" name="estado" defaultValue={editData?.estado || 'DISPONIBLE'}>
                <option value="DISPONIBLE">DISPONIBLE</option>
                <option value="OCUPADA">OCUPADA</option>
                <option value="MANTENIMIENTO">MANTENIMIENTO / CERRADA</option>
              </Input>
            </FormGroup>
            <FormGroup>
              <Label>Vuelo Asignado (Opcional)</Label>
              <Input type="select" name="vuelo_diario" defaultValue={editData?.vuelo_diario || ""}>
                <option value="">Ninguno (Puerta Libre)</option>
                {vuelos.map(v => <option key={v.id} value={v.id}>{v.numero_vuelo} - {v.fecha_operacion} ({v.tipo_operacion})</option>)}
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

export default PuertasEmbarquePage;