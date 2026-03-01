import React from 'react';
import { useNavigate } from 'react-router-dom';

const SaaSLanding = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans overflow-x-hidden">
      {/* Hero Section para Organizadores */}
      <section className="px-6 pt-20 pb-10 text-center">
        <h1 className="text-5xl font-black italic uppercase tracking-tighter leading-none mb-6">
          Gestiona tu liga <br/> <span className="text-lime-400 text-glow">Sin Caos</span>
        </h1>
        <p className="text-zinc-400 text-sm max-w-xs mx-auto mb-10 leading-relaxed uppercase tracking-widest">
          Generación automática de calendarios, control de pagos y estadísticas PWA para tus jugadores.
        </p>
        
        <button 
          onClick={() => navigate('/admin/setup')}
          className="bg-lime-400 text-zinc-950 font-black py-5 px-10 rounded-2xl text-xl uppercase italic shadow-[0_10px_40px_rgba(163,230,53,0.3)] active:scale-95 transition-all"
        >
          Crear mi Primera Liga
        </button>
      </section>

      {/* Grid de Ventajas (Móvil) */}
      <section className="px-6 grid gap-4 mb-20">
        <div className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800">
          <h3 className="text-lime-400 font-bold uppercase text-xs mb-2">Calendario Inteligente</h3>
          <p className="text-zinc-500 text-xs italic text-pretty">Olvídate de Excel. El sistema detecta festivos y reparte los partidos en tus campos automáticamente.</p>
        </div>
        <div className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800">
          <h3 className="text-lime-400 font-bold uppercase text-xs mb-2">PWA Nativa</h3>
          <p className="text-zinc-500 text-xs italic text-pretty">Tus jugadores instalan la app con un clic. Notificaciones push para cada gol y resultado.</p>
        </div>
      </section>
    </div>
  );
};

export default SaaSLanding;