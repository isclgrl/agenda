import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import Login from '../components/Login';
import Services from '../components/Services';
import AdminCalendar from '../components/AdminCalendar';
import ScheduleSettings from '../components/ScheduleSettings';
import { FaCalendarAlt, FaCut, FaClock } from 'react-icons/fa';

function App() {
  const [session, setSession] = useState(null);
  const [view, setView] = useState('calendar');

  useEffect(() => {
    // 1. Ver si ya hay sesión al cargar
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // 2. Escuchar cambios (Login/Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // SI NO HAY SESIÓN -> MOSTRAMOS LOGIN
  if (!session) {
    return <Login />;
  }

  // SI HAY SESIÓN -> MOSTRAMOS EL DASHBOARD (Por ahora simple)
  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      
      {/* HEADER SUPERIOR */}
      <nav className="bg-white shadow-sm border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 text-white p-2 rounded-lg">
            <FaCalendarAlt />
          </div>
          <span className="font-bold text-xl text-gray-800">Booking Pro</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500 hidden md:inline">{session.user.email}</span>
          <button onClick={() => supabase.auth.signOut()} className="text-sm font-bold text-red-500 hover:bg-red-50 px-3 py-1 rounded border border-transparent hover:border-red-100 transition">
            Salir
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-4 md:p-8">
        
        {/* PESTAÑAS DE NAVEGACIÓN */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <button 
            onClick={() => setView('calendar')}
            className={`pb-3 px-2 flex items-center gap-2 font-bold text-sm transition border-b-2 
              ${view === 'calendar' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}
            `}
          >
            <FaCalendarAlt /> Calendario
          </button>
          <button 
            onClick={() => setView('services')}
            className={`pb-3 px-2 flex items-center gap-2 font-bold text-sm transition border-b-2 
              ${view === 'services' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}
            `}
          >
            <FaCut /> Servicios
          </button>
          <button 
            onClick={() => setView('settings')}
            className={`pb-3 px-2 flex items-center gap-2 font-bold text-sm transition border-b-2 
              ${view === 'settings' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}
            `}
          >
            <FaClock /> Horarios
          </button>
        </div>

        {/* CONTENIDO DINÁMICO */}
        {view === 'calendar' ? (
          <AdminCalendar session={session} />
        ) : view === 'services' ? (
          <Services session={session} />
        ) : (
          <ScheduleSettings session={session} /> // <--- NUEVO
        )}

      </main>
    </div>
  );
}

export default App;