import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';

// --- SUB-COMPONENTE: MODAL DE EDICIÓN ---
const EditTeamModal = ({ team, onClose, onUpdate }) => {
  const [phone, setPhone] = useState(team.captain_phone || '');
  const [logo, setLogo] = useState(team.logo || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/leagues/teams/${team.id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ captain_phone: phone, logo: logo })
      });

      if (response.ok) {
        onUpdate(); 
        onClose();
      } else {
        alert("Error al actualizar");
      }
    } catch (error) {
      console.error(error);
      alert("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-zinc-900 w-full max-w-md rounded-[2.5rem] p-8 border border-zinc-800 animate-in slide-in-from-bottom duration-300">
        <header className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-black uppercase italic text-white leading-none">Ajustes: {team.name}</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">✕</button>
        </header>

        <div className="space-y-6">
          <div>
            <label className="text-[10px] font-black uppercase text-zinc-500 ml-4 mb-2 block tracking-widest">Teléfono Capitán</label>
            <input 
              type="tel" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-zinc-800 p-5 rounded-3xl border border-zinc-700 outline-none focus:border-lime-400 text-white font-bold"
              placeholder="Ej: 600123456"
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-zinc-500 ml-4 mb-2 block tracking-widest">URL Escudo del Equipo</label>
            <input 
              type="text" 
              value={logo}
              onChange={(e) => setLogo(e.target.value)}
              className="w-full bg-zinc-800 p-5 rounded-3xl border border-zinc-700 outline-none focus:border-lime-400 text-white text-xs"
              placeholder="https://ejemplo.com/logo.png"
            />
          </div>

          <button 
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-lime-400 text-zinc-950 font-black py-5 rounded-3xl text-xl uppercase italic mt-4 shadow-xl shadow-lime-400/20 active:scale-95 transition-transform"
          >
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---
const LeagueAdminDashboard = () => {
  const { id } = useParams();
  const [league, setLeague] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState(null);

  // Función para cargar los datos de la liga
  const fetchLeagueData = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/leagues/${id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setLeague(data);
    } catch (error) {
      console.error("Error cargando liga:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchLeagueData();
  }, [fetchLeagueData]);

  const sendWhatsApp = (team) => {
    const inviteLink = `${window.location.origin}/join-team/${team.team_token}`;
    const text = `⚽ ¡Hola! Soy el Admin de la liga ${league.name}. Aquí tienes el enlace para que tú y tu equipo os registréis: ${inviteLink}`;
    
    const url = team.captain_phone 
      ? `https://wa.me/${team.captain_phone.replace(/\s+/g, '')}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    
    window.open(url, '_blank');
  };

  if (loading) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white font-black italic animate-pulse uppercase tracking-widest">Cargando Motor de Liga...</div>;

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 pb-24 font-sans selection:bg-lime-400 selection:text-zinc-950">
      <header className="mb-10 mt-6 text-center sm:text-left">
        <h1 className="text-5xl font-black uppercase italic text-lime-400 tracking-tighter leading-[0.8]">
          {league?.name}
        </h1>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-4">
            <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.3em]">Centro de Gestión Administrativa</span>
            <span className="hidden sm:block text-zinc-800">•</span>
            <span className="text-lime-400 text-[10px] font-black uppercase tracking-widest">{league?.teams?.length} Equipos Participantes</span>
        </div>
      </header>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {league?.teams?.map(team => (
          <div key={team.id} className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-7 shadow-2xl relative overflow-hidden group">
            <div className="flex justify-between items-start mb-6 relative z-10">
              <div className="pr-4">
                <h3 className="text-2xl font-black uppercase italic text-white leading-none group-hover:text-lime-400 transition-colors">{team.name}</h3>
                <div className="flex items-center gap-2 mt-3">
                    <span className={`w-2 h-2 rounded-full ${team.captain_id ? 'bg-lime-400' : 'bg-zinc-700 animate-pulse'}`}></span>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-tighter">
                        {team.player_count} Inscritos • {team.captain_id ? 'Capitán OK' : 'Sin Capitán'}
                    </p>
                </div>
              </div>
              <div className="bg-zinc-950 p-2 rounded-2xl border border-zinc-800 shadow-inner">
                {team.logo ? (
                  <img src={team.logo} className="w-14 h-14 rounded-xl object-contain" alt="escudo" />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-zinc-900 flex items-center justify-center text-2xl">🛡️</div>
                )}
              </div>
            </div>

            <div className="flex gap-3 relative z-10">
              <button 
                onClick={() => sendWhatsApp(team)}
                className="flex-[3] bg-[#25D366] text-white font-black py-5 rounded-3xl text-[11px] uppercase italic flex items-center justify-center gap-2 shadow-lg shadow-green-900/30 hover:brightness-110 active:scale-95 transition-all"
              >
                📩 Invitar Capitán
              </button>
              <button 
                onClick={() => setSelectedTeam(team)}
                className="flex-1 bg-zinc-800 text-white py-5 rounded-3xl hover:bg-zinc-700 active:scale-95 transition-all flex items-center justify-center border border-zinc-700"
              >
                ⚙️
              </button>
            </div>

            {/* BARRA DE PROGRESO */}
            <div className="mt-6 relative z-10">
                <div className="flex justify-between text-[8px] font-black uppercase text-zinc-600 mb-1 px-1">
                    <span>Inscripción</span>
                    <span>{Math.round((team.player_count / 12) * 100)}%</span>
                </div>
                <div className="w-full bg-zinc-950 h-2 rounded-full border border-zinc-800 overflow-hidden">
                <div 
                    className="bg-lime-400 h-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(163,230,53,0.3)]" 
                    style={{ width: `${Math.min((team.player_count / 12) * 100, 100)}%` }}
                ></div>
                </div>
            </div>
          </div>
        ))}
      </div>

      {/* RENDERIZADO DEL MODAL */}
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