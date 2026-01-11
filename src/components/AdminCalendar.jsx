import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, isSameDay, addMonths, subMonths, parseISO, isToday 
} from 'date-fns';
import { es } from 'date-fns/locale';
import { FaChevronLeft, FaChevronRight, FaCalendarPlus } from 'react-icons/fa';
import AppointmentModal from './AppointmentModal'; // <--- 1. IMPORTAR EL MODAL
import AppointmentDetails from './AppointmentDetails'; // <--- IMPORTAR

const AdminCalendar = ({ session }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- NUEVOS ESTADOS PARA EL MODAL ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);

  // detalles cita
  const [viewModalOpen, setViewModalOpen] = useState(false);
const [selectedAppointment, setSelectedAppointment] = useState(null);

  useEffect(() => {
    fetchAppointments();
  }, [currentDate]);

  const fetchAppointments = async () => {
    setLoading(true);
    const start = startOfWeek(startOfMonth(currentDate));
    const end = endOfWeek(endOfMonth(currentDate));

    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`*, services ( name, color, duration )`)
        .gte('start_time', start.toISOString())
        .lte('start_time', end.toISOString());

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error cargando citas:', error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- NUEVA FUNCIÓN PARA ABRIR EL MODAL ---
  const handleOpenModal = (day) => {
    setSelectedDay(day);
    setIsModalOpen(true);
  };

  // --- NUEVA FUNCIÓN QUE SE EJECUTA AL GUARDAR ---
  const handleSuccess = () => {
    fetchAppointments(); // Recargamos las citas para ver la nueva
  };

  const daysInGrid = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentDate)),
    end: endOfWeek(endOfMonth(currentDate)),
  });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const getServiceColor = (service) => {
    return service?.color === 'red' ? 'bg-red-100 text-red-800 border-red-200' : 
           service?.color === 'green' ? 'bg-green-100 text-green-800 border-green-200' :
           'bg-blue-100 text-blue-800 border-blue-200';
  };

  // abrir detalles 
  const handleOpenDetails = (e, appointment) => {
  e.stopPropagation(); // ¡IMPORTANTE! Para que no se abra el modal de "Crear Cita" que está detrás
  setSelectedAppointment(appointment);
  setViewModalOpen(true);
};

  return (
    <div className="bg-white rounded-xl shadow p-6 mt-6">
      
      {/* Cabecera... (Igual que antes) */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 capitalize">
          {format(currentDate, 'MMMM yyyy', { locale: es })}
        </h2>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
            <FaChevronLeft />
          </button>
          <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-lg">
            Hoy
          </button>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
            <FaChevronRight />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 mb-2 text-center">
        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
          <div key={day} className="text-xs font-bold text-gray-400 uppercase tracking-wide py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 border-t border-l border-gray-200 bg-gray-200 gap-px">
        {daysInGrid.map((day, idx) => {
          const dayAppointments = appointments.filter(apt => 
            isSameDay(parseISO(apt.start_time), day)
          );
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
                    className={`text-xs p-1.5 rounded border truncate cursor-pointer ${getServiceColor(apt.services)}`}
                    title={`${apt.client_name} - ${apt.services?.name}`}
                  >
                    <span className="font-bold">{format(parseISO(apt.start_time), 'HH:mm')}</span> {apt.client_name}
                  </div>
                ))}
              </div>

              {/* --- BOTÓN ACTUALIZADO: AHORA ABRE EL MODAL --- */}
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

      {/* --- AQUÍ RENDERIZAMOS EL MODAL --- */}
      <AppointmentModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedDate={selectedDay}
        session={session}
        onSuccess={handleSuccess}
        loading={loading}
      />

      {/* Modal de DETALLES (Nuevo) */}
      <AppointmentDetails
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        appointment={selectedAppointment}
        onDeleteSuccess={handleSuccess} 
      />

    </div>
  );
};

export default AdminCalendar;