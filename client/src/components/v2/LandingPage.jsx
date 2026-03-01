import React from 'react';
import { useNavigate } from 'react-router-dom';
// Importamos los estilos de la animación
import '../../logo-animation.css'; 
// Importamos el logo (asegúrate de que esté en src/)
import logoImg from '../../logo-shine.webp'; 

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-250 text-white flex flex-col font-sans overflow-x-hidden">
      
      {/* --- SECCIÓN HERO (AJUSTADA PARA SUBIR EL CONTENIDO) --- */}
      <header className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        
        {/* Fondo */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30 scale-105"
          style={{ backgroundImage: "url('/bg-hero.webp')" }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-transparent"></div>
        
        {/* Contenido del Header: Reducimos mt-12 a mt-4 para que suba todo */}
        <div className="relative z-10 text-center px-6 mt-4">
          
          {/* LOGO PROTAGONISTA (Subimos el margen inferior mb-16 a mb-8) */}
          <div className="flex justify-center mb-8">
            <div className="perfect-contour-container">
              
              {/* Capa 1: Aura */}
              <img src={logoImg} alt="" className="logo-contour-glow" />

              {/* Capa 2: La serpiente de borde fino */}
              <div 
                className="contour-chase-effect" 
                style={{ '--logo-url': `url(${logoImg})` }}
              ></div>

              {/* Capa 3: Logo real */}
              <img src={logoImg} alt="Logo Copa" className="logo-contour-real" />
              
            </div>
          </div>

          {/* Títulos: Ajustamos tamaños para que sea más compacto y alto */}
          <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter uppercase leading-none mb-2 drop-shadow-2xl">
            Liga <span className="text-lime-400 text-shadow-glow">2026</span>
          </h1>
          
          <p className="text-zinc-400 text-sm md:text-lg font-medium max-w-sm mx-auto leading-tight uppercase tracking-[0.4em] opacity-80">
            Elite Football Experience
          </p>
        </div>
      </header>

      {/* --- BLOQUE DE ACCIÓN (LOGIN RECUPERADO) --- */}
      <main className="flex-1 px-6 -mt-16 relative z-20 pb-10">
        <div className="max-w-md mx-auto space-y-4">
          
          {/* Botón Principal */}
          <button 
            onClick={() => navigate('/register')}
            className="w-full bg-lime-400 text-zinc-950 font-black py-5 rounded-2xl text-xl uppercase italic hover:bg-lime-300 transition-all transform hover:scale-[1.02] active:scale-95 shadow-[0_15px_40px_rgba(163,230,53,0.3)]"
          >
            Registrar mi Jugador
          </button>
          
          {/* Botón de Login Recuperado */}
          <button 
            onClick={() => navigate('/login')}
            className="w-full bg-zinc-900/60 backdrop-blur-md text-white font-bold py-4 rounded-2xl text-lg uppercase border border-zinc-800 hover:bg-zinc-700 transition-all"
          >
            Entrar a mi zona
          </button>

          {/* Estadísticas / Info */}
          <section className="mt-10 grid grid-cols-2 gap-4">
            <div className="bg-zinc-900/40 backdrop-blur-sm p-4 rounded-3xl border border-zinc-800/50 text-center">
              <p className="text-lime-400 font-black text-2xl">6</p>
              <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mt-1">Equipos</p>
            </div>
            <div className="bg-zinc-900/40 backdrop-blur-sm p-4 rounded-3xl border border-zinc-800/50 text-center">
              <p className="text-white font-black text-2xl">PWA</p>
              <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mt-1">Ready</p>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center border-t border-zinc-900/30">
        <p className="text-zinc-700 text-[9px] uppercase tracking-[0.5em] font-medium">
          © 2026 Management System
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;