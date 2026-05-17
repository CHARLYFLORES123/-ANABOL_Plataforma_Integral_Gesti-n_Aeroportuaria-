import React, { useState, useEffect } from "react";
import { Row, Col, Badge, Table } from "reactstrap";
import Widget from "../../components/Widget/Widget.js";
import Loader from "../../components/Loader/Loader";
import axios from "axios";
import Swal from 'sweetalert2';
import SofiaLogo from "../Icons/SofiaLogo";

const MonitorSalidasPage = () => {
  const [data, setData] = useState([]);
  const [airlines, setAirlines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Usamos el mismo endpoint que VueloDiarioPage para consistencia total
  const endpoint = "vuelos/operaciones/";
  const masterAirlinesEndpoint = "config/aerolineas/";

  const fetchAirlines = () => {
    axios.get(masterAirlinesEndpoint)
      .then(res => {
        const rawAirlines = Array.isArray(res.data) ? res.data : res.data.results || [];
        setAirlines(rawAirlines);
      })
      .catch(err => console.error("Error al cargar diccionarios de aerolíneas:", err));
  };

  const fetchRecords = () => {
    if (data.length === 0) setLoading(true);
    
    axios.get(endpoint)
      .then(res => {
        // 1. Extracción de datos idéntica a VueloDiarioPage
        const rawData = Array.isArray(res.data) ? res.data : res.data.results || [];
        
        // 2. Filtrado exclusivo de SALIDAS para este monitor
        // 3. Ordenamiento cronológico robusto
        const salidas = rawData
          .filter(v => v.tipo_operacion === 'SALIDA')
          .sort((a, b) => {
            // Usamos la fecha de operación + STD para ordenar correctamente
            const dateA = new Date(a.std || a.fecha_operacion);
            const dateB = new Date(b.std || b.fecha_operacion);
            return dateA - dateB;
          });
          
        setData(salidas);
      })
      .catch(() => {
        console.error("Error sincronizando con AODB");
        // No bloqueamos con Swal cada 30s si falla, pero informamos en consola
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRecords();
    fetchAirlines(); // Carga los diccionarios maestros para los logos
    
    const interval = setInterval(fetchRecords, 30000);
    // Reloj digital para la cabecera
    const clock = setInterval(() => setCurrentTime(new Date()), 1000);

    return () => {
      clearInterval(interval);
      clearInterval(clock);
    };
  }, []);

  // Formateador de hora estilo aeropuerto (HH:mm)
  // CORRECCIÓN: Extrae la hora directamente del string para evitar desplazamientos por zona horaria
  const formatTime = (vuelo) => {
    const timeStr = vuelo.etd || vuelo.std || vuelo.fecha_operacion;
    if (!timeStr) return "--:--";
    
    // Si el formato es ISO (contiene 'T'), extraemos la parte de la hora directamente
    if (typeof timeStr === 'string' && timeStr.includes('T')) {
      return timeStr.split('T')[1].substring(0, 5);
    }

    // Fallback: si por alguna razón ya es un objeto Date o tiene otro formato
    try {
      const date = new Date(timeStr);
      return date.toISOString().split('T')[1].substring(0, 5);
    } catch (e) {
      return typeof timeStr === 'string' ? timeStr.substring(0, 5) : "--:--";
    }
  };

  const getStatusBadge = (estado) => {
    let color = "info";
    let label = estado ? estado.replace('_', ' ') : 'A TIEMPO';
    
    switch (estado) {
      case 'CANCELADO': color = "danger"; break;
      case 'DEMORADO': color = "warning"; label = "RETRASADO"; break;
      case 'BOARDING': color = "success"; label = "EMBARCANDO"; break;
      case 'DEPARTED': color = "primary"; label = "DESPEGADO"; break;
      case 'LANDED': color = "secondary"; label = "ATERRIZADO"; break;
      case 'A_TIEMPO': color = "success"; label = "A TIEMPO / ON TIME"; break;
      default: color = "info";
    }
    return (
      <Badge color={color} className="text-uppercase" style={{ fontSize: '1.1rem', padding: '6px 12px' }}>
        {label}
      </Badge>
    );
  };

  return (
    <Row className="mb-4">
      <Col xs={12}>
        <Widget className="widget-p-md shadow-lg" style={{ backgroundColor: '#020617', color: '#fff', borderRadius: '12px', border: '1px solid #1e293b' }}>
          
          {/* Encabezado FIDS */}
          <div className="d-flex justify-content-between align-items-center mb-4 border-bottom border-warning pb-3">
            <div className="d-flex align-items-center">
              {/* Bloque Identidad ANABOL */}
              <div className="d-flex align-items-center mr-4 pr-4 border-right border-secondary">
                <SofiaLogo className="mr-3" />
                <span className="h2 mb-0 text-white font-weight-bold" style={{ letterSpacing: '2px' }}>ANABOL</span>
              </div>
              <div>
                <h2 className="mb-0 text-warning" style={{ letterSpacing: '6px', fontWeight: '900', textShadow: '0 0 10px rgba(255,193,7,0.3)' }}>
                  <i className="eva eva-navigation-outline mr-2" /> SALIDAS / DEPARTURES
                </h2>
                <span className="text-muted text-uppercase small" style={{ letterSpacing: '2px' }}>Información de Operaciones AODB Live</span>
              </div>
            </div>
            <div className="text-right">
              <h1 className="mb-0 display-4 font-weight-bold" style={{ fontFamily: 'monospace', color: '#00ff00' }}>
                {currentTime.toLocaleTimeString([], { hour12: false })}
              </h1>
              <span className="text-warning text-uppercase font-weight-bold">{currentTime.toLocaleDateString()}</span>
            </div>
          </div>

          {loading && data.length === 0 ? <Loader /> : (
            <div className="table-responsive">
              <Table className="table-dark table-striped table-hover mb-0" style={{ backgroundColor: 'transparent' }}>
                <thead>
                  <tr className="text-secondary" style={{ borderBottom: '2px solid #334155', letterSpacing: '1px' }}>
                    <th className="py-3 border-0">AEROLÍNEA / AIRLINE</th>
                    <th className="py-3 text-center border-0">HORA / TIME</th>
                    <th className="py-3 border-0">DESTINO / DESTINATION</th>
                    <th className="py-3 text-center border-0">VUELO / FLIGHT</th>
                    <th className="py-3 text-center border-0">PUERTA / GATE</th>
                    <th className="py-3 text-center border-0">COMENTARIOS / REMARKS</th>
                  </tr>
                </thead>
                <tbody style={{ fontSize: '1.5rem', fontFamily: 'monospace' }}>
                  {data.length > 0 ? data.map((v) => {
                    // Buscamos la aerolínea en el diccionario maestro para obtener el logo actualizado
                    const masterAirline = airlines.find(a => 
                      a.id === v.aerolinea_empresa || 
                      a.nombre_oficial === v.aerolinea_nombre ||
                      a.codigo_iata === v.aerolinea_iata
                    );
                    const logoUrl = masterAirline?.logo_url;

                    return (
                    <tr key={v.id} className="border-bottom border-secondary" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                      <td className="py-4 align-middle font-weight-bold">
                        <div className="d-flex align-items-center">
                          {logoUrl ? (
                            <img 
                              src={logoUrl} 
                              alt={v.aerolinea_nombre} 
                              style={{ width: '150px', height: '60px', objectFit: 'contain', filter: 'brightness(1.1) contrast(1.2)' }} 
                            />
                          ) : (
                            <span className="text-info font-weight-bold" style={{ fontSize: '1.2rem' }}>
                              {v.aerolinea_nombre}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 align-middle text-center font-weight-bold" style={{ color: '#00ff00', fontSize: '1.8rem' }}>
                        {formatTime(v)}
                      </td>
                      <td className="py-4 align-middle text-uppercase text-white">
                        {v.aeropuerto_destino_nombre}
                      </td>
                      <td className="py-4 align-middle text-center text-warning font-weight-bold">
                        {v.numero_vuelo}
                      </td>
                      <td className="py-4 align-middle text-center">
                        <Badge color="light" className="text-dark px-3 py-2 font-weight-bold" style={{ fontSize: '1.2rem', minWidth: '60px' }}>
                          {v.puerta_codigo || 'TBD'}
                        </Badge>
                      </td>
                      <td className="py-4 align-middle text-center">
                        {getStatusBadge(v.estado)}
                      </td>
                    </tr>
                  )}) : (
                    <tr>
                      <td colSpan="6" className="text-center py-5 text-muted h4">
                        No hay operaciones de salida programadas para hoy
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          )}

          <div className="mt-4 pt-3 border-top border-secondary text-muted d-flex justify-content-between" style={{ fontSize: '0.8rem' }}>
            <small>ANABOL FIDS SYSTEM v1.0</small>
            <small className="text-warning">Sincronizado con AODB Live - Refresco: 30s</small>
          </div>
        </Widget>
      </Col>
    </Row>
  );
};

export default MonitorSalidasPage;
