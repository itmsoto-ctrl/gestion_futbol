import React, { useState, useEffect } from 'react';
import axios from 'axios';
import FutCard from './FutCard';
import { ChevronLeft, Save, Loader2, Info, CheckCircle2, Trophy } from 'lucide-react';

const API_URL = "https://gestionfutbol-production.up.railway.app";

const Onboarding = ({ onComplete, editPlayer }) => {
  const [step, setStep] = useState(0);
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [customData, setCustomData] = useState({ name: '', position: 'DC', dorsal: '' });
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (editPlayer) {
      setSelectedPlayer(editPlayer);
      setSelectedTeam({ 
        id: editPlayer.team_id, 
        name: editPlayer.team_name, 
        logo_url: editPlayer.team_logo 
      });
      setCustomData({ 
        name: editPlayer.name, 
        position: editPlayer.position, 
        dorsal: editPlayer.dorsal 
      });
      setStep(3);
      setLoading(false);
    } else {
      axios.get(`${API_URL}/tournaments`).then(res => {
        if (res.data.length > 0) {
          const tId = res.data[res.data.length - 1].id;
          axios.get(`${API_URL}/teams/${tId}`).then(resT => {
            setTeams(resT.data);
            setLoading(false);
          });
        }
      }).catch(() => setLoading(false));
    }
  }, [editPlayer]);

  const selectTeam = async (team) => {
    setSelectedTeam(team);
    setLoading(true);
    const resP = await axios.get(`${API_URL}/players/${team.tournament_id || 1}`);
    const teamPlayers = resP.data.filter(p => p.team_id === team.id);
    setPlayers(teamPlayers);
    setStep(2);
    setLoading(false);
  };

  const handleSelectPlayer = (p) => {
    setSelectedPlayer(p);
    setCustomData({ ...customData, name: p.name });
    setStep(3);
  };

  const finalize = () => {
    if (editPlayer) {
      startApp();
    } else {
      setShowWelcome(true);
    }
  };

  const startApp = () => {
    const finalIdentity = {
      ...selectedPlayer,
      name: customData.name,
      position: customData.position,
      dorsal: customData.dorsal,
      team_id: selectedTeam.id,
      team_name: selectedTeam.name,
      team_logo: selectedTeam.logo_url,
      rating: 60,
      stats: { pac: 60, sho: 60, pas: 60, dri: 60, def: 60, phy: 60 }
    };
    localStorage.setItem('my_player', JSON.stringify(finalIdentity));
    onComplete(finalIdentity);
  };

  if (loading) return (
    <div className="fixed inset-0 bg-zinc-950 flex flex-col items-center justify-center text-orange-500 font-bold uppercase animate-pulse">
      <Loader2 className="animate-spin mb-4" size={40} />
      Sincronizando...
    </div>
  );

  return (
    <div className="fixed inset-0 z-[2000] bg-zinc-950 flex flex-col items-center justify-center p-6 overflow-y-auto">
      
      {step === 0 && (
        <div className="w-full max-w-sm text-center animate-in fade-in zoom-in duration-500">
          <div className="bg-zinc-900 p-8 rounded-[40px] border-2 border-orange-500 shadow-2xl">
            <Trophy className="mx-auto text-orange-500 w-16 h-16 mb-6" />
            <h2 className="text-white text-2xl font-black uppercase italic mb-8 leading-tight">¿Eres jugador <br/> del torneo?</h2>
            <div className="space-y-4">
              <button onClick={() => setStep(1)} className="w-full bg-orange-500 text-black font-black py-4 rounded-2xl uppercase shadow-lg active:scale-95 transition-all">SÍ, QUIERO MI TARJETA</button>
              <button onClick={() => setStep(-1)} className="w-full bg-zinc-800 text-zinc-400 font-bold py-4 rounded-2xl uppercase text-sm active:scale-95 transition-all">NO, SOY ESPECTADOR</button>
            </div>
          </div>
        </div>
      )}

      {step === -1 && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center p-6 z-[4000]">
          <div className="bg-zinc-900 border-2 border-orange-500 p-8 rounded-[40px] text-center max-w-sm">
            <Info size={48} className="text-orange-500 mx-auto mb-4" />
            <p className="text-white font-bold mb-6">Podrás seguir resultados, clasificaciones y votar al MVP como invitado.</p>
            <button onClick={() => {
              localStorage.setItem('is_guest', 'true');
              onComplete({ name: 'ESPECTADOR', isGuest: true, id: 9999 });
            }} className="w-full bg-orange-500 text-black font-black py-4 rounded-2xl uppercase">CONTINUAR</button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="w-full max-w-md animate-in fade-in duration-500">
          <h2 className="text-orange-500 text-center text-2xl font-black mb-8 uppercase italic tracking-widest leading-none">
            Selecciona <span className="text-white block text-3xl mt-1">tu equipo</span>
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {teams.map(team => (
              <button key={team.id} onClick={() => selectTeam(team)} className="bg-zinc-900 border-2 border-zinc-800 p-4 rounded-2xl flex flex-col items-center active:scale-95 transition-all hover:border-orange-500">
                <img src={team.logo_url || 'https://via.placeholder.com/50'} className="w-14 h-14 object-contain mb-3" alt="" />
                <span className="text-[10px] font-black uppercase text-zinc-400 text-center">{team.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* PASO 2: REDUCIMOS SOLO UN POCO EL TAMAÑO AQUÍ */}
      {step === 2 && (
        <div className="w-full flex flex-col items-center animate-in slide-in-from-right">
          <button onClick={() => setStep(1)} className="absolute top-8 left-6 text-zinc-500 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest">
            <ChevronLeft size={16}/> Volver
          </button>
          <h2 className="text-orange-500 text-center text-xl font-black mb-10 uppercase italic mt-10 tracking-tighter">Busca tu nombre</h2>
          <div className="flex overflow-x-auto w-full gap-2 pb-10 snap-x no-scrollbar">
            {players.map(p => (
              <div key={p.id} onClick={() => handleSelectPlayer(p)} className="snap-center shrink-0 active:scale-95 scale-[0.65]">
                <FutCard player={{ ...p, rating: 60 }} view="selection" />
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="w-full max-w-sm flex flex-col items-center animate-in zoom-in pb-10">
          {!editPlayer && (
            <button onClick={() => setStep(2)} className="absolute top-8 left-6 text-zinc-500 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest">
              <ChevronLeft size={16}/> Volver
            </button>
          )}

          <div className="drop-shadow-[0_20px_40px_rgba(255,165,0,0.3)] scale-[0.65]">
            <FutCard 
               player={{ ...selectedPlayer, name: customData.name, position: customData.position, rating: 60 }} 
               view="selection" 
            />
          </div>
          
          <div className="bg-zinc-900 w-full p-6 rounded-[35px] mt-2 border-t-2 border-orange-500/50 shadow-2xl space-y-5">
            <div>
              <label className="text-[10px] text-orange-500 uppercase font-black block mb-2 ml-1">Nombre en la carta</label>
              <input 
                type="text" 
                value={customData.name} 
                onChange={e => setCustomData({...customData, name: e.target.value.toUpperCase()})}
                className="w-full bg-zinc-800 border-2 border-zinc-700 focus:border-orange-500 rounded-2xl p-4 text-lg font-black text-white uppercase outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-zinc-500 uppercase font-black block mb-2 ml-1">Posición</label>
                <select value={customData.position} onChange={e => setCustomData({...customData, position: e.target.value})} className="w-full bg-zinc-800 border-2 border-zinc-700 rounded-2xl p-4 text-sm font-black text-orange-500 appearance-none uppercase outline-none">
                  {['PO','DFC','LI','LD','MC','MCO','DC','ED','EI'].map(pos => <option key={pos} value={pos}>{pos}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-zinc-500 uppercase font-black block mb-2 ml-1">Dorsal</label>
                <input type="number" placeholder="00" value={customData.dorsal} onChange={e => setCustomData({...customData, dorsal: e.target.value})} className="w-full bg-zinc-800 border-2 border-zinc-700 rounded-2xl p-4 text-sm font-black text-white outline-none" />
              </div>
            </div>
            <button onClick={finalize} className="w-full bg-orange-500 text-black font-black py-5 rounded-2xl mt-2 flex items-center justify-center gap-2 uppercase tracking-tighter shadow-lg active:scale-95 transition-all">
              <Save size={18} /> {editPlayer ? 'Guardar Cambios' : 'Reclamar Identidad'}
            </button>
          </div>
        </div>
      )}

      {showWelcome && (
        <div className="fixed inset-0 z-[3000] bg-black/95 flex items-center justify-center p-6 backdrop-blur-md animate-in fade-in">
          <div className="bg-zinc-900 border-2 border-orange-500 w-full max-w-sm rounded-[40px] p-8 text-center shadow-[0_0_50px_rgba(255,165,0,0.2)]">
            <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Info size={40} className="text-black" />
            </div>
            <h2 className="text-white text-2xl font-black uppercase italic tracking-tighter mb-2 leading-none">¡Bienvenido al <br/> Torneo!</h2>
            <p className="text-orange-500 font-bold text-sm mb-6 uppercase tracking-widest">Inauguración: 28/02</p>
            <button onClick={startApp} className="w-full bg-orange-500 text-black font-black py-4 rounded-2xl uppercase tracking-tighter text-sm shadow-xl active:scale-95 transition-all">
                ¡Entendido!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Onboarding;