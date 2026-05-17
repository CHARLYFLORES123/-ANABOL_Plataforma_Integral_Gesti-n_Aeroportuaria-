import React, { useState, useEffect } from "react";
import { 
  Row, Col, Button, Modal, ModalHeader, ModalBody, ModalFooter, 
  FormGroup, Label, Input 
} from "reactstrap";
import BootstrapTable from "react-bootstrap-table-next";
import ToolkitProvider, { Search } from 'react-bootstrap-table2-toolkit/dist/react-bootstrap-table2-toolkit';
import Swal from 'sweetalert2';
import Widget from "../../components/Widget/Widget.js";
import Loader from "../../components/Loader/Loader";
import axios from "axios";

const MonedaTasasPage = () => {
  const [tasas, setTasas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const endpoint = "config/tasas/";

  useEffect(() => {
    fetchTasas();
  }, []);

  const fetchTasas = () => {
    setLoading(true);
    axios.get(endpoint)
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : (res.data && res.data.results) ? res.data.results : [];
        setTasas(data);
      })
      .catch(err => {
        console.error(err);
        const errorMsg = err.response?.data ? JSON.stringify(err.response.data) : err.message || "Error de conexión";
        Swal.fire('Error', `No se pudieron cargar las tasas: ${errorMsg}`, 'error');
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
    fetchTasas();
  };

  const handleExportExcel = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.get(`${endpoint}export/excel/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'tasas_monedas.csv');
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
      link.setAttribute('download', 'reporte_tarifario_tasas.pdf');
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
      codigo_iso: formData.get("codigo_iso"), // Corregido: coincide con el nombre del campo en el formulario y el backend
      simbolo: formData.get("simbolo"),
      tipo_cambio_ref_usd: parseFloat(formData.get("tipo_cambio_ref_usd")), // Corregido: coincide con el nombre del campo en el formulario y el backend
      tasa_seguridad_nacional: parseFloat(formData.get("tasa_seguridad_nacional")),
      tasa_seguridad_internacional: parseFloat(formData.get("tasa_seguridad_internacional")),
    };

    try {
      if (editData) {
        await axios.put(`${endpoint}${editData.id}/`, payload);
        Swal.fire('Éxito', 'Tasa actualizada correctamente', 'success');
      } else {
        await axios.post(endpoint, payload);
        Swal.fire('Éxito', 'Tasa creada correctamente', 'success');
      }
      fetchTasas();
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
      text: "Se eliminará este registro de tasa permanentemente.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#4d53e0',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        axios.delete(`${endpoint}${id}/`)
          .then(() => {
            fetchTasas();
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
    { dataField: "codigo_iso", text: "Moneda", sort: true },
    { dataField: "simbolo", text: "Símbolo", sort: true, headerAlign: 'center', align: 'center' },
    { dataField: "tipo_cambio_ref_usd", text: "Cambio Ref.", sort: true },
    { dataField: "tasa_seguridad_nacional", text: "Tasa Nacional", sort: true },
    { dataField: "tasa_seguridad_internacional", text: "Tasa Internacional", sort: true },
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
          <div className="headline-2 mb-3">Multi-moneda y Tasas de Seguridad</div>
          <p className="body-1 muted mb-4">
            Gestión de tipos de cambio de referencia y configuración de tasas nacionales/internacionales.
          </p>

          {loading && <div className="text-center py-4"><Loader /></div>}

          <ToolkitProvider keyField="id" data={tasas} columns={columns} search>
            {props => (
              <div>
                <div className="d-flex align-items-center justify-content-end mb-3 pr-2">
                  {isSearchOpen && (
                    <Input
                      size="sm"
                      className="mr-2"
                      placeholder="Buscar tasa..."
                      autoFocus
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        props.searchProps.onSearch(e.target.value);
                      }}
                      onKeyPress={(e) => e.key === 'Enter' && props.searchProps.onSearch(searchTerm)}
                      style={{ width: '200px' }}
                    />
                  )}
                  <a href="/#" className="ml-3" onClick={(e) => toggleSearch(e, props.searchProps.onSearch)}><i className="eva eva-search" title="Filtrar" /></a>
                  <a href="/#" className="ml-3" onClick={handleExportExcel}><i className="eva eva-file-text" title="Exportar Excel" /></a>
                  <a href="/#" className="ml-3" onClick={handleExportPDF}><i className="eva eva-printer" title="Exportar PDF" /></a>
                  <a href="/#" className="ml-3" onClick={(e) => handleRefresh(e, props.searchProps.onSearch)}><i className="eva eva-refresh" title="Limpiar" /></a>
                  <a href="/#" className="ml-3" onClick={(e) => { e.preventDefault(); openModal(); }}><i className="eva eva-plus" title="Agregar Tasa" /></a>
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
          <ModalHeader toggle={toggleModal}>{editData ? 'Editar' : 'Agregar'} Tasa / Moneda</ModalHeader>
          <ModalBody>
            <Row form>
              <Col md={6}><FormGroup><Label>Código Moneda</Label><Input name="codigo_iso" defaultValue={editData?.codigo_iso} required placeholder="Ej: BOB, USD" /></FormGroup></Col>
              <Col md={6}><FormGroup><Label>Símbolo</Label><Input name="simbolo" defaultValue={editData?.simbolo} required placeholder="Ej: Bs, $" /></FormGroup></Col>
            </Row>
            <FormGroup><Label>Tasa de Cambio</Label><Input name="tipo_cambio_ref_usd" type="number" step="0.0001" defaultValue={editData?.tipo_cambio_ref_usd} required /></FormGroup>
            <FormGroup><Label>Tasa Seguridad Nacional</Label><Input name="tasa_seguridad_nacional" type="number" step="0.01" defaultValue={editData?.tasa_seguridad_nacional} required /></FormGroup>
            <FormGroup><Label>Tasa Seguridad Internacional</Label><Input name="tasa_seguridad_internacional" type="number" step="0.01" defaultValue={editData?.tasa_seguridad_internacional} required /></FormGroup>
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

export default MonedaTasasPage;