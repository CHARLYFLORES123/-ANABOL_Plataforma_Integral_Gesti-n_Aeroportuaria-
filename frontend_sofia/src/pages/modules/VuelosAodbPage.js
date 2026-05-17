import React from "react";
import { Row, Col } from "reactstrap";
import Widget from "../../components/Widget/Widget";

const VuelosAodbPage = () => (
  <Row>
    <Col xs={12}>
      <Widget>
        <div className="headline-2">Vuelos AODB</div>
        <p className="body-1 muted mt-3">
          Aquí se mostrará la vista del módulo de Vuelos AODB. Agrega las tablas, filtros y navegación propias de este módulo.
        </p>
      </Widget>
    </Col>
  </Row>
);

export default VuelosAodbPage;
