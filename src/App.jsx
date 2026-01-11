import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AdminPanel from './pages/AdminPanel';
import BookingPage from './pages/BookingPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        
        {/* RUTA 1: La raíz (/) es para el Dueño del Negocio (Admin) */}
        <Route path="/" element={<AdminPanel />} />

        {/* RUTA 2: La página pública para clientes */}
        {/* :userId es una variable, ahí irá el ID largo de Supabase */}
        <Route path="/book/:userId" element={<BookingPage />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;