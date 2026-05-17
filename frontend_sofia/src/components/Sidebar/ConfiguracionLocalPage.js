import React, { useState, useEffect } from "react";
import { 
  Row, Col, Button, Modal, ModalHeader, ModalBody, ModalFooter, 
  FormGroup, Label, Input 
} from "reactstrap";
import BootstrapTable from "react-bootstrap-table-next";
import ToolkitProvider, { Search } from 'react-bootstrap-table2-toolkit/dist/react-bootstrap-table2-toolkit';
import Swal from 'sweetalert2';
import Widget from "../../components/Widget/Widget.js";
import 'react-bootstrap-table-next/dist/react-bootstrap-table2.min.css';
import axios from "axios";

const { SearchBar } = Search;

const ConfiguracionLocalPage = () => {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const endpoint = "config/settings-local/";

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = () => {
    setLoading(true);
    axios.get(endpoint)
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : res.data.results || [];
        setConfigs(data);
      })
      .catch(err => {
        console.error(err);
        Swal.fire('Error', 'No se pudieron cargar los datos', 'error');
      })
      .finally(() => setLoading(false));
  };

  const toggleModal = () => setModalOpen(!modalOpen);

  const openModal = (data = null) => {
    setEditData(data);
    toggleModal();
  };

  const toggleSearch = (e, onSearch) => {
    e.preventDefault();
    if (!isSearchOpen) {
      setIsSearchOpen(true);
    } else if (isSearchOpen && searchTerm.trim()) {
      onSearch(searchTerm);
    } else {
      setIsSearchOpen(false);
    }
  };

  const handleRefresh = (e, onSearch) => {
    e.preventDefault();
    setSearchTerm("");
    onSearch("");
    fetchConfigs();
  };

  const handleExportExcel = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.get(`${endpoint}export/excel/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'configuracion_local.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      Swal.fire('Error', 'No se pudo generar el Excel', 'error');
    }
  };

  const handleExportPDF = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.get(`${endpoint}export/pdf/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'reporte_configuracion.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      Swal.fire('Error', 'No se pudo generar el PDF', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = Object.fromEntries(formData.entries());

    try {
      if (editData) {
        await axios.put(`${endpoint}${editData.id}/`, payload);
        Swal.fire('Éxito', 'Configuración actualizada correctamente', 'success');
      } else {
        await axios.post(endpoint, payload);
        Swal.fire('Éxito', 'Configuración creada correctamente', 'success');
      }
      fetchConfigs();
      toggleModal();
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo guardar la información', 'error');
    }
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "Se eliminará la configuración del aeropuerto.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#4d53e0',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        axios.delete(`${endpoint}${id}/`)
          .then(() => {
            fetchConfigs();
            Swal.fire('Eliminado', 'El registro ha sido borrado.', 'success');
          })
          .catch(() => Swal.fire('Error', 'No se pudo eliminar el registro', 'error'));
      }
    });
  };

  const actionFormatter = (cell, row) => (
    <div className="d-flex justify-content-center">
      <Button size="sm" color="info" className="mr-1" onClick={() => openModal(row)}>
        <i className="eva eva-edit-2" />
      </Button>
      <Button size="sm" color="danger" onClick={() => handleDelete(row.id)}>
        <i className="eva eva-trash-2" />
      </Button>
    </div>
  );

  const columns = [
    { dataField: "nombre_aeropuerto", text: "Aeropuerto", sort: true },
    { dataField: "direccion", text: "Dirección", sort: true },
    { dataField: "zona_horaria", text: "Zona Horaria", sort: true },
    { dataField: "telefono_soporte", text: "Teléfono Soporte", sort: true },
    { 
      dataField: "id", 
      text: "Acciones", 
      formatter: actionFormatter, 
      headerStyle: { width: '100px' },
      headerAlign: 'center'
    }
  ];

  return (
    <Row className="mb-4">
      <Col xs={12}>
        <Widget className="widget-p-md">
          <div className="headline-2 mb-3">Configuración del Aeropuerto Local</div>

          <ToolkitProvider keyField="id" data={configs} columns={columns} search>
            {props => (
              <div>
                <div className="d-flex align-items-center justify-content-end mb-3 pr-2">
                  {isSearchOpen && (
                    <Input
                      size="sm"
                      className="mr-2"
                      placeholder="Buscar..."
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
                  <a href="/#" className="ml-3" onClick={handleExportExcel}><i className="eva eva-file-text" title="Exportar Excel" /></a>
                  <a href="/#" className="ml-3" onClick={handleExportPDF}><i className="eva eva-printer" title="Exportar PDF" /></a>
                  <a href="/#" className="ml-3" onClick={(e) => handleRefresh(e, props.searchProps.onSearch)}><i className="eva eva-refresh" title="Limpiar" /></a>
                  <a href="/#" className="ml-3" onClick={(e) => { e.preventDefault(); openModal(); }}><i className="eva eva-plus" title="Agregar Configuración" /></a>
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
        </Widget>
      </Col>

      <Modal isOpen={modalOpen} toggle={toggleModal} key={editData ? editData.id : 'new'}>
        <form onSubmit={handleSubmit}>
          <ModalHeader toggle={toggleModal}>
            {editData ? 'Editar' : 'Agregar'} Configuración de Aeropuerto
          </ModalHeader>
          <ModalBody>
            <FormGroup>
              <Label>Nombre del Aeropuerto</Label>
              <Input name="nombre_aeropuerto" defaultValue={editData?.nombre_aeropuerto} required />
            </FormGroup>
            <FormGroup>
              <Label>ID Aeropuerto Maestro</Label>
              <Input name="aeropuerto_maestro" type="number" defaultValue={editData?.aeropuerto_maestro} required placeholder="ID del diccionario maestro" />
            </FormGroup>
            <FormGroup><Label>Dirección</Label><Input name="direccion" defaultValue={editData?.direccion} required /></FormGroup>
            <FormGroup>
              <Label>Zona Horaria</Label>
              <Input name="zona_horaria" defaultValue={editData?.zona_horaria} required placeholder="Ej: America/La_Paz" />
            </FormGroup>
            <FormGroup>
              <Label>Teléfono de Soporte</Label>
              <Input name="telefono_soporte" defaultValue={editData?.telefono_soporte} required />
            </FormGroup>
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" type="button" onClick={toggleModal}>Cancelar</Button>
            <Button color="primary" type="submit">Guardar cambios</Button>
          </ModalFooter>
        </form>
      </Modal>
    </Row>
  );
};

export default ConfiguracionLocalPage;
