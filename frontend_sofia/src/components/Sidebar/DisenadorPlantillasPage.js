import React, { useState, useEffect } from "react";
import { Row, Col, Button, Modal, ModalHeader, ModalBody, ModalFooter, FormGroup, Label, Input, Badge } from "reactstrap";
import BootstrapTable from "react-bootstrap-table-next";
import ToolkitProvider from 'react-bootstrap-table2-toolkit/dist/react-bootstrap-table2-toolkit';
import Swal from 'sweetalert2';
import Widget from "../../components/Widget/Widget.js";
import Loader from "../../components/Loader/Loader";
import axios from "axios";
import 'react-bootstrap-table-next/dist/react-bootstrap-table2.min.css';

const DisenadorPlantillasPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const endpoint = "fids/plantillas/";

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = () => {
    setLoading(true);
    axios.get(endpoint)
      .then(res => setData(Array.isArray(res.data) ? res.data : res.data.results || []))
      .catch(() => Swal.fire('Error', 'No se pudieron cargar las plantillas FIDS', 'error'))
      .finally(() => setLoading(false));
  };

  const handleExportExcel = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.get(`${endpoint}export/excel/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'plantillas_fids.csv');
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
      link.setAttribute('download', 'reporte_plantillas_fids.pdf');
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
      
      Swal.fire('Éxito', 'Plantilla guardada correctamente', 'success');
      fetchRecords();
      setModalOpen(false);
    } catch (error) {
      const msg = error.response?.data ? JSON.stringify(error.response.data) : "Error al guardar";
      Swal.fire('Error', msg, 'error');
    }
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: '¿Eliminar plantilla?',
      text: "Esta acción no se puede deshacer",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      confirmButtonColor: '#fd5f00'
    }).then((result) => {
      if (result.isConfirmed) {
        axios.delete(`${endpoint}${id}/`).then(() => {
          fetchRecords();
          Swal.fire('Eliminado', 'La plantilla ha sido removida.', 'success');
        }).catch(() => Swal.fire('Error', 'No se pudo eliminar el registro', 'error'));
      }
    });
  };

  const columns = [
    { dataField: "nombre_plantilla", text: "Nombre Plantilla", sort: true },
    { 
      dataField: "fuente_texto", 
      text: "Fuente de Texto", 
      sort: true, 
    },
    { 
      dataField: "idiomas_visualizacion", 
      text: "Idiomas", 
      sort: true, 
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
          <div className="headline-2 mb-3">Pantallas FIDS: Diseñador y Plantillas</div>
          {loading ? <Loader /> : (
            <ToolkitProvider keyField="id" data={data} columns={columns} search>
              {props => (
                <div>
                  <div className="d-flex align-items-center justify-content-end mb-3 pr-2">
                    {isSearchOpen && (
                      <Input
                        size="sm" className="mr-2" placeholder="Buscar plantilla..." autoFocus
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
                  <BootstrapTable { ...props.baseProps } bordered={false} classes="table-hover table-striped" noDataIndication="No hay plantillas configuradas" />
                </div>
              )}
            </ToolkitProvider>
          )}
        </Widget>
      </Col>

      <Modal isOpen={modalOpen} toggle={() => setModalOpen(!modalOpen)} size="lg">
        <form onSubmit={handleSubmit}>
          <ModalHeader>{editData ? 'Editar' : 'Registrar'} Plantilla de Pantalla</ModalHeader>
          <ModalBody>
            <FormGroup>
              <Label>Nombre de Plantilla</Label>
              <Input name="nombre_plantilla" defaultValue={editData?.nombre_plantilla} placeholder="Ej: Layout Principal Salidas" required />
            </FormGroup>
            <Row>
              <Col md={6}>
                <FormGroup><Label>Esquema de Colores</Label>
                  <Input type="select" name="esquema_colores" defaultValue={editData?.esquema_colores || 'DARK'}>
                    <option value="DARK">Oscuro (High Contrast)</option>
                    <option value="LIGHT">Claro (Light)</option>
                    <option value="CORPORATE">Corporativo</option>
                  </Input></FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup><Label>Fuente de Texto</Label>
                  <Input type="select" name="fuente_texto" defaultValue={editData?.fuente_texto || 'Arial'}>
                    <option value="Arial">Arial (Standard)</option>
                    <option value="Helvetica">Helvetica (Standard)</option>
                    <option value="Verdana">Verdana (Clear)</option>
                    <option value="Tahoma">Tahoma (Compact)</option>
                    <option value="Georgia">Georgia (Serif)</option>
                    <option value="Times New Roman">Times New Roman (Serif)</option>
                    <option value="Courier New">Courier New (Typewriter)</option>
                    <option value="Roboto">Roboto (Modern)</option>
                    <option value="Open Sans">Open Sans (Readable)</option>
                    <option value="Montserrat">Montserrat (Geometric)</option>
                    <option value="Lato">Lato (Stylized)</option>
                    <option value="Ubuntu">Ubuntu (Modern)</option>
                    <option value="Monospace">Monospace</option>
                  </Input></FormGroup>
              </Col>
            </Row>
            <Row>
              <Col md={6}><FormGroup><Label>Idiomas (separados por coma)</Label><Input name="idiomas_visualizacion" defaultValue={editData?.idiomas_visualizacion} placeholder="Ej: ES, EN" required /></FormGroup></Col>
              <Col md={6}><FormGroup><Label>Columnas Visibles</Label><Input name="columnas_visibles" defaultValue={editData?.columnas_visibles} placeholder="Ej: Vuelo, Destino, Estado" required /></FormGroup></Col>
            </Row>
          </ModalBody>
          <ModalFooter><Button color="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button><Button color="primary" type="submit">Guardar Cambios</Button></ModalFooter>
        </form>
      </Modal>
    </Row>
  );
};

export default DisenadorPlantillasPage;