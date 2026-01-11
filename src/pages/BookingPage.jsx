import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { FaClock, FaMoneyBillWave, FaCut, FaChevronLeft, FaCalendarDay, FaStoreSlash } from 'react-icons/fa';
import { format, addMinutes, parseISO, setMinutes, setHours, getDay } from 'date-fns';
import { es } from 'date-fns/locale';

const BookingPage = () => {
  const { userId } = useParams();
  
  // Estados de Datos
  const [services, setServices] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [businessHours, setBusinessHours] = useState([]); // --- NUEVO: Estado para horarios ---
  
  // Estados de UI
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1); 
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedTime, setSelectedTime] = useState(null);

  // Datos del Cliente
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');

  // 1. Cargar Servicios y Horarios al inicio
  useEffect(() => {
    const fetchData = async () => {
      // Cargar Servicios
      const { data: servicesData } = await supabase.from('services').select('*').eq('user_id', userId).order('name');
      setServices(servicesData || []);

      // --- NUEVO: Cargar Reglas de Horario ---
      const { data: hoursData } = await supabase.from('business_hours').select('*').eq('user_id', userId);
      setBusinessHours(hoursData || []);
      
      setLoading(false);
    };
    fetchData();
  }, [userId]);

  // 2. Cargar Citas (Igual que antes, con la corrección de fechas)
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!selectedDate) return;
      
      const startOfDay = new Date(`${selectedDate}T00:00:00`);
      const endOfDay = new Date(`${selectedDate}T23:59:59`);

      const { data } = await supabase
        .from('appointments')
        .select('start_time, end_time')
        .eq('user_id', userId)
        .gte('start_time', startOfDay.toISOString())
        .lte('start_time', endOfDay.toISOString());
      
      setAppointments(data || []);
    };

    fetchAppointments();
  }, [selectedDate, userId]);

  // --- LÓGICA DE GENERACIÓN DE HUECOS (ACTUALIZADA CON HORARIOS REALES) ---
  const generateTimeSlots = () => {
    if (!selectedService || !selectedDate) return [];

    // 1. Averiguar qué día es (0=Domingo, 1=Lunes...)
    // Usamos T00:00:00 para asegurar que tomamos el día local correcto
    const dateObj = new Date(`${selectedDate}T00:00:00`);
    const dayIndex = getDay(dateObj); 

    // 2. Buscar la regla para este día
    const dayRule = businessHours.find(h => h.day_of_week === dayIndex);

    // Si no hay regla o está cerrado, devolvemos lista vacía
    if (!dayRule || dayRule.is_closed) {
      return []; 
    }

    const slots = [];
    
    // 3. Usar la hora de inicio y fin de la Base de Datos (ej: "10:00:00")
    // Construimos la fecha completa: "2026-02-01T10:00:00"
    const startStr = `${selectedDate}T${dayRule.start_time}`;
    const endStr = `${selectedDate}T${dayRule.end_time}`;

    let currentTime = new Date(startStr);
    const endTime = new Date(endStr);

    // 4. Generar slots (Igual que antes, pero con los límites dinámicos)
    while (currentTime < endTime) {
      const slotStart = currentTime;
      const slotEnd = addMinutes(slotStart, selectedService.duration);

      // Si el servicio termina después del cierre, no mostramos este hueco
      if (slotEnd > endTime) break;

      // Verificar Colisiones
      const isBusy = appointments.some(apt => {
        const aptStart = parseISO(apt.start_time);
        const aptEnd = parseISO(apt.end_time);
        return slotStart < aptEnd && slotEnd > aptStart;
      });

      slots.push({
        time: format(slotStart, 'HH:mm'),
        available: !isBusy
      });

      currentTime = addMinutes(currentTime, 30); 
    }
    return slots;
  };

  // Guardar Reserva (Igual que antes)
  const handleBooking = async (e) => {
    e.preventDefault();
    if (!clientName || !clientPhone) return alert("Llena tus datos");

    const startObj = new Date(`${selectedDate}T${selectedTime}:00`);
    const endObj = addMinutes(startObj, selectedService.duration);

    const { error } = await supabase.from('appointments').insert([{
      user_id: userId,
      service_id: selectedService.id,
      client_name: clientName,
      client_phone: clientPhone,
      start_time: startObj.toISOString(),
      end_time: endObj.toISOString(),
      status: 'confirmed' 
    }]);

    if (error) {
      alert("Error al reservar: " + error.message);
    } else {
      alert("¡Cita Agendada con Éxito!");
      window.location.reload();
    }
  };

  // Variable auxiliar para saber si el día está cerrado (para mostrar mensaje en UI)
  const isDayClosed = () => {
    const dateObj = new Date(`${selectedDate}T00:00:00`);
    const dayIndex = getDay(dateObj);
    const rule = businessHours.find(h => h.day_of_week === dayIndex);
    return !rule || rule.is_closed;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4 font-sans">
      
      {/* HEADER */}
      <div className="max-w-lg w-full mb-6">
        {step > 1 && (
          <button onClick={() => setStep(step - 1)} className="text-gray-500 hover:text-blue-600 flex items-center gap-2 mb-4 font-bold">
            <FaChevronLeft /> Volver
          </button>
        )}
        <h1 className="text-2xl font-bold text-gray-800">
          {step === 1 && "1. Selecciona un Servicio"}
          {step === 2 && "2. Elige Fecha y Hora"}
          {step === 3 && "3. Confirma tus Datos"}
        </h1>
      </div>

      <div className="max-w-lg w-full bg-white rounded-xl shadow-lg p-6 min-h-[400px]">
        
        {/* PASO 1: SERVICIOS */}
        {step === 1 && (
          <div className="space-y-3">
            {services.map(service => (
              <div 
                key={service.id}
                onClick={() => { setSelectedService(service); setStep(2); }}
                className="border p-4 rounded-lg hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition flex justify-between items-center group"
              >
                <div>
                  <h3 className="font-bold text-gray-800">{service.name}</h3>
                  <p className="text-sm text-gray-500">{service.duration} min • ${service.price}</p>
                </div>
                <FaChevronLeft className="rotate-180 text-gray-300 group-hover:text-blue-500" />
              </div>
            ))}
            {services.length === 0 && !loading && <p>No hay servicios disponibles.</p>}
          </div>
        )}

        {/* PASO 2: FECHA Y HORA */}
        {step === 2 && (
          <div>
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">Fecha</label>
              <div className="relative">
                <FaCalendarDay className="absolute top-3 left-3 text-gray-400"/>
                <input 
                  type="date" 
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                  value={selectedDate}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
            </div>

            <p className="font-bold text-sm text-gray-700 mb-3">Horarios Disponibles:</p>
            
            {/* Mensaje si está cerrado */}
            {isDayClosed() ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                <FaStoreSlash className="mx-auto text-3xl text-gray-400 mb-2" />
                <p className="text-gray-500 font-bold">No hay servicio este día</p>
                <p className="text-xs text-gray-400">Prueba seleccionando otra fecha</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                {generateTimeSlots().map((slot, idx) => (
                  <button
                    key={idx}
                    disabled={!slot.available}
                    onClick={() => { setSelectedTime(slot.time); setStep(3); }}
                    className={`py-2 px-1 text-sm rounded border transition
                      ${!slot.available 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed decoration-slice line-through' 
                        : 'bg-white border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white font-bold shadow-sm'}
                    `}
                  >
                    {slot.time}
                  </button>
                ))}
                {/* Caso borde: Está abierto pero no caben citas (ej: queda 1 min) */}
                {generateTimeSlots().length === 0 && (
                   <p className="col-span-3 text-center text-sm text-gray-500">No hay horarios disponibles.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* PASO 3: CONFIRMACIÓN */}
        {step === 3 && (
          <form onSubmit={handleBooking} className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <p className="text-sm text-blue-800">Vas a reservar:</p>
              <p className="font-bold text-blue-900 text-lg">{selectedService.name}</p>
              <p className="text-sm text-blue-700">📅 {selectedDate} a las {selectedTime}</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-500">Tu Nombre</label>
              <input 
                required 
                className="w-full border-b-2 border-gray-200 focus:border-blue-500 outline-none py-2"
                placeholder="Ej: Ana López"
                value={clientName} onChange={e => setClientName(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500">Tu Teléfono</label>
              <input 
                required type="tel"
                className="w-full border-b-2 border-gray-200 focus:border-blue-500 outline-none py-2"
                placeholder="Ej: 55 1234 5678"
                value={clientPhone} onChange={e => setClientPhone(e.target.value)}
              />
            </div>

            <button className="w-full bg-black text-white py-3 rounded-lg font-bold mt-4 hover:bg-gray-800 transition">
              Confirmar Reserva
            </button>
          </form>
        )}

      </div>
    </div>
  );
};

export default BookingPage;