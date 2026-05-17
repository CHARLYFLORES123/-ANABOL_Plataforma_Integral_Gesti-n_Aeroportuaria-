import React, { useState, useEffect } from "react";
import { Row, Col, Button, Modal, ModalHeader, ModalBody, ModalFooter, FormGroup, Label, Input, Badge } from "reactstrap";
import BootstrapTable from "react-bootstrap-table-next";
import ToolkitProvider from 'react-bootstrap-table2-toolkit/dist/react-bootstrap-table2-toolkit';
import Swal from 'sweetalert2';
import Widget from "../../components/Widget/Widget.js";
import Loader from "../../components/Loader/Loader";
import axios from "axios";
import 'react-bootstrap-table-next/dist/react-bootstrap-table2.min.css';

const AgrupamientoZonasPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const endpoint = "fids/zonas/";

  useEffect(() => {
    fetchRecords();
  }, []);

  const toggleSearch = (e, onSearch) => {
    e.preventDefault();
    if (!isSearchOpen) {
      setIsSearchOpen(true);
    } else {
      setIsSearchOpen(false);
      setSearchTerm("");
      onSearch("");
    }
  };

  const handleRefresh = (e, onSearch) => {
    e.preventDefault();
    setSearchTerm("");
    onSearch("");
    fetchRecords();
  };

  const fetchRecords = () => {
    setLoading(true);
    axios.get(endpoint)
      .then(res => setData(Array.isArray(res.data) ? res.data : res.data.results || []))
      .catch(() => Swal.fire('Error', 'No se pudieron cargar las zonas', 'error'))
      .finally(() => setLoading(false));
  };

  const handleExportExcel = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.get(`${endpoint}export/excel/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'zonas_fids.csv');
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
      link.setAttribute('download', 'reporte_zonas_fids.pdf');
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
      
      Swal.fire('Éxito', 'Zona guardada correctamente', 'success');
      fetchRecords();
      setModalOpen(false);
    } catch (error) {
      const msg = error.response?.data ? JSON.stringify(error.response.data) : "Error al guardar";
      Swal.fire('Error', msg, 'error');
    }
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: '¿Eliminar zona?',
      text: "Esto puede afectar a los dispositivos vinculados a esta zona.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      confirmButtonColor: '#fd5f00'
    }).then((result) => {
      if (result.isConfirmed) {
        axios.delete(`${endpoint}${id}/`).then(() => {
          fetchRecords();
          Swal.fire('Eliminado', 'La zona ha sido eliminada.', 'success');
        }).catch(() => Swal.fire('Error', 'No se pudo eliminar el registro', 'error'));
      }
    });
  };

  const filtroVueloFormatter = (cell) => {
      if (cell === 'SALIDAS_SOLO') return <Badge color="warning">Salidas Solo</Badge>;
      if (cell === 'LLEGADAS_SOLO') return <Badge color="primary">Llegadas Solo</Badge>;
      if (cell === 'MIXTO') return <Badge color="success">Mixto(Llegadas y Salidas)</Badge>;
    return cell;
  };

  const columns = [
    { dataField: "nombre_zona", text: "Nombre de la Zona", sort: true },
    { dataField: "descripcion", text: "Descripción", sort: true, formatter: val => val || <span className="text-muted">Sin descripción</span> },
    { dataField: "tipo_filtro_vuelo", text: "Filtro Vuelo", sort: true, formatter: filtroVueloFormatter },
    { 
      dataField: "id", text: "Acciones", 
      headerAlign: 'center',
      align: 'center',
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
          <div className="headline-2 mb-3">Pantallas FIDS: Agrupamiento de Zonas</div>
          {loading ? <Loader /> : (
            <ToolkitProvider 
              keyField="id" 
              data={data} 
              columns={columns} 
              search={{ searchFormatted: true }}
            >
              {props => (
                <div>
                  <div className="d-flex align-items-center justify-content-end mb-3 pr-2">
                    {isSearchOpen && (
                      <Input
                        size="sm" className="mr-2" placeholder="Buscar zona..." autoFocus
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); props.searchProps.onSearch(e.target.value); }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            props.searchProps.onSearch(searchTerm);
                          }
                        }}
                        style={{ width: '200px' }}
                      />
                    )}
                    <a href="/#" className="ml-3" onClick={e => toggleSearch(e, props.searchProps.onSearch)}><i className="eva eva-search" title="Buscar" /></a>
                    <a href="/#" className="ml-3" onClick={handleExportExcel}><i className="eva eva-file-text" title="Exportar Excel" /></a>
                    <a href="/#" className="ml-3" onClick={handleExportPDF}><i className="eva eva-printer" title="Exportar PDF" /></a>
                    <a href="/#" className="ml-3" onClick={e => handleRefresh(e, props.searchProps.onSearch)}><i className="eva eva-refresh" title="Refrescar" /></a>
                    <a href="/#" className="ml-3" onClick={e => { e.preventDefault(); setEditData(null); setModalOpen(true); }}><i className="eva eva-plus" title="Agregar Zona" /></a>
                  </div>
                  <BootstrapTable 
                    { ...props.baseProps } 
                    bordered={false} 
                    classes="table-hover table-striped" 
                    noDataIndication="No hay zonas registradas" 
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
            {editData ? 'Editar' : 'Registrar'} Zona FIDS
          </ModalHeader>
          <ModalBody>
            <FormGroup>
              <Label>Nombre de la Zona</Label>
              <Input name="nombre_zona" defaultValue={editData?.nombre_zona} placeholder="Ej: Pasillo Internacional" required />
            </FormGroup>
            <FormGroup>
              <Label>Tipo filtro vuelo</Label>
              <Input type="select" name="tipo_filtro_vuelo" defaultValue={editData?.tipo_filtro_vuelo || 'MIXTO'}>
                <option value="SALIDAS_SOLO">Salidas Solo</option>
                <option value="LLEGADAS_SOLO">Llegadas Solo</option>
                <option value="MIXTO">Mixto (Llegadas y Salidas)</option>
              </Input>
            </FormGroup>
            <FormGroup>
              <Label>Descripción</Label>
              <Input type="textarea" name="descripcion" defaultValue={editData?.descripcion} placeholder="Detalles de la ubicación o pantallas..." />
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

export default AgrupamientoZonasPage;
