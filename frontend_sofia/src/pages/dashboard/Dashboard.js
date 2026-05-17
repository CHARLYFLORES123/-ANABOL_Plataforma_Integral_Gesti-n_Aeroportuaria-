import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  Col,
  Row,
  Progress,
  Button,
  ButtonDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  UncontrolledDropdown
} from "reactstrap";
import Widget from "../../components/Widget/Widget.js";
import ApexActivityChart from "./components/ActivityChart.js";
import ApexCharts from "react-apexcharts";
import {
  RadialBar,
  RadialBarChart,
  Legend,
  PieChart,
  Pie,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

import meal1 from "../../assets/dashboard/meal-1.svg";
import meal2 from "../../assets/dashboard/meal-2.svg";
import meal3 from "../../assets/dashboard/meal-3.svg";
import upgradeImage from "../../assets/dashboard/upgradeImage.svg";
import heartRed from "../../assets/dashboard/heartRed.svg";
import heartTeal from "../../assets/dashboard/heartTeal.svg";
import heartViolet from "../../assets/dashboard/heartViolet.svg";
import heartYellow from "../../assets/dashboard/heartYellow.svg";
import gymIcon from "../../assets/dashboard/gymIcon.svg";
import therapyIcon from "../../assets/dashboard/therapyIcon.svg";
import user from "../../assets/user.svg";
import statsPie from "../../assets/dashboard/statsPie.svg";

import s from "./Dashboard.module.scss";

// Datos de ejemplo para las nuevas gráficas
const chartsData = {
  apexCharts: {
    vuelosAodbActivity: {
      series: [
        { name: 'Salidas', data: [45, 52, 38, 65, 48, 87, 76] },
        { name: 'Llegadas', data: [35, 41, 62, 42, 33, 48, 52] }
      ],
      options: {
        chart: { type: 'area', height: 300, toolbar: { show: false } },
        colors: ['#4d53e0', '#41D5E2'],
        stroke: { curve: 'smooth', width: 2 },
        dataLabels: { enabled: false },
        xaxis: { categories: ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'] },
        legend: { position: 'top', horizontalAlign: 'right' }
      }
    },
    recursosRmsBar: {
      series: [{ name: 'Ocupación %', data: [82, 65, 48, 91] }],
      options: {
        chart: { type: 'bar', height: 250, toolbar: { show: false } },
        plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: '60%' } },
        colors: ['#FFC405'],
        xaxis: { categories: ['Puertas', 'Mostradores', 'Cintas', 'Plataforma'] },
        dataLabels: { enabled: true, formatter: (val) => val + '%' }
      }
    },
    pantallasFidsDonut: {
      series: [124, 12, 4],
      options: {
        chart: { type: 'donut' },
        labels: ['Online', 'Mantenimiento', 'Offline'],
        colors: ['#43BC13', '#FFC405', '#FF5668'],
        legend: { position: 'bottom' },
        plotOptions: { pie: { donut: { size: '65%' } } }
      },
    },
  },
  recharts: {
    seguridadIamRoles: [
      { name: 'Admin', value: 15 },
      { name: 'Operador', value: 55 },
      { name: 'Supervisor', value: 20 },
      { name: 'Seguridad', value: 10 },
    ],
  },
};

