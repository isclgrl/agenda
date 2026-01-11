import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { FaCalendarAlt, FaEnvelope, FaLock } from 'react-icons/fa';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    let result;

    if (isSignUp) {
      result = await supabase.auth.signUp({ email, password });
    } else {
      result = await supabase.auth.signInWithPassword({ email, password });
    }

    if (result.error) {
      alert(result.error.message);
    } else if (isSignUp) {
      alert("¡Registro exitoso! Revisa tu correo o inicia sesión.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header Visual */}
        <div className="bg-blue-600 p-8 text-center">
          <div className="mx-auto bg-white w-16 h-16 rounded-full flex items-center justify-center text-blue-600 text-3xl mb-4 shadow-lg">
            <FaCalendarAlt />
          </div>
          <h2 className="text-2xl font-bold text-white">Booking Pro</h2>
          <p className="text-blue-100 text-sm">Gestiona tus citas como un experto</p>
        </div>

        {/* Formulario */}
        <div className="p-8">
          <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">
            {isSignUp ? "Crear Cuenta de Negocio" : "Bienvenido"}
          </h3>

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="relative">
              <FaEnvelope className="absolute top-3 left-3 text-gray-400" />
              <input
                type="email"
                placeholder="Correo"
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="relative">
              <FaLock className="absolute top-3 left-3 text-gray-400" />
              <input
                type="password"
                placeholder="Contraseña"
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? "Cargando..." : (isSignUp ? "Registrarse Gratis" : "Entrar al Sistema")}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            {isSignUp ? "¿Ya tienes cuenta?" : "¿Eres nuevo aquí?"}
            <button 
              onClick={() => setIsSignUp(!isSignUp)}
              className="ml-2 text-blue-600 font-bold hover:underline"
            >
              {isSignUp ? "Inicia Sesión" : "Regístrate"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}