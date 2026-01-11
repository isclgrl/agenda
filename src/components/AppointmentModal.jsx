import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { FaTimes, FaSave, FaClock, FaUser, FaNotesMedical } from 'react-icons/fa';
import { addMinutes, setHours, setMinutes, format } from 'date-fns';

const AppointmentModal = ({ isOpen, onClose, selectedDate, session, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState([]);
  
  // Datos del Formulario
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [time, setTime] = useState('09:00'); // Hora por defecto
  const [notes, setNotes] = useState('');

  // 1. Cargar servicios para el Dropdown
  useEffect(() => {
    if (isOpen) {
      const fetchServices = async () => {
        const { data } = await supabase.from('services').select('*').order('name');
        setServices(data || []);
      };
      fetchServices();
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!serviceId || !clientName) return alert("Faltan datos");

    setLoading(true);

    try {
      // 1. Calcular horarios
      const selectedService = services.find(s => s.id === parseInt(serviceId));
      if (!selectedService) throw new Error("Servicio no válido");

      const [hours, minutes] = time.split(':').map(Number);
      const startTime = setMinutes(setHours(new Date(selectedDate), hours), minutes);
      const endTime = addMinutes(startTime, selectedService.duration);

      // --- 🛑 ZONA DE VALIDACIÓN ANTI-CHOQUES (NUEVO) ---
      
      // Preguntamos a Supabase: "¿Existe alguna cita que choque con este horario?"
      // Lógica: (StartA < EndB) Y (EndA > StartB)
      const { data: conflicts, error: conflictError } = await supabase
        .from('appointments')
        .select('id, start_time, end_time')
        .lt('start_time', endTime.toISOString()) // Empieza antes de que yo termine
        .gt('end_time', startTime.toISOString()); // Termina después de que yo empiece

      if (conflictError) throw conflictError;

      if (conflicts && conflicts.length > 0) {
        // Si la lista NO está vacía, es que hay alguien estorbando
        throw new Error("⚠️ ¡Horario Ocupado! Ya existe una cita en ese rango.");
      }
      
      // --- ✅ FIN DE LA VALIDACIÓN ---


      // 2. Si llegamos aquí, el hueco está libre. Guardamos.
      const { error } = await supabase.from('appointments').insert([{
        user_id: session.user.id,
        service_id: selectedService.id,
        client_name: clientName,
        client_phone: clientPhone,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        notes: notes
      }]);

      if (error) throw error;

      onSuccess();
      onClose();
      resetForm();

    } catch (error) {
      // Mostramos el error (ej: "Horario Ocupado")
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setClientName('');
    setClientPhone('');
    setNotes('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
        
        {/* Header del Modal */}
        <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
          <h3 className="font-bold text-lg">
            Nueva Cita: {selectedDate && format(selectedDate, 'dd/MM/yyyy')}
          </h3>
          <button onClick={onClose} className="hover:bg-blue-700 p-1 rounded">
            <FaTimes />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Input Cliente */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Paciente / Cliente</label>
            <div className="flex items-center border rounded-lg px-3 py-2 bg-gray-50">
              <FaUser className="text-gray-400 mr-2" />
              <input 
                type="text" required placeholder="Nombre completo"
                className="bg-transparent w-full outline-none"
                value={clientName} onChange={e => setClientName(e.target.value)}
              />
            </div>
          </div>

          {/* Input Teléfono */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Teléfono (Opcional)</label>
            <input 
              type="tel" placeholder="55 1234 5678"
              className="w-full border rounded-lg px-3 py-2 outline-none focus:border-blue-500"
              value={clientPhone} onChange={e => setClientPhone(e.target.value)}
            />
          </div>

          <div className="flex gap-4">
            {/* Dropdown Servicios */}
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Servicio</label>
              <select 
                required
                className="w-full border rounded-lg px-3 py-2 bg-white outline-none focus:border-blue-500"
                value={serviceId} onChange={e => setServiceId(e.target.value)}
              >
                <option value="">Selecciona...</option>
                {services.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.duration} min)
                  </option>
                ))}
              </select>
            </div>

            {/* Input Hora */}
            <div className="w-32">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Hora</label>
              <div className="flex items-center border rounded-lg px-3 py-2 bg-white">
                <FaClock className="text-gray-400 mr-2" />
                <input 
                  type="time" required
                  className="bg-transparent w-full outline-none"
                  value={time} onChange={e => setTime(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Notas */}
          <div>
             <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Notas</label>
             <textarea 
                className="w-full border rounded-lg p-2 text-sm"
                rows="2" placeholder="Detalles extra..."
                value={notes} onChange={e => setNotes(e.target.value)}
             ></textarea>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">
              Cancelar
            </button>
            <button 
              type="submit" disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              {loading ? 'Guardando...' : <><FaSave /> Guardar Cita</>}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AppointmentModal;