export default function Dashboard() {
  const [checkboxes, setCheckboxes] = useState([true, false])

  const toggleCheckbox = (id) => {
    setCheckboxes(checkboxes => checkboxes
      .map((checkbox, index) => index === id ? !checkbox : checkbox ))
  }

  const radialChartStyle = {
    top: '50%',
    right: 0,
    transform: 'translate(0, -50%)',
    lineHeight: '24px',
  };

  const { apexCharts, recharts, highcharts } = chartsData;
  const meals = [meal1, meal2, meal3];

  return (
    <div>
      <Row>
        <Col className="pr-grid-col" xs={12} lg={9}>
          <Row className="gutter mb-4">
            <Col className="mb-4 mb-md-0" xs={12} md={8}>
              <Widget className="widget-p-md">
                <div className="headline-3 mb-3">Vuelos AODB: Tráfico Semanal</div>
                <ApexCharts
                  options={apexCharts.vuelosAodbActivity.options}
                  series={apexCharts.vuelosAodbActivity.series}
                  type="area"
                  height={300}
                />
              </Widget>
            </Col>
            <Col xs={12} md={4}>
              <Widget className="widget-p-md">
                <div className="headline-3 mb-3">Seguridad IAM: Roles</div>
                <div style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={recharts.seguridadIamRoles} 
                        dataKey="value" 
                        cx="50%" 
                        cy="50%" 
                        innerRadius={60} 
                        outerRadius={80} 
                        fill="#4d53e0" 
                        paddingAngle={5}
                        label 
                      />
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Widget>
            </Col>
          </Row>
          <Row className="gutter mb-4">
            <Col xs={12} md={6}>
              <Widget className="widget-p-md">
                <div className="headline-3 mb-3">Recursos RMS: Ocupación de Infraestructura</div>
                <ApexCharts
                  options={apexCharts.recursosRmsBar.options}
                  series={apexCharts.recursosRmsBar.series}
                  type="bar"
                  height={250}
                />
              </Widget>
            </Col>
            <Col xs={12} md={6}>
              <Widget className="widget-p-md">
                <div className="headline-3 mb-3">Configuración Global: Estado del Sistema</div>
                <Row className="mt-4">
                  <Col xs={6} className="text-center mb-4">
                    <h4 className="fw-bold text-primary">24</h4>
                    <span className="text-muted">Integraciones API</span>
                  </Col>
                  <Col xs={6} className="text-center mb-4">
                    <h4 className="fw-bold text-success">156</h4>
                    <span className="text-muted">Diccionarios</span>
                  </Col>
                  <Col xs={6} className="text-center">
                    <h4 className="fw-bold text-warning">8</h4>
                    <span className="text-muted">Monedas Activas</span>
                  </Col>
                  <Col xs={6} className="text-center">
                    <h4 className="fw-bold text-info">12</h4>
                    <span className="text-muted">Empresas/Aerolíneas</span>
                  </Col>
                </Row >
              </Widget>
            </Col>
          </Row>
        </Col>
        <Col className="mt-4 mt-lg-0 pl-grid-col" xs={12} lg={3}>
          <Widget className="widget-p-md">
            <div className="headline-3 mb-3">Pantallas FIDS: Salud de Dispositivos</div>
            <ApexCharts
              type="donut"
              series={apexCharts.pantallasFidsDonut.series}
              options={apexCharts.pantallasFidsDonut.options}
              height={300}
            />
            <div className="mt-4">
              <div className="d-flex justify-content-between mb-2">
                <span>Uso de CPU Global</span>
                <span className="fw-bold">24%</span>
              </div>
              <Progress color="primary" value="24" className="progress-sm" />
            </div>
            <div className="mt-4">
              <div className="d-flex justify-content-between mb-2">
                <span>Uso de Memoria RAM</span>
                <span className="fw-bold">48%</span>
              </div>
              <Progress color="success" value="48" className="progress-sm" />
            </div>

            <hr className="my-4" />
            <div className="headline-3 mb-3">Estadísticas por Módulo</div>
            <Row className="text-center">
              <Col xs={6} className="mb-3">
                <h5 className="fw-bold mb-0">12</h5>
                <small className="text-muted text-uppercase" style={{ fontSize: '10px' }}>Plantillas</small>
              </Col>
              <Col xs={6} className="mb-3">
                <h5 className="fw-bold mb-0">140</h5>
                <small className="text-muted text-uppercase" style={{ fontSize: '10px' }}>Dispositivos</small>
              </Col>
              <Col xs={6}>
                <h5 className="fw-bold mb-0">5</h5>
                <small className="text-muted text-uppercase" style={{ fontSize: '10px' }}>Mensajería</small>
              </Col>
              <Col xs={6}>
                <h5 className="fw-bold mb-0">8</h5>
                <small className="text-muted text-uppercase" style={{ fontSize: '10px' }}>Zonas</small>
              </Col>
            </Row>
          </Widget>
        </Col>
      </Row>
    </div>
  )
}
