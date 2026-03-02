import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminSetup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false); // Nuevo: para evitar doble clic
  const [adminData, setAdminData] = useState({ name: '', email: '', password: '' });

  const handleNext = async (e) => { // Añadimos async
    e.preventDefault();
    
    if (step === 1) {
      setStep(2);
    } else {
      setLoading(true);
      try {
        // ENLACE CON TU SERVIDOR V2
        const response = await fetch(`${API_BASE_URL}/api/auth/admin-register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(adminData)
        });

        const data = await response.json();

        if (response.ok) {
          // SOLO SI EL SERVIDOR DICE "OK" GUARDAMOS Y SEGUIMOS
          console.log("Servidor V2 dice:", data.message);
          navigate('/admin/login'); // Mejor ir al login para entrar oficialmente
        } else {
          alert(data.message || "Error al registrar el administrador");
        }
      } catch (error) {
        console.error("Error de conexión:", error);
        alert("No se pudo conectar con el servidor. ¿Está encendido el puerto 3001?");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col justify-center p-6">
      <div className="max-w-md mx-auto w-full">
        <header className="mb-10">
          <div className="w-12 h-1 bg-lime-400 mb-4 rounded-full"></div>
          <h1 className="text-4xl font-black uppercase italic leading-none">
            {step === 1 ? 'Perfil' : 'Seguridad'} <br />
            <span className="text-lime-400">Administrador</span>
          </h1>
          <p className="text-zinc-600 text-[10px] uppercase tracking-widest mt-2 italic">Temporada 2026</p>
        </header>

        <form onSubmit={handleNext} className="space-y-6">
          {step === 1 ? (
            <div className="animate-in fade-in slide-in-from-right duration-300">
              <div className="space-y-2 mb-4">
                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest ml-2">Nombre de Gestor</label>
                <input 
                  type="text" required
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 px-6 focus:border-lime-400 outline-none transition-all"
                  placeholder="Tu nombre o empresa"
                  onChange={(e) => setAdminData({...adminData, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest ml-2">Email Profesional</label>
                <input 
                  type="email" required
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 px-6 focus:border-lime-400 outline-none transition-all"
                  placeholder="admin@tuapp.com"
                  onChange={(e) => setAdminData({...adminData, email: e.target.value})}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2 animate-in fade-in slide-in-from-right duration-300">
              <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest ml-2">Contraseña Maestra</label>
              <input 
                type="password" required
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 px-6 focus:border-lime-400 outline-none transition-all"
                placeholder="••••••••"
                onChange={(e) => setAdminData({...adminData, password: e.target.value})}
              />
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-lime-400 text-zinc-950 font-black py-5 rounded-2xl text-xl uppercase italic shadow-xl active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? 'Creando...' : (step === 1 ? 'Siguiente Paso' : 'Crear mi Panel')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminSetup;