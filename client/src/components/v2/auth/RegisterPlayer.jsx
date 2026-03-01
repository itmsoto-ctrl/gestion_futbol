import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const teams = [
  { id: 1, name: 'Piratas FC', color: 'bg-red-600' },
  { id: 2, name: 'Rayo Vallesca', color: 'bg-yellow-500' },
  { id: 3, name: 'Titanes BK', color: 'bg-blue-600' },
  { id: 4, name: 'Galácticos', color: 'bg-purple-600' },
  { id: 5, name: 'Dream Team', color: 'bg-emerald-500' },
  { id: 6, name: 'Spartans', color: 'bg-orange-600' },
];

const RegisterPlayer = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    playerName: '',
    phone: '',
    teamId: null
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.teamId) return alert("Selecciona un equipo");
    
    console.log("Enviando registro:", formData);
    // Aquí conectaremos con tu API de Railway en el siguiente paso
    alert("¡Fichaje completado! (Simulado)");
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 font-sans">
      <header className="mb-10 mt-4 text-center">
        <h2 className="text-4xl font-black italic uppercase tracking-tighter">
          Ficha por un <span className="text-lime-400">Equipo</span>
        </h2>
        <p className="text-zinc-500 text-sm uppercase tracking-widest mt-2">Introduce tus datos de capitán/jugador</p>
      </header>

      <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-8">
        
        {/* Input de Nombre */}
        <div className="space-y-2">
          <label className="text-[10px] uppercase font-bold text-zinc-500 ml-2 tracking-widest">Nombre Completo</label>
          <input 
            type="text" 
            required
            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-lime-400 transition-all placeholder:text-zinc-700"
            placeholder="Ej: David Villa"
            onChange={(e) => setFormData({...formData, playerName: e.target.value})}
          />
        </div>

        {/* Input de Teléfono */}
        <div className="space-y-2">
          <label className="text-[10px] uppercase font-bold text-zinc-500 ml-2 tracking-widest">Teléfono (WhatsApp)</label>
          <input 
            type="tel" 
            required
            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-lime-400 transition-all placeholder:text-zinc-700"
            placeholder="600 000 000"
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
          />
        </div>

        {/* Selector de Equipos (Grid 2x3) */}
        <div className="space-y-4">
          <label className="text-[10px] uppercase font-bold text-zinc-500 ml-2 tracking-widest text-center block">Selecciona tu Equipo</label>
          <div className="grid grid-cols-2 gap-3">
            {teams.map((team) => (
              <button
                key={team.id}
                type="button"
                onClick={() => setFormData({...formData, teamId: team.id})}
                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${
                  formData.teamId === team.id 
                  ? 'border-lime-400 bg-zinc-800 scale-95 shadow-[0_0_20px_rgba(163,230,53,0.2)]' 
                  : 'border-zinc-800 bg-zinc-900 opacity-60'
                }`}
              >
                <div className={`w-8 h-8 rounded-full ${team.color} shadow-lg`}></div>
                <span className="font-bold text-xs uppercase italic">{team.name}</span>
              </button>
            ))}
          </div>
        </div>

        <button 
          type="submit"
          className="w-full bg-lime-400 text-zinc-950 font-black py-5 rounded-2xl text-xl uppercase italic hover:bg-lime-300 transition-all shadow-xl active:scale-95"
        >
          Confirmar Inscripción
        </button>

        <button 
          type="button"
          onClick={() => navigate('/')}
          className="w-full text-zinc-600 text-xs uppercase font-bold tracking-widest py-4"
        >
          Volver atrás
        </button>
      </form>
    </div>
  );
};

export default RegisterPlayer;