import React, { Fragment, useState, useEffect } from "react";

import classnames from "classnames";
import Flatpickr from "react-flatpickr";
import Select, { components } from "react-select";
import { useForm } from "react-hook-form";
import {
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  FormGroup,
  Label,
  CustomInput,
  Input,
  Form,
  Row,
  Col
} from "reactstrap";

import "eva-icons/style/eva-icons.css";

const AddEventSidebar = props => {
  const {
    store,
    dispatch,
    open,
    handleAddEventSidebar,
    calendarsColor,
    calendarApi,
    refetchEvents,
    addEvent,
    selectEvent,
    updateEvent,
    removeEvent,
    planes = [],
    aerolineas = [],
    aeronaves = [],
    aeropuertos = [],
    readOnly = false
  } = props

  const selectedEvent = store.selectedEvent
  const { register, errors, handleSubmit } = useForm()

  // Estados para los campos técnicos de la operación
  const [vueloPlanificado, setVueloPlanificado] = useState('')
  const [aerolineaEmpresa, setAerolineaEmpresa] = useState('')
  const [aeronave, setAeronave] = useState('')
  const [numeroVuelo, setNumeroVuelo] = useState('')
  const [tipoOperacion, setTipoOperacion] = useState('SALIDA')
  const [estado, setEstado] = useState('A_TIEMPO')
  const [fechaOperacion, setFechaOperacion] = useState(new Date())
  const [aeropuertoOrigen, setAeropuertoOrigen] = useState('')
  const [aeropuertoDestino, setAeropuertoDestino] = useState('')
  
  // Tiempos
  const [std, setStd] = useState(new Date())
  const [etd, setEtd] = useState(new Date())
  const [atd, setAtd] = useState(new Date())
  const [sta, setSta] = useState(new Date())
  const [eta, setEta] = useState(new Date())
  const [ata, setAta] = useState(new Date())

  const isObjEmpty = obj => Object.keys(obj).length === 0

  const handleAddEvent = () => {
    const obj = {
      title: `${numeroVuelo} - ${tipoOperacion}`,
      start: tipoOperacion === 'SALIDA' ? std : sta,
      end: tipoOperacion === 'SALIDA' ? atd : ata,
      allDay: false,
      display: 'block',
      extendedProps: {
        calendar: planes.find(p => p.id === parseInt(vueloPlanificado))?.numero_vuelo || 'Extra',
        vuelo_planificado: vueloPlanificado,
        aerolinea_empresa: aerolineaEmpresa,
        aeronave: aeronave,
        numero_vuelo: numeroVuelo,
        tipo_operacion: tipoOperacion,
        estado: estado,
        fecha_operacion: fechaOperacion,
        aeropuerto_origen: aeropuertoOrigen,
        aeropuerto_destino: aeropuertoDestino,
        std, etd, atd, sta, eta, ata
      }
    }
    dispatch(addEvent(obj))
    refetchEvents()
    handleAddEventSidebar()
  }

  const handleSelectedEvent = () => {
    if (!isObjEmpty(selectedEvent)) {
      const p = selectedEvent.extendedProps;
      
      // Función interna para parsear strings como fecha local sin desfase
      const parseLocal = (str) => {
        if (!str) return new Date();
        const clean = String(str).replace('Z', '');
        return clean.length === 10 ? new Date(clean + 'T00:00:00') : new Date(clean);
      };

      setVueloPlanificado(p.vuelo_planificado || '')
      setAerolineaEmpresa(p.aerolinea_empresa || '')
      setAeronave(p.aeronave || '')
      setNumeroVuelo(p.numero_vuelo || selectedEvent.title.split(' ')[0] || '')
      setTipoOperacion(p.tipo_operacion || 'SALIDA')
      setEstado(p.estado || 'A_TIEMPO')
      setFechaOperacion(parseLocal(p.fecha_operacion))
      setAeropuertoOrigen(p.aeropuerto_origen || '')
      setAeropuertoDestino(p.aeropuerto_destino || '')
      setStd(parseLocal(p.std))
      setEtd(parseLocal(p.etd))
      setAtd(parseLocal(p.atd))
      setSta(parseLocal(p.sta))
      setEta(parseLocal(p.eta))
      setAta(parseLocal(p.ata))
    }
  }

  const handleResetInputValues = () => {
    dispatch(selectEvent({}))
    setNumeroVuelo('')
    setVueloPlanificado('')
  }

  const updateEventInCalendar = (updatedEventData, propsToUpdate, extendedPropsToUpdate) => {
    const existingEvent = calendarApi.getEventById(updatedEventData.id)

    for (let index = 0; index < propsToUpdate.length; index ++) {
      const propName = propsToUpdate[index]
      existingEvent.setProp(propName, updatedEventData[propName])
    }

    existingEvent.setDates(updatedEventData.star, updatedEventData.end, { allDay: updatedEventData.allDay })

    for (let index = 0; index < extendedPropsToUpdate.length; index ++) {
      const propName = extendedPropsToUpdate[index]
      existingEvent.setExtendedProp(propName, updatedEventData.extendedProps[propName])
    }
  }

  const handleUpdateEvent = () => {
    const eventToUpdate = {
      id: selectedEvent.id,
      title: numeroVuelo,
      start: tipoOperacion === 'SALIDA' ? std : sta,
      end: tipoOperacion === 'SALIDA' ? atd : ata,
      extendedProps: {
        vuelo_planificado: vueloPlanificado,
        numero_vuelo: numeroVuelo,
        tipo_operacion: tipoOperacion,
        calendar: planes.find(p => p.id === parseInt(vueloPlanificado))?.numero_vuelo || 'Extra'
      }
    }
    const propsToUpdate = ['id', 'title']
    const extendedPropsToUpdate = ['calendar', 'vuelo_planificado']

    dispatch(updateEvent(eventToUpdate))
    updateEventInCalendar(eventToUpdate, propsToUpdate, extendedPropsToUpdate)
    handleAddEventSidebar()
  }

  const removeEventInCalendar = eventId => {
    calendarApi.getEventById(eventId).remove()
  }
  const handleDeleteEvent = () => {
    dispatch(removeEvent(selectedEvent.id))
    removeEventInCalendar(selectedEvent.id)
    handleAddEventSidebar()
  }

  const EventActions = () => {
    if (readOnly) {
      return (
        <Fragment>
          <Button className="btn-rounded" color="secondary" onClick={handleAddEventSidebar} outline>
            Cerrar
          </Button>
        </Fragment>
      )
    }
    if (isObjEmpty(selectedEvent) || (!isObjEmpty(selectedEvent) && !selectedEvent.title.length)) {
      return (
        <Fragment>
          <Button className="mr-3 btn-rounded" type="submit" color="primary" >
            Agregar
          </Button>
          <Button className="btn-rounded" color="secondary" type="reset" onClick={handleAddEventSidebar} outline>
            Cancelar
          </Button>
        </Fragment>
      )
    } else {
      return (
        <Fragment>
          <Button className="mr-3 btn-rounded" color="primary" onClick={handleUpdateEvent}>
            Update
          </Button>
          <Button className="btn-rounded" color="secondary" onClick={handleDeleteEvent} outline>
            Delete
          </Button>
        </Fragment>
      )
    }
  }

  const CloseBtn = <i className="eva eva-close cursor-pointer" onClick={handleAddEventSidebar}/>

  return (
    <Modal
      isOpen={open}
      toggle={handleAddEventSidebar}
      onOpened={handleSelectedEvent}
      onClosed={handleResetInputValues}
      size="xl"
      contentClassName="p-0"
      modalClassName="event-sidebar"
    >
      <ModalHeader className="mb-1" toggle={handleAddEventSidebar} close={CloseBtn} tag="div">
        <h5 className="modal-title">
          {selectedEvent && selectedEvent.title ? "Actualizar" : "Registrar"} Operación de Vuelo
        </h5>
      </ModalHeader>
      <ModalBody className="flex-grow-1 pb-sm-0 pb-3">
        <Form
          onSubmit={handleSubmit(data => {
            if (isObjEmpty(errors)) {
              if (isObjEmpty(selectedEvent) || (!isObjEmpty(selectedEvent) && !selectedEvent.title.length)) {
                handleAddEvent()
              } else {
                handleUpdateEvent()
              }
              handleAddEventSidebar()
            }
          })}
        >
          <Row>
            <Col md={4}>
              <FormGroup>
                <Label>Plan Relacionado</Label>
                <Input type="select" value={vueloPlanificado} onChange={e => setVueloPlanificado(e.target.value)} disabled={readOnly}>
                  <option value="">Ninguno</option>
                  {planes.map(p => <option key={p.id} value={p.id}>{p.numero_vuelo} - {p.aerolinea_nombre}</option>)}
                </Input>
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <Label>Aerolínea</Label>
                <Input type="select" value={aerolineaEmpresa} onChange={e => setAerolineaEmpresa(e.target.value)} required disabled={readOnly}>
                  <option value="">Seleccione...</option>
                  {aerolineas.map(a => <option key={a.id} value={a.id}>{a.razon_social}</option>)}
                </Input>
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <Label>Aeronave</Label>
                <Input type="select" value={aeronave} onChange={e => setAeronave(e.target.value)} required disabled={readOnly}>
                  <option value="">Seleccione...</option>
                  {aeronaves.map(a => <option key={a.id} value={a.id}>{a.modelo}</option>)}
                </Input>
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md={3}>
              <FormGroup>
                <Label>Vuelo #</Label>
                <Input value={numeroVuelo} onChange={e => setNumeroVuelo(e.target.value)} required disabled={readOnly} />
              </FormGroup>
            </Col>
            <Col md={3}>
              <FormGroup>
                <Label>Tipo</Label>
                <Input type="select" value={tipoOperacion} onChange={e => setTipoOperacion(e.target.value)} disabled={readOnly}>
                  <option value="SALIDA">Salida</option>
                  <option value="LLEGADA">Llegada</option>
                </Input>
              </FormGroup>
            </Col>
            <Col md={3}>
              <FormGroup>
                <Label>Estado</Label>
                <Input type="select" value={estado} onChange={e => setEstado(e.target.value)} disabled={readOnly}>
                  <option value="A_TIEMPO">A Tiempo</option>
                  <option value="DEMORADO">Demorado</option>
                  <option value="CANCELADO">Cancelado</option>
                  <option value="LANDED">Aterrizado</option>
                  <option value="BOARDING">Embarcando</option>
                  <option value="DEPARTED">Despegado</option>
                </Input>
              </FormGroup>
            </Col>
            <Col md={3}>
              <FormGroup>
                <Label>Fecha Op.</Label>
                <Flatpickr className='form-control' value={fechaOperacion} onChange={date => setFechaOperacion(date[0])} disabled={readOnly} options={{ clickOpens: !readOnly }} />
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <FormGroup>
                <Label>Origen</Label>
                <Input type="select" value={aeropuertoOrigen} onChange={e => setAeropuertoOrigen(e.target.value)} required disabled={readOnly}>
                  {aeropuertos.map(a => <option key={a.id} value={a.id}>{a.codigo_iata} - {a.nombre_completo}</option>)}
                </Input>
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <Label>Destino</Label>
                <Input type="select" value={aeropuertoDestino} onChange={e => setAeropuertoDestino(e.target.value)} required disabled={readOnly}>
                  {aeropuertos.map(a => <option key={a.id} value={a.id}>{a.codigo_iata} - {a.nombre_completo}</option>)}
                </Input>
              </FormGroup>
            </Col>
          </Row>
          <hr />
          <Row>
            <Col md={6}>
              <h6>Tiempos de Salida</h6>
              <FormGroup>
                <Label>STD (Prog.)</Label>
                <Flatpickr className='form-control' data-enable-time value={std} onChange={date => setStd(date[0])} disabled={readOnly} options={{ clickOpens: !readOnly }} />
              </FormGroup>
              <FormGroup>
                <Label>ETD (Est.)</Label>
                <Flatpickr className='form-control' data-enable-time value={etd} onChange={date => setEtd(date[0])} disabled={readOnly} options={{ clickOpens: !readOnly }} />
              </FormGroup>
              <FormGroup>
                <Label>ATD (Real)</Label>
                <Flatpickr className='form-control' data-enable-time value={atd} onChange={date => setAtd(date[0])} disabled={readOnly} options={{ clickOpens: !readOnly }} />
              </FormGroup>
            </Col>
            <Col md={6}>
              <h6>Tiempos de Llegada</h6>
              <FormGroup>
                <Label>STA (Prog.)</Label>
                <Flatpickr className='form-control' data-enable-time value={sta} onChange={date => setSta(date[0])} disabled={readOnly} options={{ clickOpens: !readOnly }} />
              </FormGroup>
              <FormGroup>
                <Label>ETA (Est.)</Label>
                <Flatpickr className='form-control' data-enable-time value={eta} onChange={date => setEta(date[0])} disabled={readOnly} options={{ clickOpens: !readOnly }} />
              </FormGroup>
              <FormGroup>
                <Label>ATA (Real)</Label>
                <Flatpickr className='form-control' data-enable-time value={ata} onChange={date => setAta(date[0])} disabled={readOnly} options={{ clickOpens: !readOnly }} />
              </FormGroup>
            </Col>
          </Row>
          <FormGroup className="d-flex">
            <EventActions />
          </FormGroup>
        </Form>
      </ModalBody>
    </Modal>
  )
}

export default AddEventSidebar;
