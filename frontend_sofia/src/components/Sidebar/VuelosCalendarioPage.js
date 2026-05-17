import { Fragment, useState, useEffect, useMemo } from 'react'
import { useSelector, useDispatch } from "react-redux"
import axios from "axios";

// Reutilizamos los componentes internos del calendario original
import CalendarBody from "../../pages/calendar/components/CalendarBody"
import AddEventSidebar from "../../pages/calendar/components/AddEventSidebar";

import {
  selectEvent,
  updateEvent,
  addEvent,
  removeEvent
} from "../../actions/calendar";

// Colores disponibles para asignar a los diferentes planes de vuelo
const defaultColors = ['primary', 'success', 'danger', 'warning', 'info'];

const VuelosCalendarioPage = () => {
  const dispatch = useDispatch();
  // Obtenemos el estado actual del calendario desde Redux
  const calendarState = useSelector(state => state.calendar);

  // Creamos un objeto store "seguro" que garantiza que las propiedades críticas
  // sean arreglos. Esto evita el error de lectura de .length sobre undefined en CalendarBody.
  const store = useMemo(() => ({
    // Primero esparcimos el estado real
    ...(calendarState || {}),
    // Luego aseguramos los campos críticos con fallbacks (esto sobreescribe si son undefined)
    events: calendarState?.events || [],
    selectedCalendars: calendarState?.selectedCalendars || [],
    selectedEvent: calendarState?.selectedEvent || {}
  }), [calendarState]);

  const [addSidebarOpen, setAddSidebarOpen] = useState(false)
  const [calendarApi, setCalendarApi] = useState(null)
  const [planes, setPlanes] = useState([]); // Almacenamos los planes para la leyenda
  const [aerolineas, setAerolineas] = useState([]);
  const [aeronaves, setAeronaves] = useState([]);
  const [aeropuertos, setAeropuertos] = useState([]);
  const handleAddEventSidebar = () => setAddSidebarOpen(!addSidebarOpen)

  const blankEvent = {
    title: '',
    start: '',
    end: '',
    allDay: false,
    url: '',
    extendedProps: {
      calendar: '',
      guests: [],
      location: '',
      description: '',
    }
  }

  const refetchEvents = () => {
    if (calendarApi !== null) {
      calendarApi.refetchEvents()
    }
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        // Usamos allSettled para que si falla una configuración, los vuelos igual se carguen
        const results = await Promise.allSettled([
          axios.get("vuelos/operaciones/"), // 0
          axios.get("vuelos/planificacion/"), // 1
          axios.get("seguridad/aerolineas/"), // 2
          axios.get("config/aeronaves/"), // 3
          axios.get("config/aeropuertos/") // 4
        ]);
        
        // Extracción segura de datos
        const getRes = (idx) => results[idx].status === 'fulfilled' ? results[idx].value.data : null;
        
        const resOps = getRes(0);
        const resPlanes = getRes(1);
        const resAero = getRes(2);
        const resPlanesList = getRes(3);
        const resPorts = getRes(4);

        if (!resOps) {
          console.error("La petición de operaciones falló o devolvió null");
          throw new Error("No se pudieron cargar las operaciones de vuelo");
        }

        const vuelos = Array.isArray(resOps) ? resOps : (resOps.results || []);
        const planesData = resPlanes ? (Array.isArray(resPlanes) ? resPlanes : (resPlanes.results || [])) : [];
        
        console.log("Datos crudos de vuelos recibidos:", vuelos);

        setPlanes(planesData);
        setAerolineas(resAero?.results || resAero || []);
        setAeronaves(resPlanesList?.results || resPlanesList || []);
        setAeropuertos(resPorts?.results || resPorts || []);
        
        // Transformar formato AODB a formato FullCalendar
        const events = vuelos.map((v) => {
          // 1. Selección de tiempo con prioridad idéntica a VueloDiarioPage (Real > Estimado > Programado)
          const rawTime = v.tipo_operacion === 'SALIDA' 
            ? (v.atd || v.etd || v.std) 
            : (v.ata || v.eta || v.sta);
          
          // Sanitización: Eliminamos 'Z' y normalizamos el formato para evitar el desfase UTC
          const sanitize = (s) => s ? String(s).replace('Z', '').replace(' ', 'T') : null;
          
          let dateStr = sanitize(rawTime || v.fecha_operacion);
          
          // SOLUCIÓN AL ERROR "HOY": Si no existe fecha en el registro, ignoramos el evento
          // en lugar de usar un fallback a la fecha actual.
          if (!dateStr) return null;

          // Si usamos fecha_operacion (sin hora), aseguramos que sea solo YYYY-MM-DD para FullCalendar
          if (!rawTime && dateStr.includes('T')) {
            dateStr = dateStr.split('T')[0];
          }

          const startTime = dateStr;
          // Un evento es "Todo el día" si no tiene información de hora (no hay T con hora o no hay :)
          const isAllDay = !startTime.includes('T') || !startTime.includes(':');

          // 2. Cálculo de hora de fin (Duración de 45 min)
          let endTime = startTime;
          if (!isAllDay) {
            try {
              // Reemplazamos T por espacio para que el constructor Date interprete como hora local
              const startDt = new Date(startTime.replace('T', ' '));
              if (!isNaN(startDt.getTime())) {
                const endDt = new Date(startDt.getTime() + 45 * 60000);
                // Re-formateamos manualmente el fin para mantener la hora local exacta sin UTC
                endTime = `${endDt.getFullYear()}-${String(endDt.getMonth() + 1).padStart(2, '0')}-${String(endDt.getDate()).padStart(2, '0')}T${String(endDt.getHours()).padStart(2, '0')}:${String(endDt.getMinutes()).padStart(2, '0')}`;
              }
            } catch (e) { endTime = startTime; }
          }

          const calendarCategory = (v.estado || 'A_TIEMPO').toUpperCase().replace(' ', '_');

          return {
            id: String(v.id || Math.random()),
            title: `${v.numero_vuelo} (${v.tipo_operacion === 'SALIDA' ? 'DEP' : 'ARR'})`,
            start: startTime,
            end: isAllDay ? undefined : endTime,
            allDay: isAllDay,
            calendar: calendarCategory,
            extendedProps: {
              ...v, // Inyectamos todas las propiedades originales para que el Sidebar de edición funcione
              // Enviamos los tiempos ya sanitizados para que el Sidebar los cargue correctamente
              fecha_operacion: sanitize(v.fecha_operacion)?.split('T')[0],
              std: sanitize(v.std),
              etd: sanitize(v.etd),
              atd: sanitize(v.atd),
              sta: sanitize(v.sta),
              eta: sanitize(v.eta),
              ata: sanitize(v.ata),
              calendar: calendarCategory,
              description: `${v.aeropuerto_origen_nombre || 'N/A'} -> ${v.aeropuerto_destino_nombre || 'N/A'}`,
              status: v.estado,
              aerolinea: v.aerolinea_nombre
            }
          };
        }).filter(event => event !== null);

        console.log("Eventos procesados para FullCalendar:", events);

        if (events.length > 0) {
          console.log(`Primer vuelo detectado el día: ${events[0].start}`);
        } else {
          console.warn("Se recibieron datos pero el array de eventos está vacío tras el mapeo.");
        }

        // Despachamos los eventos al store
        // Enviamos los datos con todas las nomenclaturas posibles que suelen usar estos reducers
        dispatch({ type: 'CALENDAR_FETCH_EVENTS', payload: events, events: events });
        dispatch({ type: 'FETCH_EVENTS', payload: events, events: events });

        // Sincronizar filtros: Activamos todos los estados detectados por defecto
        const categories = [...new Set(events.map(e => e.calendar))].filter(Boolean);
        if (categories.length > 0) {
          dispatch({ type: 'CALENDAR_UPDATE_ALL_FILTERS', payload: categories, filters: categories });
          dispatch({ type: 'CALENDAR_UPDATE_FILTERS', payload: categories, filters: categories });
          // También despachamos de forma individual por si el reducer lo requiere
          dispatch({ type: 'UPDATE_CALENDARS_FILTER', payload: categories });
        }
        console.log("Filtros de estado sincronizados:", categories);

      } catch (error) {
        console.error("Error cargando datos:", error);
      }
    };

    loadData();
  }, [dispatch])

  // Efecto para navegar automáticamente a la fecha donde hay datos cargados
  useEffect(() => {
    // Si hay eventos en el store, forzamos al calendario a ir a esa fecha (2026)
    if (calendarApi && store.events && store.events.length > 0) {
      const targetDate = store.events[0].start;
      console.log("Navegando automáticamente a la fecha de los vuelos:", targetDate);
      
      const timer = setTimeout(() => {
        calendarApi.gotoDate(targetDate);
      }, 300);
      return () => clearTimeout(timer);
    } else if (calendarApi) {
       console.log("CalendarApi está listo, pero no hay eventos en el store aún.");
    }
  }, [calendarApi, store.events]);

  const jumpToFlights = () => {
    if (calendarApi && store.events.length > 0) {
      calendarApi.gotoDate(store.events[0].start);
    }
  };

  // Mapeo dinámico de colores para los planes en el sidebar
  const calendarsColor = useMemo(() => {
    return {
      'A_TIEMPO': 'success',
      'DEMORADO': 'warning',
      'CANCELADO': 'danger',
      'BOARDING': 'info',
      'DEPARTED': 'primary',
      'LANDED': 'secondary'
    };
  }, []);

  // Si el estado de Redux no existe en absoluto, mostramos un mensaje de espera preventivo
  if (!calendarState) {
    return <div className="p-4 text-center">Cargando configuración de calendario...</div>;
  }

  return (
    <Fragment>
      <div className="app-calendar overflow-hidden position-relative">
       
        
        <CalendarBody
          store={store}
          dispatch={dispatch}
          blankEvent={blankEvent}
          calendarApi={calendarApi}
          setCalendarApi={setCalendarApi}
          calendarsColor={calendarsColor}
          toggleSidebar={() => {}} 
          selectEvent={selectEvent}
          updateEvent={updateEvent}
          handleAddEventSidebar={handleAddEventSidebar}
          readOnly={true}
        />
      </div>
      <AddEventSidebar
        store={store}
        dispatch={dispatch}
        open={addSidebarOpen}
        handleAddEventSidebar={handleAddEventSidebar}
        selectEvent={selectEvent}
        addEvent={addEvent}
        removeEvent={removeEvent}
        refetchEvents={refetchEvents}
        updateEvent={updateEvent}
        calendarApi={calendarApi}
        calendarsColor={calendarsColor}
        planes={planes}
        aerolineas={aerolineas}
        aeronaves={aeronaves}
        aeropuertos={aeropuertos}
        readOnly={true}
      />
    </Fragment>
  )
}

export default VuelosCalendarioPage;
