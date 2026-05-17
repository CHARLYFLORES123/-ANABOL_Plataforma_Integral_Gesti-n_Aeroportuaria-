import React, { useEffect, useState } from "react";
import { Formik } from "formik";
import axios from "axios";
import config from "../../../config";
import {
  Container,
  Row,
  Col,
  Label,
  Button,
  FormGroup,
  Input,
  FormFeedback,
} from "reactstrap";
import Loader from "../../Loader/Loader";
import InputFormItem from "../../FormItems/items/InputFormItem";
import SwitchFormItem from "../../FormItems/items/SwitchFormItem";
import ImagesFormItem from "../../FormItems/items/ImagesFormItem";
import usersFields from "../usersFields";
import IniValues from "../../FormItems/iniValues";
import PreparedValues from "../../FormItems/preparedValues";
import FormValidations from "../../FormItems/formValidations";
import Widget from "../../Widget/Widget";

const UsersForm = (props) => {
  // Log para ver qué recibe el componente realmente
  console.log(
    "FORM PROPS - roles:",
    props.roles,
    "loading:",
    props.loadingRoles,
  );

  const {
    isEditing,
    isProfile,
    findLoading,
    saveLoading,
    record,
    onSubmit,
    onCancel,
    modal,
    currentUser,
    roles = [], // Aseguramos que sea un array por defecto
    loadingRoles,
  } = props;

  const [localRoles, setLocalRoles] = useState(roles);
  const rolesToShow = localRoles && localRoles.length > 0 ? localRoles : roles;

  useEffect(() => {
    setLocalRoles(roles);
  }, [roles]);

  useEffect(() => {
    if ((!roles || roles.length === 0) && !loadingRoles) {
      console.log(
        "%c UsersForm: direct roles fetch porque props.roles está vacío",
        "background: #1abc9c; color: #fff",
      );
      axios
        .get(`${config.baseURLApi}roles/`)
        .then((response) => {
          const data = Array.isArray(response.data) ? response.data : [];
          const mappedRoles = data.map((role) => {
            const roleName = role.role_name || role.id || String(role);
            const capitalizedLabel =
              roleName.charAt(0).toUpperCase() +
              roleName.slice(1).toLowerCase();
            return { value: roleName, label: capitalizedLabel };
          });
          setLocalRoles(mappedRoles);
        })
        .catch((error) => {
          console.error("UsersForm: error cargando roles directamente", error);
        });
    }
  }, [roles, loadingRoles]);

  console.log(
    "FORM PROPS - rolesToShow:",
    rolesToShow,
    "initial roles:",
    roles,
    "loadingRoles:",
    loadingRoles,
  );

  const iniValues = () => {
    return IniValues(usersFields, record || {});
  };

  const formValidations = () => {
    return FormValidations(usersFields, record || {});
  };

  const handleSubmit = (values) => {
    const { id, ...data } = PreparedValues(usersFields, values || {});
    onSubmit(id, data);
  };

  const title = () => {
    if (isProfile) return "Editar Mi Perfil";
    return isEditing ? "Editar Usuario" : "Agregar Usuario";
  };

  // Comprobación robusta para mostrar el campo Rol
  const isAdmin =
    currentUser &&
    // Check if role is a string and contains "admin"
    ((typeof currentUser.role === "string" &&
      currentUser.role.toLowerCase().includes("admin")) ||
      // Check if role is an object with role_name and it contains "admin"
      (currentUser.role &&
        typeof currentUser.role === "object" &&
        typeof currentUser.role.role_name === "string" &&
        currentUser.role.role_name.toLowerCase().includes("admin")) ||
      // Check if role is an object with name and it contains "admin"
      (currentUser.role &&
        typeof currentUser.role === "object" &&
        typeof currentUser.role.name === "string" &&
        currentUser.role.name.toLowerCase().includes("admin")) ||
      // Check for isStaff or is_staff boolean flags
      currentUser.isStaff ||
      currentUser.is_staff);

  const showRoleField = !isProfile || isAdmin;
  console.log(
    "FORM showRoleField:",
    showRoleField,
    "isProfile:",
    isProfile,
    "isAdmin:",
    isAdmin,
  );

  const renderForm = () => (
    <div className="provider-form">
      <Formik
        onSubmit={handleSubmit}
        enableReinitialize={true}
        initialValues={iniValues()}
        validationSchema={formValidations()}
      >
        {(form) => (
          <form
            onSubmit={form.handleSubmit}
            className="mx-auto"
            style={{ width: "100%", maxWidth: "700px" }}
          >
            <div className="headline-2 mb-4 text-center text-primary">
              {title()}
            </div>
            <Container fluid className="px-0">
              <section className="mb-3">
                <Row>
                  <Col md={6} className="mb-2">
                    <InputFormItem
                      name={"firstName"}
                      label="Nombre"
                      schema={usersFields}
                    />
                  </Col>
                  <Col md={6} className="mb-2">
                    <InputFormItem
                      name={"lastName"}
                      label="Apellidos"
                      schema={usersFields}
                    />
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <InputFormItem
                      name={"username"}
                      label="Nombre de Usuario"
                      schema={usersFields}
                    />
                  </Col>
                  <Col md={6}>
                    {!isEditing && (
                      <FormGroup className="mb-0">
                        <InputFormItem
                          name={"password"}
                          type="password"
                          schema={usersFields}
                        />
                      </FormGroup>
                    )}
                    {isEditing && (
                      <div className="mt-4 text-muted small">
                        La contraseña solo se puede cambiar en la sección de
                        perfil.
                      </div>
                    )}
                  </Col>
                </Row>
              </section>

              <section className="mb-3">
                <Row>
                  <Col md={6} className="mb-2">
                    <InputFormItem
                      name={"email"}
                      label="Correo Electrónico"
                      schema={usersFields}
                    />
                  </Col>
                  <Col md={6} className="mb-2">
                    <InputFormItem
                      name={"phoneNumber"}
                      label="Teléfono"
                      schema={usersFields}
                    />
                  </Col>
                </Row>
              </section>

              <section className="mb-3">
                <Row>
                  <Col md={6} className="mb-2">
                    <ImagesFormItem
                      name={"avatar"}
                      schema={usersFields}
                      path={"avatars"}
                      max={1}
                    />
                  </Col>
                  <Col md={6}>
                    {showRoleField && (
                      <FormGroup className="mb-3">
                        <Label  for="role-select">
                          Rol del Sistema
                        </Label>
                        <Input
                          type="select"
                          name="role"
                          id="role-select"
                          value={
                            form.values.role &&
                            typeof form.values.role === "object"
                              ? form.values.role.role_name ||
                                form.values.role.name ||
                                ""
                              : form.values.role || ""
                          }
                          onChange={form.handleChange}
                          onBlur={form.handleBlur}
                          invalid={form.touched.role && !!form.errors.role}
                        >
                          <option value="">Seleccione un rol...</option>
                          {loadingRoles ? (
                            <option disabled>Cargando roles...</option>
                          ) : rolesToShow.length === 0 ? (
                            <option disabled>
                              No hay roles disponibles en la BD
                            </option>
                          ) : (
                            rolesToShow.map((r) => (
                              <option key={r.value} value={r.value}>
                                {r.label}
                              </option>
                            ))
                          )}
                        </Input>
                        {form.touched.role && form.errors.role && (
                          <FormFeedback>{form.errors.role}</FormFeedback>
                        )}
                      </FormGroup>
                    )}
                  </Col>
                  <Col md={6} className="mb-2 d-flex align-items-center">
                    <div className="mr-4">
                      <SwitchFormItem
                        name={"isStaff"}
                        label="¿Es Staff?"
                        schema={usersFields}
                      />
                    </div>
                    <div>
                      <SwitchFormItem
                        name={"disabled"}
                        label="Desactivar Usuario"
                        schema={usersFields}
                      />
                    </div>
                  </Col>
                </Row>
              </section>
            </Container>

            <div className="form-buttons mt-3 d-flex justify-content-end">
              <Button
                color="primary"
                className="mr-3 btn-rounded shadow-sm"
                disabled={saveLoading}
                type="submit"
              >
                {saveLoading ? "Guardando..." : "Guardar Usuario"}
              </Button>
              <Button color="secondary" outline type="button" onClick={() => onCancel()}>
                Cancelar
              </Button>
            </div>
          </form>
        )}
      </Formik>
    </div>
  );

  if (findLoading) {
    return <Loader />;
  }

  if ((isEditing || isProfile) && !record) {
    return <Loader />;
  }

  return renderForm();
};

export default UsersForm;
