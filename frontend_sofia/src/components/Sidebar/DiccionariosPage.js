import React, { useState, useEffect } from "react";
import { 
  Row, Col, Nav, NavItem, NavLink, TabContent, TabPane, 
  Button, Modal, ModalHeader, ModalBody, ModalFooter, 
  FormGroup, Label, Input 
} from "reactstrap";
import classnames from 'classnames';
import BootstrapTable from "react-bootstrap-table-next";
import ToolkitProvider, { Search } from 'react-bootstrap-table2-toolkit/dist/react-bootstrap-table2-toolkit';
import Swal from 'sweetalert2';
import Widget from "../../components/Widget/Widget";
import Loader from "../../components/Loader/Loader";
import 'react-bootstrap-table-next/dist/react-bootstrap-table2.min.css';
import axios from "axios";

import s from "../../pages/tables/Tables.module.scss";

const { SearchBar } = Search;
const DiccionariosPage = () => {
  const [activeTab, setActiveTab] = useState('1');
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null); // null para nuevo, objeto para editar
  const [modalType, setModalType] = useState(""); // "airline", "aircraft", "airport"

  // Estados de datos conectados al Backend
  const [airlines, setAirlines] = useState([]);
  const [aircrafts, setAircrafts] = useState([]);
  const [airports, setAirports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Carga inicial de datos
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchAirlines(),
        fetchAircrafts(),
        fetchAirports()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAirlines = () => axios.get("config/aerolineas/")
    .then(res => {
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
      setAirlines(data);
    }).catch(console.error);

  const fetchAircrafts = () => axios.get("config/aeronaves/")
    .then(res => {
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
      setAircrafts(data);
    }).catch(console.error);

  const fetchAirports = () => axios.get("config/aeropuertos/")
    .then(res => {
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
      setAirports(data);
    }).catch(console.error);

  const toggleTab = tab => {
    if (activeTab !== tab) setActiveTab(tab);
    setSearchTerm("");
    setIsSearchOpen(false);
  };

  const toggleModal = () => setModalOpen(!modalOpen);

  const openModal = (type, data = null) => {
    setModalType(type);
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

  const handleRefresh = (e, onSearch, type) => {
    e.preventDefault();
    setSearchTerm("");
    onSearch("");
    if (type === 'airline') fetchAirlines();
    if (type === 'aircraft') fetchAircrafts();
    if (type === 'airport') fetchAirports();
  };

  const handleExportExcel = async (e) => {
    e.preventDefault();
    const endpointsMap = { '1': 'aerolineas', '2': 'aeronaves', '3': 'aeropuertos' };
    try {
      const response = await axios.get(`config/${endpointsMap[activeTab]}/export/excel/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `diccionario_${endpointsMap[activeTab]}.csv`);
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
    const endpointsMap = { '1': 'aerolineas', '2': 'aeronaves', '3': 'aeropuertos' };
    try {
      const response = await axios.get(`config/${endpointsMap[activeTab]}/export/pdf/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reporte_${endpointsMap[activeTab]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error al exportar PDF:", error);
      Swal.fire('Error', 'No se pudo generar el reporte PDF', 'error');
    }
  };

// HASTA AQUI
  // Función unificada para Guardar (Crear o Editar)
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = Object.fromEntries(formData.entries());
    
    // El backend espera enteros para la capacidad
    if (payload.capacidad_max_pasajeros) payload.capacidad_max_pasajeros = parseInt(payload.capacidad_max_pasajeros);

    // Determinar endpoint según el tipo
    const endpoints = { airline: 'aerolineas', aircraft: 'aeronaves', airport: 'aeropuertos' };
    const url = `config/${endpoints[modalType]}/`;

    try {
      if (editData) {
        await axios.put(`${url}${editData.id}/`, payload);
        Swal.fire('Éxito', 'Registro actualizado correctamente', 'success');
      } else {
        await axios.post(url, payload);
        Swal.fire('Éxito', 'Registro creado correctamente', 'success');
      }
      
      // Refrescar la lista correspondiente
      if (modalType === 'airline') fetchAirlines();
      if (modalType === 'aircraft') fetchAircrafts();
      if (modalType === 'airport') fetchAirports();
      
      toggleModal();
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : "Error de conexión";
      Swal.fire('Error', errorMsg, 'error');
    }
  };

  const handleDelete = (id, type) => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "Esta acción no se puede deshacer.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#4d53e0',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const endpoints = { airline: 'aerolineas', aircraft: 'aeronaves', airport: 'aeropuertos' };
        axios.delete(`config/${endpoints[type]}/${id}/`)
          .then(() => {
            if (type === 'airline') fetchAirlines();
            if (type === 'aircraft') fetchAircrafts();
            if (type === 'airport') fetchAirports();
            Swal.fire('Eliminado', 'El registro ha sido borrado.', 'success');
          })
          .catch(() => Swal.fire('Error', 'No se pudo eliminar el registro', 'error'));
      }
    });
  };

  const actionFormatter = (cell, row, type) => (
    <div className="d-flex justify-content-center">
      <Button size="sm" color="info" className="mr-1" onClick={() => openModal(type, row)}>
        <i className="eva eva-edit-2" />
      </Button>
      <Button size="sm" color="danger" onClick={() => handleDelete(row.id, type)}>
        <i className="eva eva-trash-2" />
      </Button>
    </div>
  );

  const airlineNameFormatter = (cell, row) => (
    <div className="d-flex align-items-center justify-content-start">
      {row.logo_url ? (
        <img 
          src={row.logo_url} 
          alt={row.nombre_oficial} 
          className="mr-2"
          style={{ width: '100px', height: '50px', objectFit: 'contain' }} 
        />
      ) : (
        <i className="eva eva-image-outline mr-2 text-muted" style={{ fontSize: '20px' }} />
      )}
      {cell}
    </div>
  );

  const airlineColumns = [
    { dataField: "nombre_oficial", text: "Nombre Oficial", sort: true },
    { dataField: "codigo_iata", text: "IATA", sort: true },
    { dataField: "codigo_icao", text: "ICAO", sort: true },
    { dataField: "logo", text: "LOGO/EMPRESA", sort: true, formatter: airlineNameFormatter, headerAlign: 'left' },
    { dataField: "id", text: "Acciones", formatter: (c, r) => actionFormatter(c, r, 'airline'), headerStyle: { width: '100px' } }
  ];

  const aircraftColumns = [
    { dataField: "modelo", text: "Modelo", sort: true },
    { dataField: "capacidad_max_pasajeros", text: "Capacidad (PAX)", sort: true },
    { dataField: "envergadura_categoria", text: "Categoría", sort: true },
    { dataField: "id", text: "Acciones", formatter: (c, r) => actionFormatter(c, r, 'aircraft'), headerStyle: { width: '100px' } }
  ];

  const airportColumns = [
    { dataField: "codigo_iata", text: "IATA", sort: true },
    { dataField: "nombre_completo", text: "Nombre", sort: true },
    { dataField: "ciudad", text: "Ciudad", sort: true },
    { dataField: "pais", text: "País", sort: true },
    { dataField: "codigo_icao", text: "ICAO", sort: true },
    { dataField: "id", text: "Acciones", formatter: (c, r) => actionFormatter(c, r, 'airport'), headerStyle: { width: '100px' } }
  ];
