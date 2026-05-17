import React from "react";
import { Row, Col } from "reactstrap";
import Widget from "../../components/Widget/Widget";

const PermisosAdminPage = () => (
  <Row>
    <Col xs={12}>
      <Widget>
        <div className="headline-2">Permisos Admin / Configuración Global</div>
        <p className="body-1 muted mt-3">
          Aquí se mostrará la vista del módulo de Permisos Admin y Configuración Global. Agrega los componentes para administrar roles, permisos y ajustes.
        </p>
      </Widget>
    </Col>
  </Row>
);

export default PermisosAdminPage;
