import React, { Component } from "react";
import { Formik } from "formik";
import * as Yup from "yup";
import Loader from "../../Loader/Loader";
import InputFormItem from "../../FormItems/items/InputFormItem";
import Widget from "../../Widget/Widget";

const ChangePasswordForm = (props) => {

  const { saveLoading, onSubmit, onCancel } = props;

  const passwordSchema = {
    currentPassword: { type: 'string', label: 'Contraseña Actual' },
    newPassword: { type: 'string', label: 'Nueva Contraseña' },
    confirmNewPassword: { type: 'string', label: 'Confirmar Nueva Contraseña' },
  };

  // Validaciones para el cambio de contraseña
  const validationSchema = Yup.object().shape({
    currentPassword: Yup.string()
      .required('Contraseña actual es requerida')
      .min(6, 'Debe tener al menos 6 caracteres'),
    newPassword: Yup.string()
      .required('Nueva contraseña es requerida')
      .min(8, 'Debe tener al menos 8 caracteres')
      .matches(/[A-Z]/, 'Debe contener al menos una mayúscula')
      .matches(/[0-9]/, 'Debe contener al menos un número'),
    confirmNewPassword: Yup.string()
      .required('Debe confirmar la nueva contraseña')
      .oneOf([Yup.ref('newPassword')], 'Las contraseñas no coinciden'),
  });

  const handleSubmit = (values) => {
    onSubmit(values);
  };

  const renderForm = () => {
    return (
      <Widget className="widget-p-md">
        <Formik
          onSubmit={handleSubmit}
          initialValues={{
            currentPassword: '',
            newPassword: '',
            confirmNewPassword: '',
          }}
          validationSchema={validationSchema}
        >
          {(form) => {
            return (
              <form onSubmit={form.handleSubmit}>
                <div className="headline-2 mb-4 text-center text-primary">
                  Cambiar Contraseña
                </div>

                <InputFormItem
                  name={'currentPassword'}
                  password
                  schema={passwordSchema}
                />

                <InputFormItem
                  name={'newPassword'}
                  password
                  schema={passwordSchema}
                />

                <InputFormItem
                  name={'confirmNewPassword'}
                  password
                  schema={passwordSchema}
                />

                <div className="mt-4">
                  <button
                    className="btn btn-primary mr-3"
                    disabled={saveLoading}
                    type="submit"
                  >
                    {saveLoading ? 'Cambiando...' : 'Cambiar Contraseña'}
                  </button>
                  <button
                    className="btn btn-secondary"
                    type="button"
                    disabled={saveLoading}
                    onClick={onCancel}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )
          }}
        </Formik>
      </Widget>
    );
  }

  return renderForm();

}

export default ChangePasswordForm;
