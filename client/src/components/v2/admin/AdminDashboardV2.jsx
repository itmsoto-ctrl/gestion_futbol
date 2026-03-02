import React, { useState, useEffect } from 'react';
import LeagueCreator from './LeagueCreator';

const AdminDashboardV2 = () => {
  const [activeTab, setActiveTab] = useState('leagues');
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar ligas desde el servidor
  const fetchLeagues = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/leagues/my-leagues', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (response.ok) {
        setLeagues(data);
      }
    } catch (error) {
      console.error("Error al cargar ligas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeagues();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col md:flex-row font-sans">
      
      {/* SIDEBAR (Escritorio) */}
      <aside className="hidden md:flex w-72 bg-zinc-900/50 border-r border-zinc-800 flex-col p-8 sticky top-0 h-screen">
        <div className="mb-12">
          <h1 className="text-2xl font-black italic uppercase text-lime-400 tracking-tighter">FUTNEX</h1>
        </div>
        <nav className="flex-1 space-y-3">
          <button 
            onClick={() => setActiveTab('leagues')} 
            className={`w-full text-left px-5 py-4 rounded-2xl font-bold text-[10px] tracking-widest uppercase transition-all ${activeTab === 'leagues' ? 'bg-lime-400 text-zinc-950 shadow-lg shadow-lime-400/10' : 'text-zinc-500 hover:bg-zinc-800'}`}
          >
            🏆 Mis Campeonatos
          </button>
          <button 
            onClick={() => setActiveTab('create')} 
            className={`w-full text-left px-5 py-4 rounded-2xl font-bold text-[10px] tracking-widest uppercase transition-all ${activeTab === 'create' ? 'bg-lime-400 text-zinc-950 shadow-lg shadow-lime-400/10' : 'text-zinc-500 hover:bg-zinc-800'}`}
          >
            ➕ Nueva Liga
          </button>
        </nav>
      </aside>

      {/* CUERPO PRINCIPAL */}
      <main className="flex-1 overflow-y-auto pb-32">
        <header className="p-8 flex justify-between items-center bg-zinc-950/50 backdrop-blur-xl sticky top-0 z-30">
          <div>
            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Panel de Control</p>
            <h2 className="text-2xl font-black italic uppercase">Gestión <span className="text-lime-400">Global</span></h2>
          </div>
          <div className="w-12 h-12 bg-zinc-900 rounded-2xl border border-zinc-800 flex items-center justify-center text-xl shadow-inner">👤</div>
        </header>

        <section className="p-8">
          {activeTab === 'leagues' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-end mb-10">
                <div>
                  <h3 className="text-xl font-black italic uppercase tracking-tight">Ligas <span className="text-lime-400">Activas</span></h3>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1">Historial completo de torneos</p>
                </div>
                <span className="text-[10px] font-black text-zinc-400 uppercase bg-zinc-900 px-4 py-2 rounded-xl border border-zinc-800">
                  {leagues.length} Total
                </span>
              </div>

              {loading ? (
                <div className="h-64 flex flex-col items-center justify-center gap-4">
                  <div className="w-10 h-10 border-2 border-lime-400/20 border-t-lime-400 rounded-full animate-spin"></div>
                  <p className="animate-pulse font-black text-zinc-700 text-[9px] tracking-[0.3em]">SINCRONIZANDO...</p>
                </div>
              ) : leagues.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {leagues.map((liga) => (
                    <div 
                      key={liga.id} 
                      onClick={() => window.location.href = `/admin/league/${liga.invite_token}`}
                      className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-[2.5rem] hover:border-lime-400 transition-all cursor-pointer group relative overflow-hidden"
                    >
                      {/* Badge de Fecha */}
                      <div className="flex justify-between items-start mb-8">
                        <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center text-lime-400 group-hover:bg-lime-400 group-hover:text-zinc-950 transition-all duration-300 shadow-xl">
                          <span className="font-black text-xl italic">⚽</span>
                        </div>
                        <div className="text-right">
                          <p className="text-[8px] font-black text-zinc-600 uppercase mb-1">Fecha Creación</p>
                          <p className="text-[10px] font-bold text-zinc-300 bg-zinc-800/50 px-3 py-1 rounded-lg border border-zinc-700/50">
                            {new Date(liga.created_at || Date.now()).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      </div>

                      <h4 className="text-xl font-black italic uppercase mb-2 group-hover:text-lime-400 transition-colors tracking-tight">
                        {liga.name}
                      </h4>
                      
                      <div className="flex items-center gap-4 mb-8">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-zinc-600 uppercase">Equipos</span>
                          <span className="text-sm font-bold tracking-tighter">{liga.teams_count || 0} Registrados</span>
                        </div>
                        <div className="w-px h-6 bg-zinc-800"></div>
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-zinc-600 uppercase">Token</span>
                          <span className="text-sm font-bold tracking-tighter text-lime-400/70">{liga.invite_token}</span>
                        </div>
                      </div>
                      
                      <button className="w-full bg-zinc-800 group-hover:bg-lime-400 group-hover:text-zinc-950 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                        Administrar Torneo
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-zinc-900/20 border border-dashed border-zinc-800 rounded-[3rem] p-20 text-center">
                  <div className="text-5xl mb-6 opacity-20">🏆</div>
                  <p className="text-zinc-500 font-bold italic uppercase text-[10px] tracking-widest">No hay campeonatos registrados</p>
                  <button 
                    onClick={() => setActiveTab('create')} 
                    className="mt-8 bg-lime-400 text-zinc-950 px-10 py-4 rounded-2xl text-[10px] font-black uppercase hover:scale-105 transition-all shadow-xl shadow-lime-400/10"
                  >
                    Crear mi primera liga
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'create' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <LeagueCreator onLeagueCreated={() => {
                setActiveTab('leagues');
                fetchLeagues();
              }} />
            </div>
          )}
        </section>
      </main>

      {/* MENÚ MÓVIL */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-900 p-6 flex justify-around items-center z-50">
        <button onClick={() => setActiveTab('leagues')} className={`text-2xl transition-all ${activeTab === 'leagues' ? 'text-lime-400 scale-125' : 'text-zinc-700'}`}>🏆</button>
        <button 
          onClick={() => setActiveTab('create')} 
          className="w-16 h-16 bg-lime-400 rounded-full flex items-center justify-center -mt-14 border-8 border-zinc-950 text-zinc-950 font-black text-3xl shadow-2xl shadow-lime-400/40 active:scale-90 transition-all"
        >
          +
        </button>
        <button className="text-2xl text-zinc-700">👤</button>
      </nav>
    </div>
  );
};

export default AdminDashboardV2;