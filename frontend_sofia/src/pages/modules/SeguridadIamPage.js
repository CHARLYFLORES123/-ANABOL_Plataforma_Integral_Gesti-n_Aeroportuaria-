import React from "react";
import { Row, Col } from "reactstrap";
import Widget from "../../components/Widget/Widget";

const SeguridadIamPage = () => (
  <Row>
    <Col xs={12}>
      <Widget>
        <div className="headline-2">Seguridad e IAM</div>
        <p className="body-1 muted mt-3">
          Aquí se mostrará la vista del módulo de Seguridad e IAM. Puedes agregar los componentes y la lógica necesaria en esta página.
        </p>
      </Widget>
    </Col>
  </Row>
);

export default SeguridadIamPage;
