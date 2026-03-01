import React, { useState } from 'react';

const JoinLeague = () => {
  const [token, setToken] = useState('');
  const [leagueData, setLeagueData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);

  // 1. Validar el token contra el servidor
  const handleVerifyToken = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/leagues/join/${token}`);
      const data = await response.json();
      if (response.ok) {
        setLeagueData(data); // Recibimos { leagueName, teams: [...] }
      } else {
        alert(data.message || "Código no válido");
      }
    } catch (err) {
      alert("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  // 2. Vincular al usuario actual con el equipo elegido
  const handleClaimTeam = async () => {
    if (!selectedTeam) return;
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/leagues/claim-team', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ teamId: selectedTeam.id })
      });
      if (response.ok) {
        window.location.href = '/captain/dashboard'; // ¡Directo a su nuevo panel!
      }
    } catch (err) {
      alert("Error al reclamar equipo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 flex flex-col items-center justify-center">
      {!leagueData ? (
        <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in">
          <div className="text-center">
            <h2 className="text-4xl font-black uppercase italic text-lime-400 leading-none">Únete a tu Liga</h2>
            <p className="text-zinc-500 text-xs font-bold uppercase mt-4 tracking-widest">Introduce el código de invitación</p>
          </div>
          
          <input 
            type="text" 
            placeholder="EJ: A1B2C" 
            value={token}
            onChange={(e) => setToken(e.target.value.toUpperCase())}
            className="w-full bg-zinc-900 border-2 border-zinc-800 rounded-[2rem] py-6 px-8 text-center text-2xl font-black text-lime-400 outline-none focus:border-lime-400 transition-all"
          />

          <button 
            onClick={handleVerifyToken}
            disabled={loading || token.length < 4}
            className="w-full bg-white text-zinc-950 font-black py-5 rounded-[2rem] text-xl uppercase italic shadow-xl disabled:opacity-50"
          >
            {loading ? 'Verificando...' : 'Verificar Código'}
          </button>
        </div>
      ) : (
        <div className="w-full max-w-md space-y-6 animate-in slide-in-from-bottom duration-500">
          <header className="text-center">
             <span className="text-[10px] bg-lime-400 text-zinc-950 px-3 py-1 rounded-full font-black uppercase">Código Válido</span>
             <h3 className="text-2xl font-black uppercase italic mt-4">{leagueData.leagueName}</h3>
             <p className="text-zinc-500 text-[10px] font-bold uppercase mt-1">Selecciona tu equipo de la lista</p>
          </header>

          <div className="grid gap-3">
            {leagueData.teams.map(team => (
              <button
                key={team.id}
                onClick={() => setSelectedTeam(team)}
                className={`p-5 rounded-3xl border-2 transition-all flex justify-between items-center
                ${selectedTeam?.id === team.id ? 'border-lime-400 bg-lime-400/5' : 'border-zinc-800 bg-zinc-900/50 text-zinc-400'}`}
              >
                <span className="font-black uppercase italic text-lg">{team.name}</span>
                {selectedTeam?.id === team.id && <span className="text-lime-400">✔</span>}
              </button>
            ))}
          </div>

          <button 
            onClick={handleClaimTeam}
            disabled={!selectedTeam || loading}
            className="w-full bg-lime-400 text-zinc-950 font-black py-5 rounded-[2rem] text-xl uppercase italic mt-8 shadow-xl shadow-lime-400/20"
          >
            {loading ? 'Vinculando...' : `Ser Capitán de ${selectedTeam?.name}`}
          </button>
        </div>
      )}
    </div>
  );
};

export default JoinLeague;  