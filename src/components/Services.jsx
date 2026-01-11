import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { FaTrash, FaPlus, FaCut } from 'react-icons/fa';

const Services = ({ session }) => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados del formulario
  const [name, setName] = useState('');
  const [duration, setDuration] = useState(30);
  const [price, setPrice] = useState('');

  // 1. CARGAR SERVICIOS AL INICIAR
  useEffect(() => {
    fetchServices();
  }, []); // <--- ¡OJO AQUÍ! Estos corchetes vacíos [] evitan el bucle infinito.

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setServices(data);
    } catch (error) {
      console.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. CREAR NUEVO SERVICIO
  const handleAddService = async (e) => {
    e.preventDefault();
    if (!name) return;

    try {
      const { data, error } = await supabase
        .from('services')
        .insert([{ 
          name, 
          duration: parseInt(duration), 
          price: parseFloat(price) || 0,
          user_id: session.user.id 
        }])
        .select();

      if (error) throw error;

      setServices([...services, data[0]]);
      setName('');
      setPrice('');
    } catch (error) {
      alert(error.message);
    }
  };

  // 3. BORRAR SERVICIO
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("¿Estás seguro?");
    if (!confirmDelete) return;

    try {
      const { error } = await supabase.from('services').delete().eq('id', id);
      if (error) throw error;
      setServices(services.filter(service => service.id !== id));
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow p-6 mt-6">
      <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-6">
        <FaCut className="text-blue-600" /> Mis Servicios
      </h2>

      {/* FORMULARIO */}
      <form onSubmit={handleAddService} className="flex flex-col md:flex-row gap-4 mb-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="flex-1">
          <label className="text-xs font-bold text-gray-500 uppercase">Nombre</label>
          <input 
            type="text" 
            placeholder="Ej: Corte de Cabello" 
            className="w-full border p-2 rounded focus:border-blue-500 outline-none"
            value={name} onChange={e => setName(e.target.value)} required 
          />
        </div>
        <div className="w-full md:w-32">
          <label className="text-xs font-bold text-gray-500 uppercase">Duración</label>
          <select 
            className="w-full border p-2 rounded bg-white"
            value={duration} onChange={e => setDuration(e.target.value)}
          >
            <option value="15">15 min</option>
            <option value="30">30 min</option>
            <option value="45">45 min</option>
            <option value="60">1 hora</option>
            <option value="90">1.5 horas</option>
            <option value="120">2 horas</option>
          </select>
        </div>
        <div className="w-full md:w-32">
          <label className="text-xs font-bold text-gray-500 uppercase">Precio</label>
          <input 
            type="number" 
            placeholder="$0.00" 
            className="w-full border p-2 rounded"
            value={price} onChange={e => setPrice(e.target.value)} 
          />
        </div>
        <button className="bg-blue-600 text-white px-6 rounded hover:bg-blue-700 font-bold flex items-center justify-center gap-2 mt-auto h-10 self-end">
          <FaPlus /> Agregar
        </button>
      </form>

      {/* LISTA */}
      {loading ? <p className="text-center text-gray-500">Cargando catálogo...</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.length === 0 && <p className="text-gray-400 col-span-3 text-center">No hay servicios registrados.</p>}
          
          {services.map(service => (
            <div key={service.id} className="border rounded-lg p-4 flex justify-between items-center hover:shadow-md transition bg-white">
              <div>
                <h3 className="font-bold text-lg text-gray-800">{service.name}</h3>
                <p className="text-sm text-gray-500">⏱️ {service.duration} min • 💰 ${service.price}</p>
              </div>
              <button 
                onClick={() => handleDelete(service.id)}
                className="text-red-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition"
              >
                <FaTrash />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Services;