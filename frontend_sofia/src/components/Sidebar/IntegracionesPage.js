import React, { useState, useEffect } from "react";
import { 
  Row, Col, Button, Modal, ModalHeader, ModalBody, ModalFooter, 
  FormGroup, Label, Input, Badge 
} from "reactstrap";
import BootstrapTable from "react-bootstrap-table-next";
import ToolkitProvider, { Search } from 'react-bootstrap-table2-toolkit/dist/react-bootstrap-table2-toolkit';
import Swal from 'sweetalert2';
import Widget from "../../components/Widget/Widget.js";
import Loader from "../../components/Loader/Loader";
import axios from "axios";

import s from "../../pages/tables/Tables.module.scss";

const IntegracionesPage = () => {
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const endpoint = "config/webhooks/";

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchWebhooks = () => {
    setLoading(true);
    axios.get(endpoint)
      .then(res => {
        // Aseguramos que siempre sea un array, ya sea directamente o de la propiedad 'results'
        const data = Array.isArray(res.data) ? res.data : (res.data && res.data.results) ? res.data.results : [];
        setWebhooks(data);
      })
      .catch(err => {
        console.error(err);
        const errorMsg = err.response?.data ? JSON.stringify(err.response.data) : err.message || "Error de conexión";
        Swal.fire('Error', `No se pudieron cargar las integraciones: ${errorMsg}`, 'error');
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
    fetchWebhooks();
  };

  const handleExportExcel = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.get(`${endpoint}export/excel/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'integraciones_webhooks.csv');
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
      link.setAttribute('download', 'reporte_integraciones.pdf');
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
    
    const payload = {
      servicio_nombre: formData.get("servicio_nombre"), // Coincide con el modelo
      evento_disparador: formData.get("evento_disparador"), // Coincide con el modelo
      webhook_url: formData.get("webhook_url"), // Coincide con el modelo
      token_autorizacion: formData.get("token_autorizacion") || "", // Coincide con el modelo
      activo: formData.get("activo") === "on"
    };

    try {
      if (editData) {
        await axios.put(`${endpoint}${editData.id}/`, payload);
        Swal.fire('Éxito', 'Webhook actualizado correctamente', 'success');
      } else {
        await axios.post(endpoint, payload);
        Swal.fire('Éxito', 'Webhook creado correctamente', 'success');
      }
      fetchWebhooks();
      toggleModal();
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : error.message || "Error desconocido";
      Swal.fire('Error', `No se pudo guardar: ${errorMsg}`, 'error');
    }
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "Se eliminará esta integración permanentemente.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#4d53e0',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        axios.delete(`${endpoint}${id}/`)
          .then(() => {
            fetchWebhooks();
            Swal.fire('Eliminado', 'El webhook ha sido borrado.', 'success');
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

  const statusFormatter = (cell) => (
    <Badge color={cell ? "success" : "secondary"}>
      {cell ? "Activo" : "Inactivo"}
    </Badge>
  );

  const columns = [
    { dataField: "servicio_nombre", text: "Nombre del Servicio", sort: true },
    { dataField: "evento_disparador", text: "Evento Disparador", sort: true },
    { dataField: "webhook_url", text: "URL de Destino", sort: true },
    { dataField: "activo", text: "Estado", sort: true, formatter: statusFormatter },
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
          <div className="headline-2 mb-3">Integraciones y Webhooks</div>
          <p className="body-1 muted mb-4">
            Configuración de disparadores externos y servicios conectados para la automatización de eventos.
          </p>

          {loading && (
            <div className="text-center py-4">
              <Loader />
            </div>
          )}

          <ToolkitProvider keyField="id" data={webhooks} columns={columns} search>
            {props => (
              <div>
                <div className="d-flex align-items-center justify-content-end mb-3 pr-2">
                  {isSearchOpen && (
                    <Input
                      size="sm"
                      className="mr-2"
                      placeholder="Buscar integración..."
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
                  <a href="/#" className="ml-3" onClick={(e) => { e.preventDefault(); openModal(); }}><i className="eva eva-plus" title="Agregar Webhook" /></a>
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
            {editData ? 'Editar' : 'Agregar'} Webhook de Integración
          </ModalHeader>
          <ModalBody>
            <FormGroup>
              <Label>Nombre del Servicio</Label>
              <Input 
                name="servicio_nombre" 
                defaultValue={editData?.servicio_nombre} 
                required 
                placeholder="Ej: Slack Alerts" 
              />
            </FormGroup>
            <FormGroup>
              <Label>Evento Disparador</Label>
              <Input 
                name="evento_disparador" 
                defaultValue={editData?.evento_disparador} 
                required 
                placeholder="Ej: VUELO_ATRASADO" 
              />
            </FormGroup>
            <FormGroup>
              <Label>URL de Destino (Endpoint)</Label>
              <Input 
                name="webhook_url" 
                type="url" 
                defaultValue={editData?.webhook_url} 
                required 
                placeholder="https://api.externa.com/webhook" />
            </FormGroup>
            <FormGroup><Label>Secreto / Token de Seguridad</Label><Input name="token_autorizacion" defaultValue={editData?.token_autorizacion} placeholder="Opcional: Token para validar la firma" /></FormGroup>
            <FormGroup check className="ml-2"><Label check><Input type="checkbox" name="activo" defaultChecked={editData ? editData.activo : true} /> Activar integración</Label></FormGroup>
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

export default IntegracionesPage;