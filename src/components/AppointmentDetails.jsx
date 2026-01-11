import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { FaTrash, FaTimes, FaClock, FaUser, FaPhone, FaStickyNote } from 'react-icons/fa';
import { supabase } from '../supabaseClient';

const AppointmentDetails = ({ appointment, isOpen, onClose, onDeleteSuccess }) => {
  if (!isOpen || !appointment) return null;

  const handleDelete = async () => {
    const confirm = window.confirm(`¿Estás seguro de cancelar la cita de ${appointment.client_name}?`);
    if (!confirm) return;

    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', appointment.id);

    if (error) {
      alert("Error al borrar: " + error.message);
    } else {
      onDeleteSuccess(); // Avisar al calendario que recargue
      onClose();
    }
  };

  // Cálculos visuales
  const startTime = parseISO(appointment.start_time);
  const endTime = parseISO(appointment.end_time);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in">
        
        {/* Header con Color del Servicio */}
        <div className={`p-4 flex justify-between items-center text-white font-bold
          ${appointment.services?.color === 'red' ? 'bg-red-500' : 'bg-blue-600'}
        `}>
          <span>Detalles de la Cita</span>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded">
            <FaTimes />
          </button>
        </div>

        <div className="p-6 space-y-4">
          
          {/* Cliente */}
          <div className="flex items-start gap-3">
            <div className="bg-gray-100 p-2 rounded-full text-gray-500">
              <FaUser />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-bold uppercase">Cliente</p>
              <p className="text-lg font-bold text-gray-800">{appointment.client_name}</p>
              {appointment.client_phone && (
                <div className="flex items-center text-sm text-blue-600 mt-1 gap-1">
                  <FaPhone className="text-xs" /> {appointment.client_phone}
                </div>
              )}
            </div>
          </div>

          <hr />

          {/* Servicio y Hora */}
          <div className="flex items-start gap-3">
            <div className="bg-gray-100 p-2 rounded-full text-gray-500">
              <FaClock />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-bold uppercase">Servicio</p>
              <p className="font-medium text-gray-800">{appointment.services?.name}</p>
              <p className="text-sm text-gray-600 mt-1">
                {format(startTime, 'EEEE d MMMM', { locale: es })} <br/>
                <span className="font-bold">
                  {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
                </span>
              </p>
            </div>
          </div>

          {/* Notas (si existen) */}
          {appointment.notes && (
            <div className="bg-yellow-50 border border-yellow-100 p-3 rounded-lg text-sm text-yellow-800 flex gap-2">
              <FaStickyNote className="mt-1 opacity-50" />
              <p>{appointment.notes}</p>
            </div>
          )}

          {/* Botón de Borrar */}
          <button 
            onClick={handleDelete}
            className="w-full mt-4 bg-red-50 text-red-600 py-3 rounded-lg font-bold hover:bg-red-100 flex items-center justify-center gap-2 transition"
          >
            <FaTrash /> Cancelar Cita
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetails;