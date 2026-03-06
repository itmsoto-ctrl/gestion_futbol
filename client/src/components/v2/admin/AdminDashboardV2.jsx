import React, { useState, useEffect, useMemo } from 'react';
import LeagueCreator from './LeagueCreator';
import API_BASE_URL from '../../../apiConfig';
import NukeButton from './NukeButton';
import AdminCalendarEditor from './AdminCalendarEditor';
import { Trophy, Plus, Users, Smartphone, Zap, Activity, AlertCircle, Share2, Check, Star } from 'lucide-react';

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

  // 🎖️ FUNCIÓN PARA ASIGNAR/QUITAR CAPITÁN
  const toggleCaptain = async (playerId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/leagues/players/${playerId}/toggle-captain`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        // Actualizamos el estado local para que el cambio sea visualmente instantáneo
        setLeagues(prevLeagues => 
          prevLeagues.map(liga => ({
            ...liga,
            teams: liga.teams.map(team => ({
              ...team,
              players: team.players.map(p => 
                p.id === playerId ? { ...p, is_captain: !p.is_captain } : p
              )
            }))
          }))
        );
      }
    } catch (error) {
      console.error("Error al cambiar rango de capitán:", error);
    }
  };

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
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Campeonatos</p>
                    <p className="text-2xl font-black italic uppercase leading-none">{globalStats.activeLeagues}</p>
                  </div>
                </div>
                <div className="bg-zinc-900/30 border border-zinc-800/50 p-6 rounded-[2rem] flex items-center gap-5">
                  <div className="w-12 h-12 bg-blue-400/10 text-blue-400 rounded-2xl flex items-center justify-center"><Users size={24}/></div>
                  <div>
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Equipos Totales</p>
                    <p className="text-2xl font-black italic uppercase leading-none">{globalStats.totalTeams}</p>
                  </div>
                </div>
                <div className="bg-zinc-900/30 border border-zinc-800/50 p-6 rounded-[2rem] flex items-center gap-5 text-lime-400 font-black uppercase text-[10px]">
                  <Activity size={24}/> Online
                </div>
              </div>

              {loading ? (
                <div className="p-20 text-center animate-pulse font-black uppercase text-xs tracking-widest text-lime-400">Sincronizando Datos...</div>
              ) : leagues.map((liga) => (
                <React.Fragment key={liga.id}>
                  <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-[2.5rem] overflow-hidden shadow-2xl mb-12">
                    <div className="p-8 border-b border-zinc-800/50 bg-zinc-900/40">
                      <h3 className="text-4xl font-black italic uppercase tracking-tighter">{liga.name}</h3>
                    </div>

                    <div className="p-6 space-y-8">
                      {liga.teams?.map((team) => (
                        <div key={team.id} className="bg-zinc-950/50 border border-zinc-800/50 rounded-3xl overflow-hidden shadow-xl">
                          <div className="px-6 py-4 bg-zinc-900/50 border-b border-zinc-800/50 flex flex-wrap justify-between items-center gap-4">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-zinc-900 rounded-lg border border-zinc-800 flex items-center justify-center p-1">
                                <img src={team.logo || '/default-team.png'} className="w-full h-full object-contain" alt="logo" />
                              </div>
                              <h4 className="text-lg font-black italic uppercase text-white">{team.name}</h4>
                            </div>
                            <button 
                              onClick={() => copyInviteLink(team.invite_token, team.id)}
                              className={`flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all
                              ${copiedId === team.id ? 'bg-lime-400 text-black' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
                            >
                              {copiedId === team.id ? <Check size={14}/> : <Share2 size={14}/>} {copiedId === team.id ? 'COPIADO' : 'ENLACE'}
                            </button>
                          </div>

                          <div className="overflow-x-auto">
                            <table className="w-full text-left">
                              <thead>
                                <tr className="text-[8px] font-black uppercase text-zinc-600 tracking-[0.2em] border-b border-zinc-900">
                                  <th className="py-4 pl-6">Jugador</th>
                                  <th className="py-4 px-4 text-center">Rango</th>
                                  <th className="py-4 px-4 text-center">App</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-zinc-900">
                                {team.players?.map((p) => (
                                  <tr key={p.id} className="hover:bg-zinc-900/50 transition-colors">
                                    <td className="py-4 pl-6 flex items-center gap-3">
                                      <img src={p.photo_url || '/default-avatar.png'} className="w-9 h-9 rounded-full object-cover border-2 border-zinc-800" alt="avatar" />
                                      <div>
                                        <p className="text-xs font-black uppercase italic">{p.fullName}</p>
                                        <p className="text-[8px] font-bold text-zinc-500 uppercase">DNI: {p.dni || 'S/D'}</p>
                                      </div>
                                    </td>
                                    
                                    {/* 🎖️ SELECTOR DE CAPITÁN */}
                                    <td className="py-4 px-4 text-center">
                                      <button 
                                        onClick={() => toggleCaptain(p.id)}
                                        className={`p-2 rounded-lg transition-all ${p.is_captain ? 'bg-lime-400 text-black shadow-[0_0_15px_rgba(163,230,53,0.3)]' : 'bg-zinc-900 text-zinc-700'}`}
                                      >
                                        <Trophy size={14} fill={p.is_captain ? "currentColor" : "none"} />
                                      </button>
                                    </td>

                                    {/* 📱 ESTADO PWA (APP) */}
                                    <td className="py-4 px-4 text-center">
                                      {p.is_pwa ? (
                                        <div className="flex items-center justify-center gap-1 text-lime-400">
                                          <Smartphone size={14} />
                                          <span className="text-[8px] font-black uppercase">Activa</span>
                                        </div>
                                      ) : (
                                        <div className="flex items-center justify-center gap-1 text-zinc-700">
                                          <AlertCircle size={14} />
                                          <span className="text-[8px] font-black uppercase">Web</span>
                                        </div>
                                      )}
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
                  <AdminCalendarEditor league={liga} />
                </React.Fragment>
              ))}
            </div>
          )}

          {activeTab === 'create' && (
            <div className="max-w-3xl mx-auto">
              <LeagueCreator onLeagueCreated={() => { setActiveTab('leagues'); fetchLeagues(); }} />
            </div>
          )}
        </section>
      </main>

      <nav className="md:hidden fixed bottom-6 left-6 right-6 bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 rounded-3xl p-4 flex justify-around items-center z-50 shadow-2xl">
        <button onClick={() => setActiveTab('leagues')} className={`p-3 rounded-2xl ${activeTab === 'leagues' ? 'bg-lime-400 text-black' : 'text-zinc-500'}`}><Trophy size={24} /></button>
        <button onClick={() => setActiveTab('create')} className={`p-3 rounded-2xl ${activeTab === 'create' ? 'bg-lime-400 text-black' : 'text-zinc-500'}`}><Plus size={24} /></button>
      </nav>
    </div>
  );
};

export default AdminDashboardV2;