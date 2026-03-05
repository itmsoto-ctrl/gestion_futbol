import React, { useState, useEffect, useMemo } from 'react';
import LeagueCreator from './LeagueCreator';
import API_BASE_URL from '../../../apiConfig';
import NukeButton from './NukeButton';
import AdminCalendarEditor from './AdminCalendarEditor';
import { Trophy, Plus, Users, Smartphone, Zap, Activity, Mail, Phone, AlertCircle, Share2, Copy, Check } from 'lucide-react';

const AdminDashboardV2 = () => {
  const [activeTab, setActiveTab] = useState('leagues');
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  const fetchLeagues = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/leagues/my-leagues`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const basicLeagues = await response.json();

      if (response.ok && basicLeagues.length > 0) {
        const detailedLeagues = await Promise.all(
          basicLeagues.map(async (liga) => {
            try {
              const detailRes = await fetch(`${API_BASE_URL}/api/leagues/league-details/${liga.invite_token}`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (detailRes.ok) {
                const detailData = await detailRes.json();
                return { ...liga, ...detailData.league, teams: detailData.teams || [] };
              }
            } catch (err) { console.error("Error detalle liga", liga.id); }
            return { ...liga, teams: [] };
          })
        );
        setLeagues(detailedLeagues);
      } else { setLeagues([]); }
    } catch (error) { console.error("Error carga", error); } finally { setLoading(false); }
  };

  useEffect(() => { fetchLeagues(); }, []);

  // 🔗 FUNCIÓN PARA GENERAR Y COPIAR EL ENLACE
  const copyInviteLink = (token, teamId) => {
    const baseUrl = window.location.origin;
    const fullUrl = `${baseUrl}/portal/${token}`;
    
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(teamId);
    setTimeout(() => setCopiedId(null), 2000);
  };

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
          <h1 className="text-2xl font-black italic uppercase tracking-tighter">FUTNEX</h1>
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

      <main className="flex-1 overflow-y-auto pb-32">
        <header className="p-8 flex justify-between items-center bg-zinc-950/80 backdrop-blur-md sticky top-0 z-30 border-b border-zinc-900/50">
          <div>
            <p className="text-[10px] font-black text-lime-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-lime-400 rounded-full animate-pulse"></span> SISTEMA CENTRAL VORA
            </p>
            <h2 className="text-2xl font-black italic uppercase leading-tight">Panel <span className="text-zinc-500 text-lg not-italic">de Control</span></h2>
          </div>
        </header>

        <section className="p-8 max-w-[1400px] mx-auto">
          {activeTab === 'leagues' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* STATS */}
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
                <div className="bg-zinc-900/30 border border-zinc-800/50 p-6 rounded-[2rem] flex items-center gap-5 text-lime-400">
                  <Activity size={24}/> <span className="text-[10px] font-black uppercase">Online</span>
                </div>
              </div>

              {loading ? (
                <div className="p-20 text-center animate-pulse font-black uppercase text-xs tracking-widest text-lime-400">Sincronizando Datos...</div>
              ) : leagues.length > 0 ? (
                <div className="space-y-16">
                  {leagues.map((liga) => (
                    <React.Fragment key={liga.id}>
                      <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-[2.5rem] overflow-hidden shadow-2xl">
                        
                        {/* HEADER LIGA */}
                        <div className="p-8 border-b border-zinc-800/50 bg-zinc-900/40">
                          <p className="text-[10px] font-black text-lime-400 uppercase tracking-[0.3em] mb-2 flex items-center gap-2">
                             <Trophy size={14}/> Torneo Activo
                          </p>
                          <h3 className="text-4xl font-black italic uppercase tracking-tighter">{liga.name}</h3>
                        </div>

                        {/* LISTADO EQUIPOS */}
                        <div className="p-6 space-y-8">
                          {liga.teams?.map((team) => (
                            <div key={team.id} className="bg-zinc-950/50 border border-zinc-800/50 rounded-3xl overflow-hidden shadow-xl">
                              
                              {/* CABECERA EQUIPO + BOTÓN ENLACE */}
                              <div className="px-6 py-4 bg-zinc-900/50 border-b border-zinc-800/50 flex flex-wrap justify-between items-center gap-4">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 bg-zinc-900 rounded-xl border border-zinc-800 flex items-center justify-center p-1">
                                    <img src={team.logo || '/default-team.png'} className="w-full h-full object-contain" alt="logo" />
                                  </div>
                                  <div>
                                    <h4 className="text-lg font-black italic uppercase text-white">{team.name}</h4>
                                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{team.player_count} jugadores</p>
                                  </div>
                                </div>

                                {/* 🚀 BOTÓN DE ENLACE DE INVITACIÓN */}
                                <button 
                                  onClick={() => copyInviteLink(team.invite_token, team.id)}
                                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                                  ${copiedId === team.id ? 'bg-lime-400 text-black shadow-[0_0_20px_rgba(163,230,53,0.4)]' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
                                >
                                  {copiedId === team.id ? <><Check size={14}/> ¡Copiado!</> : <><Share2 size={14}/> Enlace Invitación</>}
                                </button>
                              </div>

                              {/* TABLA JUGADORES (Simplificada para móvil) */}
                              <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                  <tbody className="divide-y divide-zinc-900">
                                    {team.players?.map((p) => (
                                      <tr key={p.id} className="hover:bg-zinc-900/50 transition-colors">
                                        <td className="py-4 pl-6 flex items-center gap-3">
                                          <img src={p.photo_url || '/default-avatar.png'} className="w-9 h-9 rounded-full object-cover border-2 border-zinc-800" alt="avatar" />
                                          <div>
                                            <p className="text-xs font-black uppercase italic">{p.fullName}</p>
                                            <p className="text-[8px] font-bold text-zinc-500">DORSAL {p.dorsal || '--'}</p>
                                          </div>
                                        </td>
                                        <td className="py-4 px-4"><span className="text-[9px] font-black bg-zinc-900 px-2 py-1 rounded text-zinc-400 border border-zinc-800">{p.dni || 'S/D'}</span></td>
                                        <td className="py-4 text-center pr-6">
                                          {p.is_pwa ? <Smartphone size={14} className="text-lime-400 mx-auto" /> : <AlertCircle size={14} className="text-zinc-700 mx-auto" />}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 📅 EDITOR CALENDARIO */}
                      <AdminCalendarEditor league={liga} />
                    </React.Fragment>
                  ))}
                </div>
              ) : (
                <div className="text-center p-20 border-2 border-dashed border-zinc-800 rounded-[3rem]">
                   <p className="text-zinc-500 font-black uppercase text-xs tracking-widest">No hay ligas creadas</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'create' && (
            <div className="max-w-3xl mx-auto">
              <LeagueCreator onLeagueCreated={() => { setActiveTab('leagues'); fetchLeagues(); }} />
            </div>
          )}
        </section>
      </main>
      
      {/* MENÚ MÓVIL */}
      <nav className="md:hidden fixed bottom-6 left-6 right-6 bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 rounded-3xl p-4 flex justify-around items-center z-50 shadow-2xl">
        <button onClick={() => setActiveTab('leagues')} className={`p-3 rounded-2xl ${activeTab === 'leagues' ? 'bg-lime-400 text-black' : 'text-zinc-500'}`}><Trophy size={24} /></button>
        <button onClick={() => setActiveTab('create')} className={`p-3 rounded-2xl ${activeTab === 'create' ? 'bg-lime-400 text-black' : 'text-zinc-500'}`}><Plus size={24} /></button>
      </nav>
    </div>
  );
};

export default AdminDashboardV2;