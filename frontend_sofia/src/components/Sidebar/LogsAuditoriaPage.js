import React, { useState, useEffect } from "react";
import { Row, Col, Input } from "reactstrap";
import BootstrapTable from "react-bootstrap-table-next";
import ToolkitProvider, { Search } from 'react-bootstrap-table2-toolkit/dist/react-bootstrap-table2-toolkit';
import Widget from "../../components/Widget/Widget.js";
import Loader from "../../components/Loader/Loader";
import axios from "axios";
import 'react-bootstrap-table-next/dist/react-bootstrap-table2.min.css';

const LogsAuditoriaPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const endpoint = "seguridad/auditoria/";

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = () => {
    setLoading(true);
    axios.get(endpoint)
      .then(res => setData(Array.isArray(res.data) ? res.data : res.data.results || []))
      .finally(() => setLoading(false));
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
    fetchRecords();
  };

  const columns = [
    { dataField: "fecha_hora", text: "Fecha/Hora", sort: true, formatter: val => new Date(val).toLocaleString() },
    { dataField: "usuario_email", text: "Usuario", sort: true },
    { dataField: "accion", text: "Acción", sort: true },
    { dataField: "tabla_afectada", text: "Recurso", sort: true },
    { dataField: "ip_address", text: "IP Origen" },
    { 
        dataField: "valor_nuevo", 
        text: "Detalles", 
        formatter: (cell) => <small className="text-muted">{cell?.substring(0, 50)}...</small> 
    }
  ];

  return (
    <Row className="mb-4">
      <Col xs={12}>
        <Widget className="widget-p-md">
          <div className="headline-2 mb-3">Logs de Auditoría de Seguridad</div>
          <p className="body-1 muted">Historial de cambios y acciones críticas realizadas en el sistema.</p>
          
          {loading ? <Loader /> : (
            <ToolkitProvider keyField="id" data={data} columns={columns} search>
              {props => (
                <div>
                  <div className="d-flex align-items-center justify-content-end mb-3 pr-2">
                    {isSearchOpen && (
                      <Input
                        size="sm"
                        className="mr-2"
                        placeholder="Filtrar actividad..."
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
                    <a href="/#" className="ml-3" onClick={(e) => handleRefresh(e, props.searchProps.onSearch)}><i className="eva eva-refresh" title="Limpiar" /></a>
                  </div>
                  <BootstrapTable 
                    { ...props.baseProps } 
                    bordered={false} 
                    classes="table-hover table-striped" 
                    noDataIndication={() => (loading ? "Cargando..." : "No se encontraron registros de auditoría")}
                  />
                </div>
              )}
            </ToolkitProvider>
          )}
        </Widget>
      </Col>
    </Row>
  );
};

export default LogsAuditoriaPage;