import React, { useState, useEffect, useMemo } from 'react';
import LeagueCreator from './LeagueCreator';
import API_BASE_URL from '../../../apiConfig';
import NukeButton from './NukeButton';
import { Trophy, Plus, Users, Smartphone, Zap, Activity, Mail, Phone, AlertCircle, MapPin } from 'lucide-react';

const AdminDashboardV2 = () => {
  const [activeTab, setActiveTab] = useState('leagues');
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔄 Carga las ligas y automáticamente pide los equipos y jugadores de cada una
  const fetchLeagues = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // 1. Pedimos las ligas básicas
      const response = await fetch(`${API_BASE_URL}/api/leagues/my-leagues`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const basicLeagues = await response.json();

      if (response.ok && basicLeagues.length > 0) {
        // 2. Pedimos los detalles de TODOS los equipos y jugadores de golpe
        const detailedLeagues = await Promise.all(
          basicLeagues.map(async (liga) => {
            try {
              const detailRes = await fetch(`${API_BASE_URL}/api/leagues/league-details/${liga.invite_token}`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (detailRes.ok) {
                const detailData = await detailRes.json();
                return { ...liga, teams: detailData.teams || [] };
              }
            } catch (err) { console.error("Error cargando detalles de la liga", liga.id); }
            return { ...liga, teams: [] };
          })
        );
        setLeagues(detailedLeagues);
      } else {
        setLeagues([]);
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

  const globalStats = useMemo(() => ({
    totalTeams: leagues.reduce((acc, liga) => acc + (liga.teams_count || 0), 0),
    activeLeagues: leagues.length
  }), [leagues]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col md:flex-row font-sans selection:bg-lime-400 selection:text-black">
      
      {/* SIDEBAR */}
      <aside className="hidden md:flex w-72 bg-zinc-900/30 border-r border-zinc-800/50 flex-col p-8 sticky top-0 h-screen z-40">
        <div className="mb-12 flex items-center gap-3">
          <div className="w-10 h-10 bg-lime-400 rounded-xl flex items-center justify-center text-zinc-950 shadow-[0_0_20px_rgba(163,230,53,0.2)]">
            <Zap size={20} fill="currentColor" />
          </div>
          <h1 className="text-2xl font-black italic uppercase text-white tracking-tighter">FUTNEX</h1>
        </div>
        <nav className="flex-1 space-y-2">
          <button onClick={() => setActiveTab('leagues')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold text-[10px] tracking-widest uppercase transition-all ${activeTab === 'leagues' ? 'bg-lime-400 text-zinc-950 shadow-xl' : 'text-zinc-500 hover:bg-zinc-900/50'}`}>
            <Trophy size={16} /> Mis Campeonatos
          </button>
          <button onClick={() => setActiveTab('create')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold text-[10px] tracking-widest uppercase transition-all ${activeTab === 'create' ? 'bg-lime-400 text-zinc-950 shadow-xl' : 'text-zinc-500 hover:bg-zinc-900/50'}`}>
            <Plus size={16} /> Nueva Liga
          </button>
        </nav>
        <div className="mt-auto pt-8 border-t border-zinc-800/50"><NukeButton /></div>
      </aside>

      {/* CUERPO PRINCIPAL */}
      <main className="flex-1 overflow-y-auto pb-32">
        <header className="p-8 flex justify-between items-center bg-zinc-950/80 backdrop-blur-md sticky top-0 z-30 border-b border-zinc-900/50">
          <div>
            <p className="text-[10px] font-black text-lime-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-lime-400 rounded-full animate-pulse"></span> SISTEMA CENTRAL VORA
            </p>
            <h2 className="text-2xl font-black italic uppercase leading-tight">Panel <span className="text-zinc-500 text-lg not-italic">de Control</span></h2>
          </div>
          <div className="w-12 h-12 bg-zinc-900 rounded-2xl border border-zinc-800 flex items-center justify-center text-xl shadow-inner group-hover:border-lime-400 transition-colors">👤</div>
        </header>

        <section className="p-8 max-w-[1400px] mx-auto">
          {activeTab === 'leagues' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* 📊 WIDGETS DE ESTADÍSTICAS GLOBALES */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
                <div className="bg-zinc-900/30 border border-zinc-800/50 p-6 rounded-[2rem] flex items-center gap-5">
                  <div className="w-12 h-12 bg-lime-400/10 text-lime-400 rounded-2xl flex items-center justify-center"><Trophy size={24}/></div>
                  <div>
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">Campeonatos</p>
                    <p className="text-2xl font-black italic uppercase leading-none">{globalStats.activeLeagues}</p>
                  </div>
                </div>
                <div className="bg-zinc-900/30 border border-zinc-800/50 p-6 rounded-[2rem] flex items-center gap-5">
                  <div className="w-12 h-12 bg-blue-400/10 text-blue-400 rounded-2xl flex items-center justify-center"><Users size={24}/></div>
                  <div>
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">Equipos Totales</p>
                    <p className="text-2xl font-black italic uppercase leading-none">{globalStats.totalTeams}</p>
                  </div>
                </div>
                <div className="bg-zinc-900/30 border border-zinc-800/50 p-6 rounded-[2rem] flex items-center gap-5">
                  <div className="w-12 h-12 bg-purple-400/10 text-purple-400 rounded-2xl flex items-center justify-center"><Activity size={24}/></div>
                  <div>
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">Servidor</p>
                    <p className="text-sm font-black italic uppercase text-lime-400 leading-none">ONLINE</p>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="h-64 flex flex-col items-center justify-center gap-4 italic opacity-50 uppercase text-[10px] font-black tracking-widest">
                  <div className="w-10 h-10 border-2 border-lime-400/20 border-t-lime-400 rounded-full animate-spin"></div>
                  Sincronizando Base de Datos...
                </div>
              ) : leagues.length > 0 ? (
                
                /* 🏆 LISTADO EXPANDIDO DE LIGAS -> EQUIPOS -> JUGADORES */
                <div className="space-y-16">
                  {leagues.map((liga) => (
                    <div key={liga.id} className="bg-zinc-900/20 border border-zinc-800/50 rounded-[2.5rem] overflow-hidden">
                      
                      {/* CABECERA DE LA LIGA */}
                      <div className="p-8 border-b border-zinc-800/50 relative overflow-hidden bg-zinc-900/40">
                        <span className="absolute -right-4 -top-4 text-7xl font-black text-white/[0.02] italic uppercase pointer-events-none">
                          {liga.invite_token}
                        </span>
                        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                          <div>
                            <p className="text-[10px] font-black text-lime-400 uppercase tracking-[0.3em] mb-2 flex items-center gap-2">
                              <Trophy size={14}/> Torneo Activo
                            </p>
                            <h3 className="text-4xl font-black italic uppercase tracking-tighter">{liga.name}</h3>
                          </div>
                          <div className="bg-zinc-800/80 px-4 py-2 rounded-xl border border-zinc-700/50 text-right">
                             <p className="text-[8px] font-black text-zinc-600 uppercase mb-0.5 leading-none">Token de Invitación</p>
                             <p className="text-sm font-black italic text-zinc-300 uppercase leading-none">{liga.invite_token}</p>
                          </div>
                        </div>
                      </div>

                      {/* LISTADO DE EQUIPOS DE ESTA LIGA */}
                      <div className="p-6 space-y-8">
                        {liga.teams && liga.teams.length > 0 ? (
                          liga.teams.map((team) => (
                            <div key={team.id} className="bg-zinc-950/50 border border-zinc-800/50 rounded-3xl overflow-hidden">
                              
                              {/* CABECERA DEL EQUIPO */}
                              <div className="px-6 py-4 bg-zinc-800/30 border-b border-zinc-800/50 flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                  <img src={team.logo || '/default-team.png'} className="w-10 h-10 rounded-xl object-contain bg-zinc-900 p-1 border border-zinc-700" alt="logo" />
                                  <h4 className="text-lg font-black italic uppercase text-lime-400">{team.name}</h4>
                                </div>
                                <span className="text-[9px] font-black bg-zinc-800 text-zinc-400 px-3 py-1 rounded-full uppercase tracking-widest border border-zinc-700">
                                  {team.player_count} Inscritos
                                </span>
                              </div>

                              {/* TABLA DE JUGADORES DEL EQUIPO */}
                              <div className="overflow-x-auto">
                                <table className="w-full text-left min-w-[800px]">
                                  <thead>
                                    <tr className="text-[9px] font-black text-zinc-600 uppercase tracking-widest border-b border-zinc-800/50 bg-zinc-900/20">
                                      <th className="py-3 pl-6">Jugador</th>
                                      <th className="py-3">Pos / País</th>
                                      <th className="py-3">Contacto</th>
                                      <th className="py-3">Identidad</th>
                                      <th className="py-3 text-center pr-6">Instalación</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-zinc-800/30">
                                    {team.players?.map((player) => (
                                      <tr key={player.id} className="hover:bg-zinc-800/20 transition-colors">
                                        
                                        {/* Foto, Nombre y Dorsal */}
                                        <td className="py-4 pl-6">
                                          <div className="flex items-center gap-3">
                                            <img src={player.photo_url || '/default-avatar.png'} className={`w-10 h-10 rounded-full object-cover border-2 ${player.photo_url ? 'border-lime-400' : 'border-red-500/50'}`} alt="player" />
                                            <div>
                                              <p className="font-bold text-sm uppercase italic">{player.fullName}</p>
                                              <p className="text-[9px] text-zinc-500 font-bold tracking-widest">DORSAL {player.dorsal || '--'}</p>
                                            </div>
                                          </div>
                                        </td>

                                        {/* Posición y País */}
                                        <td className="py-4">
                                          <p className="font-bold text-xs uppercase text-lime-400">{player.position || 'N/D'}</p>
                                          <p className="text-[9px] text-zinc-500 font-bold tracking-widest uppercase flex items-center gap-1 mt-1"><MapPin size={10}/> {player.country_code || 'ES'}</p>
                                        </td>

                                        {/* Contacto (Email y Teléfono) */}
                                        <td className="py-4">
                                          <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-zinc-300 flex items-center gap-2">
                                              <Mail size={12} className="text-zinc-600"/> {player.email || <span className="text-red-500/50 italic">Sin correo</span>}
                                            </p>
                                            <p className="text-[10px] font-bold text-zinc-300 flex items-center gap-2">
                                              <Phone size={12} className="text-zinc-600"/> {player.phone || <span className="text-red-500/50 italic">Sin móvil</span>}
                                            </p>
                                          </div>
                                        </td>

                                        {/* DNI */}
                                        <td className="py-4">
                                          <p className="text-[9px] font-black tracking-widest uppercase text-zinc-400 bg-zinc-900 px-3 py-1 rounded-lg inline-block border border-zinc-800">
                                            {player.dni || 'PENDIENTE'}
                                          </p>
                                        </td>

                                        {/* Estado PWA */}
                                        <td className="py-4 text-center pr-6">
                                          {player.is_pwa ? (
                                            <div className="inline-flex items-center gap-1.5 bg-lime-400/10 text-lime-400 px-3 py-1 rounded-xl border border-lime-400/20">
                                              <Smartphone size={12} /> <span className="text-[9px] font-black uppercase tracking-widest">App</span>
                                            </div>
                                          ) : (
                                            <div className="inline-flex items-center gap-1.5 bg-zinc-900 text-zinc-500 px-3 py-1 rounded-xl border border-zinc-800" title="Usa navegador web">
                                              <AlertCircle size={12} /> <span className="text-[9px] font-black uppercase tracking-widest">Web</span>
                                            </div>
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                                {team.players?.length === 0 && (
                                  <p className="p-6 text-center text-zinc-600 text-[10px] font-bold uppercase italic tracking-widest">Sin plantilla</p>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-8 text-center border-2 border-dashed border-zinc-800 rounded-3xl">
                            <p className="text-zinc-500 font-bold italic uppercase text-[10px] tracking-widest">No hay equipos registrados en esta liga</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-zinc-900/10 border-2 border-dashed border-zinc-800 rounded-[3rem] p-20 text-center flex flex-col items-center">
                  <Trophy size={48} className="text-zinc-800 mb-6" />
                  <p className="text-zinc-500 font-bold italic uppercase text-[10px] tracking-[0.3em]">No hay ligas registradas</p>
                  <button onClick={() => setActiveTab('create')} className="mt-8 bg-white text-zinc-950 px-12 py-5 rounded-2xl text-[10px] font-black uppercase hover:bg-lime-400 transition-all shadow-2xl active:scale-95">Empezar ahora</button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'create' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto">
              <LeagueCreator onLeagueCreated={() => { setActiveTab('leagues'); fetchLeagues(); }} />
            </div>
          )}
        </section>
      </main>
      
      {/* MENÚ MÓVIL */}
      <nav className="md:hidden fixed bottom-6 left-6 right-6 bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 rounded-3xl p-4 flex justify-around items-center z-50 shadow-2xl">
        <button onClick={() => setActiveTab('leagues')} className={`p-3 rounded-2xl transition-all ${activeTab === 'leagues' ? 'bg-lime-400 text-zinc-950 shadow-lg' : 'text-zinc-500'}`}><Trophy size={24} /></button>
        <button onClick={() => setActiveTab('create')} className={`p-3 rounded-2xl transition-all ${activeTab === 'create' ? 'bg-lime-400 text-zinc-950 shadow-lg' : 'text-zinc-500'}`}><Plus size={24} /></button>
      </nav>
      <NukeButton />
    </div>
  );
};

export default AdminDashboardV2;