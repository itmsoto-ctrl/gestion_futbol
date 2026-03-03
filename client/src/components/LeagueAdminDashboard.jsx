import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API_BASE_URL from '../apiConfig';
import EditTeamModal from './EditTeamModal'; 
import { Users, ChevronDown, ChevronUp, MessageCircle, Settings, ShieldCheck, ArrowLeft, Trophy } from 'lucide-react';

const LeagueAdminDashboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [league, setLeague] = useState(null);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedTeam, setExpandedTeam] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);

  const fetchLeagueData = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/leagues/league-details/${id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (response.ok) {
        setLeague(data.league);
        setTeams(data.teams);
      }
    } catch (error) {
        console.error("Error al cargar datos de la liga:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchLeagueData();
  }, [fetchLeagueData]);

  const sendWhatsApp = (team) => {
    const inviteLink = `https://gestionfutbol7.netlify.app/join/${team.invite_token}`;
    const text = `⚽ ¡Hola! Aquí tienes el enlace oficial para que todo el equipo "${team.name}" se inscriba en la liga ${league.name}. Pásalo por el grupo: \n\n🔗 ${inviteLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const toggleTeam = (teamId) => {
    setExpandedTeam(expandedTeam === teamId ? null : teamId);
  };

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 border-2 border-lime-400/20 border-t-lime-400 rounded-full animate-spin"></div>
      <p className="text-lime-400 font-black text-[10px] tracking-widest uppercase">Sincronizando VORA...</p>
    </div>
  );

  if (!league) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white font-black uppercase">Liga no encontrada</div>;

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans pb-20">
      
      {/* HEADER FIJO */}
      <header className="p-8 flex justify-between items-center bg-zinc-950/50 backdrop-blur-xl sticky top-0 z-40 border-b border-zinc-900">
        <div className="flex items-center gap-5">
          <button 
            onClick={() => navigate('/admin/dashboard')} 
            className="w-12 h-12 bg-zinc-900 rounded-2xl border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-600 transition-all active:scale-90"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-black italic uppercase leading-none tracking-tighter">{league.name}</h2>
            <p className="text-[10px] font-black text-lime-400 uppercase tracking-[0.2em] mt-1">Panel de Administración</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-3 bg-zinc-900 px-5 py-2 rounded-2xl border border-zinc-800">
          <Trophy size={16} className="text-lime-400" />
          <span className="text-xs font-black uppercase tracking-widest">{teams.length} Equipos</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 mt-4">
        
        <div className="space-y-3">
          {teams.map((team) => (
            <div key={team.id} className="bg-zinc-900/50 border border-zinc-800/50 rounded-[2rem] overflow-hidden transition-all hover:border-zinc-700">
              
              <div className="p-4 md:p-5 flex flex-col md:flex-row items-center justify-between gap-6">
                
                {/* Info Principal Corregida */}
                <div className="flex items-center gap-5 w-full md:w-auto">
                  <div className="w-14 h-14 bg-zinc-950 rounded-2xl flex items-center justify-center overflow-hidden border border-zinc-800 shadow-inner shrink-0">
                    {team.logo ? (
                      <img 
                        src={team.logo} 
                        alt={team.name} 
                        className="w-full h-full object-contain p-2" 
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-zinc-600 font-black">
                        {team.name?.substring(0,2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-black uppercase italic leading-none">{team.name}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-900 flex items-center justify-center">
                        <Users size={10} className="text-zinc-500" />
                      </div>
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{team.player_count} Inscritos</span>
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <button 
                    onClick={() => sendWhatsApp(team)} 
                    className="flex-1 md:flex-none bg-[#25D366]/10 hover:bg-[#25D366] text-[#25D366] hover:text-white border border-[#25D366]/20 py-3 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                  >
                    <MessageCircle size={14} /> Enlace
                  </button>
                  
                  <button 
                    onClick={() => setSelectedTeam(team)} 
                    className="p-3.5 bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-2xl transition-all"
                  >
                    <Settings size={20} />
                  </button>

                  <button 
                    onClick={() => toggleTeam(team.id)} 
                    className={`p-3.5 rounded-2xl transition-all flex items-center gap-2 ${expandedTeam === team.id ? 'bg-lime-400 text-zinc-950' : 'bg-zinc-800 text-lime-400 hover:bg-zinc-700'}`}
                  >
                    {expandedTeam === team.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                </div>
              </div>

              {/* PLANTILLA DESPLEGABLE */}
              {expandedTeam === team.id && (
                <div className="bg-zinc-950/50 border-t border-zinc-800/50 p-6 animate-in slide-in-from-top-2">
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Plantilla Oficial</h4>
                    <span className="h-px flex-1 bg-zinc-800/50 mx-4"></span>
                  </div>
                  
                  {team.players && team.players.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {team.players.map((player, idx) => (
                        <div key={idx} className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-[1.5rem] flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <span className="text-xl font-black italic text-lime-400 w-8">{player.dorsal || '—'}</span>
                            <div>
                              <p className="font-black uppercase italic text-sm text-white leading-none">{player.fullName}</p>
                              <p className="text-[9px] text-zinc-600 font-bold uppercase mt-1 tracking-tighter">{player.dni}</p>
                            </div>
                          </div>
                          {player.is_captain === 1 && (
                            <div className="bg-orange-500/10 p-2 rounded-xl text-orange-500">
                              <ShieldCheck size={16} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-zinc-600 font-bold uppercase italic text-[10px] tracking-widest">
                      Esperando primeras inscripciones...
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      {selectedTeam && (
        <EditTeamModal 
          team={selectedTeam} 
          onClose={() => setSelectedTeam(null)} 
          onUpdate={fetchLeagueData} 
        />
      )}
    </div>
  );
};

export default LeagueAdminDashboard;