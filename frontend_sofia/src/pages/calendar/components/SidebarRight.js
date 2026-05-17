import React, { Fragment } from 'react'

import { CardBody, Button } from 'reactstrap'

import sidebarIllustration from '../../../assets/calendarImg.svg'

const SidebarRight = props => {
  const {
    handleAddEventSidebar,
    toggleSidebar,
    updateFilter,
    updateAllFilters,
    store,
    dispatch,
    calendarsColor,
  } = props

  // Fallback para el calendario original si no hay vuelos cargados
  const defaultFilters = [
    { label: 'Personal', color: 'danger', className: 'styled mb-1' },
    { label: 'Business', color: 'primary', className: 'styled mb-1' },
    { label: 'Flatlogic', color: 'warning', className: 'styled mb-1' },
    { label: 'Holiday', color: 'info', className: 'styled mb-1' },
  ]

  // Generamos la lista de filtros dinámicamente desde los Vuelos Planificados
  const filtersList = calendarsColor 
    ? Object.entries(calendarsColor).map(([label, color]) => ({ label, color, className: 'styled mb-1' }))
    : defaultFilters

  const handleAddEventClick = () => {
    toggleSidebar(false)
    handleAddEventSidebar()
  }

  return (
    <Fragment>
      <div className="sidebar-wrapper">
        <CardBody>
          <div className="headline-2 text-center my-2">
            Vuelos d
          </div>
          <div className="form-check checkbox checkbox-success">
            <input
              id="view-all"
              type="checkbox"
              className="styled mb-1"
              label="View All"
              checked={store.selectedCalendars.length === filtersList.length}
              onChange={e => dispatch(updateAllFilters(e.target.checked))}
            />
            <label htmlFor="view-all">View All</label>
          </div>
          <div className="calendar-events-filter">
            {filtersList.length &&
            filtersList.map(filter => {
              return (
                <div className={`form-check checkbox checkbox-${filter.color}`}>
                  <input
                    id={filter.label}
                    type="checkbox"
                    key={filter.label}
                    label={filter.label}
                    checked={store.selectedCalendars.includes(filter.label)}
                    className={filter.className}
                    onChange={e => dispatch(updateFilter(filter.label))}
                  />
                  <label htmlFor={filter.label}>{filter.label}</label>
                </div>
              )
            })
            }
          </div>
        </CardBody>
        <CardBody className="card-body d-flex justify-content-center my-sm-0 mb-3">
          <Button className="btn-rounded" color="secondary-red" onClick={handleAddEventClick}>
            <span className="align-middle">Add </span>
          </Button>
        </CardBody>
      </div>
      <div className="mt-auto mx-auto mb-4">
        <img className="img-fluid" src={sidebarIllustration} alt="illustration" />
      </div>
    </Fragment>
  )
}

export default SidebarRight;