// ESO
  return (
    <Row className="mb-4">
      <Col className="widget-table-overflow" xs={12}>
        <Widget className="widget-p-md">
          <div className="headline-2 mb-3">Diccionarios Maestros (Metadatos)</div>
          
          <Nav tabs className="mb-4">
            <NavItem>
              <NavLink className={classnames({ active: activeTab === '1' })} onClick={() => toggleTab('1')}>
                Aerolíneas
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink className={classnames({ active: activeTab === '2' })} onClick={() => toggleTab('2')}>
                Aeronaves
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink className={classnames({ active: activeTab === '3' })} onClick={() => toggleTab('3')}>
                Aeropuertos
              </NavLink>
            </NavItem>
          </Nav>

          <TabContent activeTab={activeTab}>
            {/* Tab Aerolíneas */}
            <TabPane tabId="1">
              <ToolkitProvider keyField="id" data={airlines} columns={airlineColumns} search>
                {props => (
                  <div>
                    <div className="d-flex align-items-center justify-content-end mb-3 pr-2">
                      {isSearchOpen && (
                        <Input
                          size="sm"
                          className="mr-2"
                          placeholder="Buscar aerolínea..."
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
                      <a href="/#" className="ml-3" onClick={(e) => handleRefresh(e, props.searchProps.onSearch, 'airline')}><i className="eva eva-refresh" title="Limpiar" /></a>
                      <a href="/#" className="ml-3" onClick={(e) => { e.preventDefault(); openModal('airline'); }}><i className="eva eva-plus" title="Nueva Aerolínea" /></a>
                    </div>
                    <BootstrapTable { ...props.baseProps } bordered={false} classes="table-hover table-striped" />
                  </div>
                )}
              </ToolkitProvider>
            </TabPane>

            {/* Tab Aeronaves */}
            <TabPane tabId="2">
              <ToolkitProvider keyField="id" data={aircrafts} columns={aircraftColumns} search>
                {props => (
                  <div>
                    <div className="d-flex align-items-center justify-content-end mb-3 pr-2">
                      {isSearchOpen && (
                        <Input
                          size="sm"
                          className="mr-2"
                          placeholder="Buscar aeronave..."
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
                      <a href="/#" className="ml-3" onClick={(e) => handleRefresh(e, props.searchProps.onSearch, 'aircraft')}><i className="eva eva-refresh" title="Limpiar" /></a>
                      <a href="/#" className="ml-3" onClick={(e) => { e.preventDefault(); openModal('aircraft'); }}><i className="eva eva-plus" title="Nueva Aeronave" /></a>
                      
                    </div>
                    <BootstrapTable { ...props.baseProps } bordered={false} classes="table-hover table-striped" />
                  </div>
                )}
              </ToolkitProvider>
            </TabPane>

            {/* Tab Aeropuertos */}
            <TabPane tabId="3">
              <ToolkitProvider keyField="id" data={airports} columns={airportColumns} search>
                {props => (
                  <div>
                    <div className="d-flex align-items-center justify-content-end mb-3 pr-2">
                      {isSearchOpen && (
                        <Input
                          size="sm"
                          className="mr-2"
                          placeholder="Buscar aeropuerto..."
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
                      <a href="/#" className="ml-3" onClick={(e) => handleRefresh(e, props.searchProps.onSearch, 'airport')}><i className="eva eva-refresh" title="Limpiar" /></a>
                      <a href="/#" className="ml-3" onClick={(e) => { e.preventDefault(); openModal('airport'); }}><i className="eva eva-plus" title="Nuevo Aeropuerto" /></a>
                    </div>
                    <BootstrapTable { ...props.baseProps } bordered={false} classes="table-hover table-striped" />
                  </div>
                )}
              </ToolkitProvider>
            </TabPane>
          </TabContent>
        </Widget>
      </Col>

      {/* Modal Dinámico para Crear/Editar */}
      <Modal isOpen={modalOpen} toggle={toggleModal} key={editData ? editData.id : 'new'}>
        <form onSubmit={handleSubmit}>
          <ModalHeader toggle={toggleModal}>
            {editData ? 'Editar' : 'Agregar'} {modalType === 'airline' ? 'Aerolínea' : modalType === 'aircraft' ? 'Aeronave' : 'Aeropuerto'}
          </ModalHeader>
          <ModalBody>
            {modalType === 'airline' && (
              <>
                <FormGroup><Label>Nombre Oficial</Label><Input name="nombre_oficial" defaultValue={editData?.nombre_oficial} required /></FormGroup>
                <FormGroup><Label>Código IATA</Label><Input name="codigo_iata" defaultValue={editData?.codigo_iata} required maxLength="3" /></FormGroup>
                <FormGroup><Label>Código ICAO</Label><Input name="codigo_icao" defaultValue={editData?.codigo_icao} required maxLength="4" /></FormGroup>
                <FormGroup><Label>Logo URL</Label><Input name="logo_url" defaultValue={editData?.logo_url} /></FormGroup>
              </>
            )}
            {modalType === 'aircraft' && (
              <>
                <FormGroup><Label>Modelo</Label><Input name="modelo" defaultValue={editData?.modelo} required /></FormGroup>
                <FormGroup><Label>Capacidad Máxima (PAX)</Label><Input name="capacidad_max_pasajeros" type="number" defaultValue={editData?.capacidad_max_pasajeros} required /></FormGroup>
                <FormGroup><Label>Categoría de Envergadura</Label><Input name="envergadura_categoria" defaultValue={editData?.envergadura_categoria} required placeholder="Ej: CAT_C" /></FormGroup>
              </>
            )}
            {modalType === 'airport' && (
              <>
                <FormGroup><Label>Nombre Completo</Label><Input name="nombre_completo" defaultValue={editData?.nombre_completo} required /></FormGroup>
                <FormGroup><Label>Ciudad</Label><Input name="ciudad" defaultValue={editData?.ciudad} required /></FormGroup>
                <FormGroup><Label>País</Label><Input name="pais" defaultValue={editData?.pais} required /></FormGroup>
                <FormGroup><Label>Código IATA</Label><Input name="codigo_iata" defaultValue={editData?.codigo_iata} required maxLength="3" /></FormGroup>
                <FormGroup><Label>Código ICAO</Label><Input name="codigo_icao" defaultValue={editData?.codigo_icao} required maxLength="4" /></FormGroup>
              </>
            )}
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

export default DiccionariosPage;