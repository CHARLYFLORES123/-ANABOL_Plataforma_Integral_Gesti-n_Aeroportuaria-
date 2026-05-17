import { useEffect, useRef, memo } from "react";
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactinPlugin from "@fullcalendar/interaction"

import { Card, CardBody } from "reactstrap";

const CalendarBody = props => {
  const calendarRef = useRef(null)
  const {
    store,
    dispatch,
    calendarApi,
    setCalendarApi,
    calendarsColor,
    blankEvent,
    selectEvent,
    updateEvent,
    handleAddEventSidebar,
    readOnly = false
  } = props

  useEffect(() => {
    if (calendarApi === null) {
      setCalendarApi(calendarRef.current.getApi())
    }
  }, [calendarApi])

  const calendarOptions = {
    events: store.events.length
      ? store.events
      : [],
    plugins: [interactinPlugin, dayGridPlugin, timeGridPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: {
      start: ' prev, next, title',
      end: 'sidebarToggle, dayGridMonth, timeGridWeek, timeGridDay'
    },
    editable: !readOnly,
    eventResizableFromStart: !readOnly,
    dragScroll: !readOnly,
    dayMaxEvents: 2,
    navLinks: true,

    eventClassNames({ event: calendarEvent }) {
      const colorName = calendarsColor[calendarEvent._def.extendedProps.calendar]
      return [`bg-light-${colorName}`]
    },

    eventClick({ event: clickedEvent }) {
      dispatch(selectEvent(clickedEvent))
      handleAddEventSidebar()
    },

    dateClick(info) {
      if (!readOnly) {
        const ev = blankEvent
        ev.start = info.date
        ev.end = info.date
        dispatch(selectEvent(ev))
        handleAddEventSidebar()
      }
    },

    eventDrop({ event: droppedEvent }) {
      if (!readOnly) dispatch(updateEvent(droppedEvent))
    },

    eventResize({event: resizedEvent}) {
      if (!readOnly) dispatch(updateEvent(resizedEvent))
    },

    ref: calendarRef,
  }

  return (
    <Card className="shadow-none border-0 mb-0">
      <CardBody className="pb-0">
        <FullCalendar {...calendarOptions} />{' '}
      </CardBody>
    </Card>
  )
}

export default memo(CalendarBody)
