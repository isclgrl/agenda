import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { FaSave, FaClock } from 'react-icons/fa';

const DAYS = [
  { id: 0, label: 'Domingo' },
  { id: 1, label: 'Lunes' },
  { id: 2, label: 'Martes' },
  { id: 3, label: 'Miércoles' },
  { id: 4, label: 'Jueves' },
  { id: 5, label: 'Viernes' },
  { id: 6, label: 'Sábado' },
];

const ScheduleSettings = ({ session }) => {
  const [loading, setLoading] = useState(false);
  // Estado inicial: Todos abiertos de 9 a 6 por defecto
  const [schedule, setSchedule] = useState(
    DAYS.map(d => ({
      day_of_week: d.id,
      start_time: '09:00',
      end_time: '18:00',
      is_closed: d.id === 0 || d.id === 6 // Fines de semana cerrados por defecto visualmente
    }))
  );

  // 1. Cargar horarios guardados
  useEffect(() => {
    const fetchSchedule = async () => {
      const { data } = await supabase
        .from('business_hours')
        .select('*')
        .eq('user_id', session.user.id);

      if (data && data.length > 0) {
        // Fusionamos lo que viene de la BD con la estructura base
        const merged = DAYS.map(d => {
          const found = data.find(item => item.day_of_week === d.id);
          return found ? { ...found, start_time: found.start_time.slice(0,5), end_time: found.end_time.slice(0,5) } : 
                         { day_of_week: d.id, start_time: '09:00', end_time: '18:00', is_closed: true };
        });
        setSchedule(merged);
      }
    };
    fetchSchedule();
  }, [session]);

  // 2. Guardar cambios
  const handleSave = async () => {
    setLoading(true);
    try {
      const updates = schedule.map(day => ({
        user_id: session.user.id,
        day_of_week: day.day_of_week,
        start_time: day.start_time,
        end_time: day.end_time,
        is_closed: day.is_closed
      }));

      // Usamos upsert: Si existe actualiza, si no existe crea
      const { error } = await supabase.from('business_hours').upsert(updates, { onConflict: 'user_id, day_of_week' });

      if (error) throw error;
      alert('¡Horario actualizado con éxito!');
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper para modificar un día específico en el estado
  const updateDay = (dayIndex, field, value) => {
    const newSchedule = [...schedule];
    const index = newSchedule.findIndex(s => s.day_of_week === dayIndex);
    newSchedule[index] = { ...newSchedule[index], [field]: value };
    setSchedule(newSchedule);
  };

  return (
    <div className="bg-white rounded-xl shadow p-6 mt-6 max-w-3xl mx-auto">
      <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-6">
        <FaClock className="text-blue-600" /> Configuración de Horarios
      </h2>

      <div className="space-y-4">
        {schedule.map((day) => (
          <div key={day.day_of_week} className="flex items-center justify-between border-b pb-4 last:border-0">
            
            {/* Switch y Nombre */}
            <div className="flex items-center gap-4 w-1/3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={!day.is_closed} 
                  onChange={(e) => updateDay(day.day_of_week, 'is_closed', !e.target.checked)}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
              <span className={`font-bold ${day.is_closed ? 'text-gray-400' : 'text-gray-700'}`}>
                {DAYS[day.day_of_week].label}
              </span>
            </div>

            {/* Selectores de Hora */}
            <div className={`flex gap-4 items-center transition-opacity ${day.is_closed ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
              <input 
                type="time" 
                value={day.start_time}
                onChange={(e) => updateDay(day.day_of_week, 'start_time', e.target.value)}
                className="border rounded p-2 text-sm"
              />
              <span className="text-gray-400">-</span>
              <input 
                type="time" 
                value={day.end_time}
                onChange={(e) => updateDay(day.day_of_week, 'end_time', e.target.value)}
                className="border rounded p-2 text-sm"
              />
            </div>

            {/* Etiqueta de estado */}
            <div className="w-20 text-right text-sm font-bold text-gray-400">
              {day.is_closed ? 'CERRADO' : 'ABIERTO'}
            </div>
          </div>
        ))}
      </div>

      <button 
        onClick={handleSave}
        disabled={loading}
        className="mt-8 w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition flex justify-center items-center gap-2"
      >
        {loading ? 'Guardando...' : <><FaSave /> Guardar Horarios</>}
      </button>
    </div>
  );
};

export default ScheduleSettings;