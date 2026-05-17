import React, { useState, useEffect } from "react";
import { Row, Col, Button, Modal, ModalHeader, ModalBody, ModalFooter, FormGroup, Label, Input, Badge } from "reactstrap";
import BootstrapTable from "react-bootstrap-table-next";
import ToolkitProvider, { Search } from 'react-bootstrap-table2-toolkit/dist/react-bootstrap-table2-toolkit';
import Swal from 'sweetalert2';
import Widget from "../../components/Widget/Widget.js";
import Loader from "../../components/Loader/Loader";
import axios from "axios";
import { toast } from "react-toastify"; // Importar toast para notificaciones
import 'react-bootstrap-table-next/dist/react-bootstrap-table2.min.css'; // Asegúrate de que esta importación esté presente

const AerolineasEmpresasPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false); // Nuevo estado para la visibilidad del buscador
  const [searchTerm, setSearchTerm] = useState(""); // Nuevo estado para el término de búsqueda

  const endpoint = "seguridad/aerolineas/";

  useEffect(() => { fetchRecords(); }, []);

  const fetchRecords = () => {
    setLoading(true);
    axios.get(endpoint)
      .then(res => setData(Array.isArray(res.data) ? res.data : res.data.results || []))
      .catch(() => Swal.fire('Error', 'No se pudieron cargar las empresas', 'error'))
      .finally(() => setLoading(false));
  };

  // Funciones para el buscador y refrescar
  const toggleSearch = (e, onSearch) => {
    e.preventDefault();
    if (!isSearchOpen) {
      setIsSearchOpen(true);
    } else if (isSearchOpen && searchTerm.trim()) {
      // Si el buscador está abierto y hay un término, ejecutar la búsqueda
      onSearch(searchTerm);
    } else {
      // Si el buscador está abierto pero vacío, cerrarlo
      setIsSearchOpen(false);
    }
  };

  const handleRefresh = (e, onSearch) => {
    e.preventDefault();
    setSearchTerm(""); // Limpiar el término de búsqueda
    onSearch(""); // Limpiar la búsqueda en la tabla
    fetchRecords(); // Volver a cargar todos los registros
  };

  const toggleModal = () => setModalOpen(!modalOpen);


  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = Object.fromEntries(formData.entries());
    payload.activo = formData.get("activo") === "on";

    try {
      if (editData) await axios.put(`${endpoint}${editData.id}/`, payload);
      else await axios.post(endpoint, payload);
      Swal.fire('Éxito', 'Registro guardado', 'success');
      fetchRecords();
      setModalOpen(false);
    } catch (error) {
      Swal.fire('Error', 'No se pudo guardar', 'error');
    }
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: '¿Eliminar?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí'
    }).then((result) => {
      if (result.isConfirmed) {
        axios.delete(`${endpoint}${id}/`).then(() => { fetchRecords(); Swal.fire('Eliminado', '', 'success'); });
      }
    });
  };

  const handleExportExcel = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.get(`${endpoint}export/excel/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'aerolineas_empresas_reporte.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error al exportar Excel:", error);
      toast.error("Error al generar el archivo Excel");
    }
  };

  const handleExportPDF = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.get(`${endpoint}export/pdf/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'aerolineas_empresas_reporte.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error al exportar PDF:", error);
      toast.error("Error al generar el reporte PDF");
    }
  };

  const columns = [
    { dataField: "razon_social", text: "Razón Social", sort: true },
    { dataField: "ruc_nit", text: "RUC/NIT", sort: true },
    { dataField: "tipo_empresa", text: "Tipo", sort: true },
    { dataField: "correo_contacto", text: "Email", sort: true },
    { dataField: "activo", text: "Activo", formatter: cell => <Badge color={cell ? "success" : "danger"}>{cell ? "Sí" : "No"}</Badge> },
    { 
      dataField: "id", text: "Acciones", 
      formatter: (cell, row) => (
        <div className="d-flex justify-content-center">
          <Button size="sm" color="info" className="mr-1" onClick={() => { setEditData(row); setModalOpen(true); }}><i className="eva eva-edit-2" /></Button>
          <Button size="sm" color="danger" onClick={() => handleDelete(row.id)}><i className="eva eva-trash-2" /></Button>
        </div>
      )
    }
  ];

  return (
    <Row className="mb-4">
      <Col xs={12}>
        <Widget className="widget-p-md">
          <div className="headline-2 mb-3">Gestión de Aerolíneas y Empresas</div>
          
          {loading ? <Loader /> : (
            <ToolkitProvider keyField="id" data={data} columns={columns} search>
              {props => (
                <div>
                  <div className="d-flex align-items-center justify-content-end mb-3 pr-2">
                    {isSearchOpen && (
                      <Input
                        size="sm"
                        className="mr-2"
                        placeholder="Buscar empresa..."
                        autoFocus
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          props.searchProps.onSearch(e.target.value);
                        }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            props.searchProps.onSearch(searchTerm);
                          }
                        }}
                        style={{ width: '200px' }}
                      />
                    )}
                    <a href="/#" className="ml-3" onClick={(e) => toggleSearch(e, props.searchProps.onSearch)}><i className="eva eva-search" title="Filtrar" /></a>
                    <a href="/#" className="ml-3" onClick={handleExportExcel}><i className="eva eva-file-text" title="Exportar CSV (Excel)" /></a>
                    <a href="/#" className="ml-3" onClick={handleExportPDF}><i className="eva eva-printer" title="Exportar PDF" /></a>
                    <a href="/#" className="ml-3" onClick={(e) => handleRefresh(e, props.searchProps.onSearch)}><i className="eva eva-refresh" title="Limpiar" /></a>
                    <a href="/#" className="ml-3" onClick={(e) => { e.preventDefault(); setEditData(null); setModalOpen(true); }}><i className="eva eva-plus" title="Agregar Empresa" /></a>
                  </div>
                  <BootstrapTable 
                    { ...props.baseProps } 
                    bordered={false} 
                    classes="table-hover table-striped" 
                    noDataIndication={() => (loading ? "Cargando..." : "No hay registros")}
                  />
                </div>
              )}
            </ToolkitProvider>
          )}
        </Widget>
      </Col>

      <Modal isOpen={modalOpen} toggle={() => setModalOpen(!modalOpen)}>
        <form onSubmit={handleSubmit}>
          <ModalHeader>{editData ? 'Editar' : 'Agregar'} Empresa</ModalHeader>
          <ModalBody>
            <FormGroup><Label>Razón Social</Label><Input name="razon_social" defaultValue={editData?.razon_social} required /></FormGroup>
            <FormGroup><Label>RUC/NIT</Label><Input name="ruc_nit" defaultValue={editData?.ruc_nit} required /></FormGroup>
            <FormGroup><Label>Tipo de Empresa</Label><Input name="tipo_empresa" type="select" defaultValue={editData?.tipo_empresa}>
              <option value="AEROLINEA">Aerolínea</option>
              <option value="CATERING">Catering</option>
              <option value="LIMPIEZA">Limpieza</option>
              <option value="FUEL">Combustible</option>
            </Input></FormGroup>
            <FormGroup><Label>Email Contacto</Label><Input name="correo_contacto" type="email" defaultValue={editData?.correo_contacto} required /></FormGroup>
            <FormGroup><Label>Celular Contacto</Label><Input name="celular_contacto" defaultValue={editData?.celular_contacto} /></FormGroup>
            <FormGroup check><Label check><Input type="checkbox" name="activo" defaultChecked={editData ? editData.activo : true} /> Activo</Label></FormGroup>
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button color="primary" type="submit">Guardar</Button>
          </ModalFooter>
        </form>
      </Modal>
    </Row>
  );
};

export default AerolineasEmpresasPage;
