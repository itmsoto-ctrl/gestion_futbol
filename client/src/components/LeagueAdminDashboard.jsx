import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API_BASE_URL from '../apiConfig';
import EditTeamModal from './EditTeamModal'; 

const LeagueAdminDashboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [league, setLeague] = useState(null);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState(null);

  const fetchLeagueData = useCallback(async () => {
    try {
      // ✅ CORRECCIÓN: La ruta suele ser league-details
      const response = await fetch(`${API_BASE_URL}/api/leagues/league-details/${id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (response.ok) {
        setLeague(data.league);
        setTeams(data.teams);
      }
    } catch (error) {
        console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchLeagueData();
  }, [fetchLeagueData]);

  const sendWhatsApp = (team) => {
    // ✅ Usamos invite_token que es el estándar en tu DB
    const inviteLink = `https://gestionfutbol7.netlify.app/join/${team.invite_token}`;
    const text = `⚽ ¡Hola! Soy el Admin de la liga ${league.name}. Aquí tienes el enlace para que tú y tu equipo os registréis: ${inviteLink}`;
    
    const url = team.captain_phone 
      ? `https://wa.me/${team.captain_phone.replace(/\s+/g, '')}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    
    window.open(url, '_blank');
  };

  if (loading) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-lime-400 font-black italic animate-pulse">CARGANDO MOTOR...</div>;

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 pb-24 font-sans">
      <header className="mb-10 mt-6 flex justify-between items-center px-2">
        <div>
            <img src="/logo-shine.webp" alt="VORA" className="h-8 mb-4 drop-shadow-[0_0_10px_rgba(163,230,53,0.2)]" />
            <h1 className="text-4xl font-black uppercase italic text-white tracking-tighter leading-none">
              {league?.name}
            </h1>
            <p className="text-lime-400 text-[10px] font-black uppercase tracking-widest mt-2">Gestión de Equipos</p>
        </div>
        <button onClick={() => navigate('/admin/dashboard')} className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center border border-zinc-800 text-xl shadow-lg">🏠</button>
      </header>

      <div className="grid gap-6 sm:grid-cols-2">
        {teams.map(team => (
          <div key={team.id} className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-7 shadow-2xl relative overflow-hidden">
            <div className="flex justify-between items-start mb-6">
              <div className="pr-4">
                <h3 className="text-2xl font-black uppercase italic text-white leading-none">{team.name}</h3>
                <div className="flex items-center gap-2 mt-3">
                    <span className={`w-2 h-2 rounded-full ${team.captain_id ? 'bg-lime-400' : 'bg-zinc-700 animate-pulse'}`}></span>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-tighter">
                        {team.player_count} Inscritos • {team.captain_id ? 'Capitán OK' : 'Pendiente'}
                    </p>
                </div>
              </div>
              <div className="bg-zinc-950 p-2 rounded-2xl border border-zinc-800">
                {team.logo ? <img src={team.logo} className="w-12 h-12 rounded-xl object-contain" /> : <div className="w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center text-xl">🛡️</div>}
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => sendWhatsApp(team)}
                className="flex-[3] bg-[#25D366] text-white font-black py-4 rounded-3xl text-[11px] uppercase italic flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                📩 Invitar Capitán
              </button>
              <button 
                onClick={() => setSelectedTeam(team)}
                className="flex-1 bg-zinc-800 text-white py-4 rounded-3xl active:scale-95 border border-zinc-700"
              >
                ⚙️
              </button>
            </div>

            <div className="mt-6">
                <div className="flex justify-between text-[8px] font-black uppercase text-zinc-600 mb-1 px-1">
                    <span>Inscripción</span>
                    <span>{Math.round((team.player_count / 12) * 100)}%</span>
                </div>
                <div className="w-full bg-zinc-950 h-2 rounded-full border border-zinc-800 overflow-hidden">
                    <div className="bg-lime-400 h-full" style={{ width: `${Math.min((team.player_count / 12) * 100, 100)}%` }}></div>
                </div>
            </div>
          </div>
        ))}
      </div>

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