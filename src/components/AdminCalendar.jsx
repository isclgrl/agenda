import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, isSameDay, addMonths, subMonths, parseISO, isToday, getDay 
} from 'date-fns';
import { es } from 'date-fns/locale';
import { FaChevronLeft, FaChevronRight, FaCalendarPlus, FaStoreSlash, FaClock, FaCheckCircle } from 'react-icons/fa';
import AppointmentModal from './AppointmentModal';
import AppointmentDetails from './AppointmentDetails';

const AdminCalendar = ({ session }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [businessHours, setBusinessHours] = useState([]); // --- NUEVO: Estado para horarios
  const [loading, setLoading] = useState(true);

  // Estados de Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  // 1. Cargar Citas y Horarios
  useEffect(() => {
    fetchData();
  }, [currentDate]);

  const fetchData = async () => {
    setLoading(true);
    const start = startOfWeek(startOfMonth(currentDate));
    const end = endOfWeek(endOfMonth(currentDate));

    try {
      // Cargar Citas
      const { data: aptsData, error: aptsError } = await supabase
        .from('appointments')
        .select(`*, services ( name, color, duration )`)
        .gte('start_time', start.toISOString())
        .lte('start_time', end.toISOString());

      if (aptsError) throw aptsError;
      setAppointments(aptsData || []);

      // --- NUEVO: Cargar Horarios para saber si hoy abrimos ---
      const { data: hoursData, error: hoursError } = await supabase
        .from('business_hours')
        .select('*')
        .eq('user_id', session.user.id);
      
      if (hoursError) throw hoursError;
      setBusinessHours(hoursData || []);

    } catch (error) {
      console.error('Error cargando datos:', error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- LÓGICA DEL RESUMEN DE HOY ---
  const today = new Date();
  
  // 1. ¿Está abierto hoy?
  const todayIndex = getDay(today); // 0=Dom, 1=Lun...
  const todayRule = businessHours.find(h => h.day_of_week === todayIndex);
  // Si no hay regla, asumimos abierto (o cerrado según tu preferencia, aquí asumo abierto por defecto si no configuró nada, pero si configuró y dice closed es cerrado)
  const isTodayClosed = todayRule ? todayRule.is_closed : false; 
  const todayHours = todayRule ? `${todayRule.start_time.slice(0,5)} - ${todayRule.end_time.slice(0,5)}` : '09:00 - 18:00';

  // 2. Citas de Hoy
  const todaysAppointments = appointments
    .filter(apt => isSameDay(parseISO(apt.start_time), today))
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));


  // ... Funciones auxiliares del calendario (igual que antes) ...
  const handleOpenModal = (day) => { setSelectedDay(day); setIsModalOpen(true); };
  const handleSuccess = () => { fetchData(); };
  const handleOpenDetails = (e, appointment) => { e.stopPropagation(); setSelectedAppointment(appointment); setDetailsOpen(true); };
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  
  const daysInGrid = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentDate)),
    end: endOfWeek(endOfMonth(currentDate)),
  });

  const getServiceColor = (service) => {
    return service?.color === 'red' ? 'bg-red-100 text-red-800 border-red-200' : 
           service?.color === 'green' ? 'bg-green-100 text-green-800 border-green-200' :
           'bg-blue-100 text-blue-800 border-blue-200';
  };

  return (
    <div className="space-y-6 mt-6">
      
      {/* --- NUEVO: PANEL DE RESUMEN DE HOY --- */}
      <div className="bg-white rounded-xl shadow p-6 border-l-4 border-blue-600 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        
        {/* Lado Izquierdo: Fecha y Estado */}
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            📅 Hoy, {format(today, 'EEEE d de MMMM', { locale: es })}
          </h2>
          
          <div className="mt-2 flex items-center gap-3">
            {isTodayClosed ? (
              <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2">
                <FaStoreSlash /> CERRADO
              </span>
            ) : (
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2">
                <FaCheckCircle /> ABIERTO
              </span>
            )}
            
            {!isTodayClosed && (
              <span className="text-gray-500 text-sm flex items-center gap-1">
                <FaClock /> {todayHours}
              </span>
            )}
          </div>
        </div>

        {/* Lado Derecho: Próximas Citas */}
        <div className="w-full md:w-auto bg-gray-50 p-4 rounded-lg min-w-[250px]">
          <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Agenda del Día ({todaysAppointments.length})</h3>
          
          {todaysAppointments.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No tienes citas hoy.</p>
          ) : (
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {todaysAppointments.map(apt => (
                <div 
                  key={apt.id} 
                  onClick={(e) => handleOpenDetails(e, apt)}
                  className="flex justify-between items-center text-sm p-2 bg-white rounded border hover:shadow-sm cursor-pointer"
                >
                  <span className="font-bold text-blue-600">{format(parseISO(apt.start_time), 'HH:mm')}</span>
                  <span className="text-gray-700 truncate ml-2 flex-1">{apt.client_name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* --- CALENDARIO MENSUAL (Lo de siempre) --- */}
      <div className="bg-white rounded-xl shadow p-6">
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 capitalize">
            {format(currentDate, 'MMMM yyyy', { locale: es })}
          </h2>
          <div className="flex gap-2">
            <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-full text-gray-600"><FaChevronLeft /></button>
            <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-lg">Hoy</button>
            <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-full text-gray-600"><FaChevronRight /></button>
          </div>
        </div>

        {/* Grid Header */}
        <div className="grid grid-cols-7 mb-2 text-center">
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
            <div key={day} className="text-xs font-bold text-gray-400 uppercase tracking-wide py-2">{day}</div>
          ))}
        </div>

        {/* Grid Days */}
        <div className="grid grid-cols-7 border-t border-l border-gray-200 bg-gray-200 gap-px">
          {daysInGrid.map((day, idx) => {
            const dayAppointments = appointments.filter(apt => isSameDay(parseISO(apt.start_time), day));
            const isCurrentMonth = format(day, 'M') === format(currentDate, 'M');

            return (
              <div 
                key={idx} 
                className={`min-h-[120px] bg-white p-2 relative group transition hover:bg-gray-50
                  ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''}
                `}
              >
                <div className={`text-sm font-bold mb-1 w-7 h-7 flex items-center justify-center rounded-full
                  ${isToday(day) ? 'bg-blue-600 text-white' : ''}
                `}>
                  {format(day, 'd')}
                </div>

                <div className="space-y-1">
                  {dayAppointments.map(apt => (
                    <div 
                      key={apt.id} 
                      onClick={(e) => handleOpenDetails(e, apt)}
                      className={`text-xs p-1.5 rounded border truncate cursor-pointer transition hover:opacity-80 hover:shadow-sm ${getServiceColor(apt.services)}`}
                      title={`${apt.client_name} - ${apt.services?.name}`}
                    >
                      <span className="font-bold">{format(parseISO(apt.start_time), 'HH:mm')}</span> {apt.client_name}
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => handleOpenModal(day)} 
                  className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 text-blue-500 hover:bg-blue-50 p-1 rounded transition"
                >
                  <FaCalendarPlus />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- MODALES --- */}
      <AppointmentModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedDate={selectedDay}
        session={session}
        onSuccess={handleSuccess}
        loading={loading}
      />

      <AppointmentDetails 
        isOpen={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        appointment={selectedAppointment}
        onDeleteSuccess={handleSuccess} 
      />
    </div>
  );
};

export default AdminCalendar;