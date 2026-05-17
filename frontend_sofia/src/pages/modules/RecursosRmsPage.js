import React, { useState, useEffect } from "react";
import { Row, Col, Progress, Badge } from "reactstrap";
import Swal from 'sweetalert2';
import Widget from "../../components/Widget/Widget.js";
import Loader from "../../components/Loader/Loader";
import axios from "axios";

const RecursosRmsPage = () => {
  const [stats, setStats] = useState({
    puertas: { total: 0, disponible: 0, ocupada: 0, mantenimiento: 0 },
    mostradores: { total: 0, activo: 0, cerrado: 0 },
    cintas: { total: 0, disponible: 0, en_uso: 0 },
    posiciones: { total: 0, libre: 0, ocupada: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [alertas, setAlerts] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [resPuertas, resCounters, resCintas, resPos] = await Promise.all([
        axios.get("recursos-rms/puertas/"),
        axios.get("recursos-rms/mostradores/"),
        axios.get("recursos-rms/cintas/"),
        axios.get("recursos-rms/posiciones/")
      ]);

      const puertas = resPuertas.data.results || resPuertas.data;
      const counters = resCounters.data.results || resCounters.data;
      const cintas = resCintas.data.results || resCintas.data;
      const posiciones = resPos.data.results || resPos.data;

      setStats({
        puertas: {
          total: puertas.length,
          disponible: puertas.filter(p => p.estado === 'DISPONIBLE').length,
          ocupada: puertas.filter(p => p.estado === 'OCUPADA').length,
          mantenimiento: puertas.filter(p => p.estado === 'MANTENIMIENTO').length
        },
        mostradores: {
          total: counters.length,
          activo: counters.filter(c => c.estado === 'ACTIVO').length,
          cerrado: counters.filter(c => c.estado === 'CERRADO').length
        },
        cintas: {
          total: cintas.length,
          disponible: cintas.filter(c => c.estado === 'ACTIVO' || c.estado === 'DISPONIBLE').length,
          en_uso: cintas.filter(c => c.estado === 'EN_USO').length
        },
        posiciones: {
          total: posiciones.length,
          libre: posiciones.filter(p => p.estado === 'LIBRE').length,
          ocupada: posiciones.filter(p => p.estado === 'OCUPADA').length
        }
      });

      // Lógica de Alertas automáticas
      const nuevasAlertas = [];
      if (puertas.filter(p => p.estado === 'DISPONIBLE').length < 2) {
        nuevasAlertas.push({ msg: "Crítico: Pocas puertas de embarque disponibles", color: "danger" });
      }
      setAlerts(nuevasAlertas);

    } catch (error) {
      console.error("Error cargando dashboard", error);
      Swal.fire('Error', 'No se pudo sincronizar el estado de los recursos', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="p-4">
      <h2 className="page-title mb-4">Dashboard de Recursos <small className="text-muted">RMS Live</small></h2>
      
      <Row>
        {/* KPIs de Puertas */}
        <Col lg={3} md={6} xs={12}>
          <Widget title={<h6>PUERTAS DE EMBARQUE</h6>} className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="display-4">{stats.puertas.disponible}</span>
              <div className="text-right">
                <Badge color="success">Disponibles</Badge>
                <div className="text-muted small">Total: {stats.puertas.total}</div>
              </div>
            </div>
            <Progress value={(stats.puertas.disponible / stats.puertas.total) * 100} color="success" size="sm" className="mb-1" />
            <small className="text-muted">Ocupación: {Math.round((stats.puertas.ocupada / stats.puertas.total) * 100)}%</small>
          </Widget>
        </Col>

        {/* KPIs de Mostradores */}
        <Col lg={3} md={6} xs={12}>
          <Widget title={<h6>MOSTRADORES CHECK-IN</h6>} className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="display-4">{stats.mostradores.activo}</span>
              <div className="text-right">
                <Badge color="primary">Abiertos</Badge>
                <div className="text-muted small">Total: {stats.mostradores.total}</div>
              </div>
            </div>
            <Progress value={(stats.mostradores.activo / stats.mostradores.total) * 100} color="primary" size="sm" className="mb-1" />
            <small className="text-muted">Capacidad Operativa</small>
          </Widget>
        </Col>

        {/* KPIs de Cintas */}
        <Col lg={3} md={6} xs={12}>
          <Widget title={<h6>CINTAS DE EQUIPAJE</h6>} className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="display-4">{stats.cintas.en_uso}</span>
              <div className="text-right">
                <Badge color="warning">En Uso</Badge>
                <div className="text-muted small">Libres: {stats.cintas.disponible}</div>
              </div>
            </div>
            <Progress value={(stats.cintas.en_uso / stats.cintas.total) * 100} color="warning" size="sm" className="mb-1" />
            <small className="text-muted">Gestión de Llegadas</small>
          </Widget>
        </Col>

        {/* KPIs de Posiciones */}
        <Col lg={3} md={6} xs={12}>
          <Widget title={<h6>POSICIONES RAMPA</h6>} className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="display-4">{stats.posiciones.libre}</span>
              <div className="text-right">
                <Badge color="info">Libres</Badge>
                <div className="text-muted small">Total: {stats.posiciones.total}</div>
              </div>
            </div>
            <Progress value={(stats.posiciones.libre / stats.posiciones.total) * 100} color="info" size="sm" className="mb-1" />
            <small className="text-muted">Disponibilidad de Estacionamiento</small>
          </Widget>
        </Col>
      </Row>

      <Row>
        <Col lg={8}>
          <Widget title={<h5>Estado Operativo Global</h5>}>
             <p>Aquí puedes integrar gráficos de <strong>Recharts</strong> para mostrar tendencias horarias de ocupación.</p>
             <div className="bg-light p-5 text-center border rounded">
                <i className="eva eva-pie-chart-outline text-muted" style={{fontSize: '50px'}} />
                <p className="mt-2">Espacio reservado para gráficas de ocupación temporal</p>
             </div>
          </Widget>
        </Col>
        <Col lg={4}>
          <Widget title={<h5>Alertas del Sistema</h5>}>
            {alertas.length > 0 ? alertas.map((a, i) => (
              <div key={i} className={`alert alert-${a.color} fade show`}>
                {a.msg}
              </div>
            )) : (
              <div className="text-center p-4">
                <i className="eva eva-checkmark-circle-2-outline text-success d-block mb-2" style={{fontSize: '40px'}} />
                <span className="text-muted">Operación Normal: Sin alertas</span>
              </div>
            )}
          </Widget>
        </Col>
      </Row>
    </div>
  );
};

export default RecursosRmsPage;
