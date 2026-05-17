import React from "react";
import { Row, Col } from "reactstrap";
import Widget from "../../components/Widget/Widget";

const PantallasFidsPage = () => (
  <Row>
    <Col xs={12}>
      <Widget>
        <div className="headline-2">Pantallas FIDS</div>
        <p className="body-1 muted mt-3">
          Aquí se mostrará la vista del módulo de Pantallas FIDS. Personaliza los elementos visuales y datos según el flujo de la aplicación.
        </p>
      </Widget>
    </Col>
  </Row>
);

export default PantallasFidsPage;
