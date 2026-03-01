import React, { useState, useEffect } from 'react';
import LeagueCreator from './LeagueCreator';

const AdminDashboardV2 = () => {
  const [activeTab, setActiveTab] = useState('leagues');
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar ligas desde el servidor
  const fetchLeagues = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/leagues/my-leagues', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (response.ok) setLeagues(data);
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
          <h1 className="text-2xl font-black italic uppercase text-lime-400">FUTNEX</h1>
        </div>
        <nav className="flex-1 space-y-3">
          <button onClick={() => setActiveTab('leagues')} className={`w-full text-left px-5 py-4 rounded-2xl font-bold text-[10px] tracking-widest uppercase transition-all ${activeTab === 'leagues' ? 'bg-lime-400 text-zinc-950' : 'text-zinc-500 hover:bg-zinc-800'}`}>🏆 Mis Ligas</button>
          <button onClick={() => setActiveTab('create')} className={`w-full text-left px-5 py-4 rounded-2xl font-bold text-[10px] tracking-widest uppercase transition-all ${activeTab === 'create' ? 'bg-lime-400 text-zinc-950' : 'text-zinc-500 hover:bg-zinc-800'}`}>➕ Nueva Liga</button>
        </nav>
      </aside>

      {/* CUERPO PRINCIPAL */}
      <main className="flex-1 overflow-y-auto pb-32">
        <header className="p-8 flex justify-between items-center bg-zinc-950/50 backdrop-blur-xl sticky top-0 z-30">
          <div>
            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Panel de Control</p>
            <h2 className="text-2xl font-black italic uppercase">Gestión <span className="text-lime-400">Global</span></h2>
          </div>
          <div className="w-12 h-12 bg-zinc-800 rounded-2xl border border-zinc-700 flex items-center justify-center">👤</div>
        </header>

        <section className="p-8">
          {activeTab === 'leagues' && (
            <div className="animate-in fade-in duration-500">
              <div className="flex justify-between items-end mb-8">
                <h3 className="text-xl font-black italic uppercase">Ligas <span className="text-lime-400">Activas</span></h3>
                <span className="text-[10px] font-bold text-zinc-500 uppercase">{leagues.length} Total</span>
              </div>

              {loading ? (
                <div className="h-64 flex items-center justify-center"><p className="animate-pulse font-bold text-zinc-700">CARGANDO...</p></div>
              ) : leagues.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {leagues.map((liga) => (
                    <div key={liga.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-[2.5rem] hover:border-lime-400/50 transition-all group">
                      <div className="flex justify-between items-start mb-6">
                        <div className="w-12 h-12 bg-lime-400 rounded-2xl flex items-center justify-center text-zinc-950 text-xl">⚽</div>
                        <span className="bg-zinc-800 text-[9px] font-black uppercase px-3 py-1 rounded-full text-lime-400">ID: {liga.invite_token}</span>
                      </div>
                      <h4 className="text-xl font-black italic uppercase mb-1">{liga.name}</h4>
                      <p className="text-zinc-500 text-xs font-bold uppercase tracking-tighter mb-6">{liga.teams_count} Equipos • {liga.match_minutes} Minutos</p>
                      
                      <div className="flex gap-2">
                        <button className="flex-1 bg-zinc-800 hover:bg-zinc-700 py-3 rounded-xl text-[10px] font-bold uppercase transition-all">Ver Partidos</button>
                        <button className="w-12 h-11 bg-zinc-800 hover:bg-lime-400 hover:text-zinc-950 rounded-xl flex items-center justify-center transition-all">🔗</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-zinc-900/30 border border-dashed border-zinc-800 rounded-[2.5rem] p-20 text-center">
                  <p className="text-zinc-600 font-medium italic">No tienes ligas creadas todavía.</p>
                  <button onClick={() => setActiveTab('create')} className="mt-6 bg-lime-400 text-zinc-950 px-8 py-3 rounded-2xl text-[10px] font-bold uppercase">Crear Mi Primera Liga</button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'create' && <LeagueCreator />}
        </section>
      </main>

      {/* MENÚ MÓVIL */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 p-6 flex justify-around items-center z-50">
        <button onClick={() => setActiveTab('leagues')} className={`text-2xl ${activeTab === 'leagues' ? 'text-lime-400' : 'text-zinc-600'}`}>🏆</button>
        <button onClick={() => setActiveTab('create')} className="w-14 h-14 bg-lime-400 rounded-full flex items-center justify-center -mt-12 border-4 border-zinc-950 text-zinc-950 font-black text-2xl shadow-xl shadow-lime-400/20">+</button>
        <button className="text-2xl text-zinc-600">👤</button>
      </nav>
    </div>
  );
};

export default AdminDashboardV2;