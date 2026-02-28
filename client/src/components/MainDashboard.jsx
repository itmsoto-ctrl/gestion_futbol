import React, { useState, useEffect } from 'react'; 
import { useNavigate } from 'react-router-dom'; 
import axios from 'axios'; 
import { motion } from 'framer-motion'; 
import { Calendar, Table, LogOut, Clock } from 'lucide-react'; 
import FutCard from './FutCard'; 

const API_URL = "https://gestionfutbol-production.up.railway.app"; 

const MainDashboard = ({ player, onLogout, onEdit }) => { 
  const navigate = useNavigate(); 
  const [tId, setTId] = useState(null); 
  const [livePlayer, setLivePlayer] = useState({ ...player, rating: Math.max(65, player?.rating || 65) }); 
  const [currentTime, setCurrentTime] = useState(new Date()); 

  useEffect(() => { 
    const timer = setInterval(() => setCurrentTime(new Date()), 1000); 
    return () => clearInterval(timer); 
  }, []); 

  const formattedTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }); 
  const formattedDate = currentTime.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }); 

  useEffect(() => { 
    const fetchLiveStats = async () => { 
      try { 
        const resT = await axios.get(`${API_URL}/tournaments`); 
        if (resT.data.length > 0) { 
          const tid = resT.data[resT.data.length - 1].id; 
          setTId(tid); 

          if (player && !player.isGuest) { 
            let goalsData = []; 
            let matchesData = []; 

            try { 
              const timestamp = new Date().getTime();
              const resM = await axios.get(`${API_URL}/matches/${tid}?t=${timestamp}`); 
              matchesData = resM.data || []; 
            } catch (e) { console.error("Error en matches:", e); } 

            try { 
              const timestamp = new Date().getTime();
              const resG = await axios.get(`${API_URL}/goals?t=${timestamp}`); 
              goalsData = resG.data || []; 
            } catch (e) { console.warn("Tabla goals inaccesible."); } 

            const pId = String(player.id).trim(); 
            const pTeamId = String(player.team_id).trim(); 

            const myGoals = goalsData.filter(g => String(g.player_id).trim() === pId); 
            const myMatches = matchesData.filter(m => {
              const isMyTeam = String(m.team_a_id).trim() === pTeamId || String(m.team_b_id).trim() === pTeamId;
              return m.played && isMyTeam;
            }); 

            // --- 1. GOLES DE ORO ---
            let goalsPoints = 0;
            myGoals.forEach(goal => {
              const match = matchesData.find(m => String(m.id) === String(goal.match_id));
              const phase = String(match?.phase || '').toLowerCase();
              
              if (phase.includes('final') && !phase.includes('semi')) {
                goalsPoints += 8; // Gol en la Final
              } else if (phase.includes('semi')) {
                goalsPoints += 6; // Gol en Semifinales
              } else {
                goalsPoints += 5; // Gol Regular o Cuartos
              }
            });

            if (goalsPoints === 0 && myGoals.length > 0) {
              goalsPoints = myGoals.length * 5;
            }

            // --- 2. RENDIMIENTO Y BONO DE PROGRESO ---
            let ratingBonus = 0;

            myMatches.forEach(m => {
              const idA = String(m.team_a_id).trim();
              const sA = Number(m.team_a_goals || 0);
              const sB = Number(m.team_b_goals || 0);
              
              const isLocal = idA === pTeamId;
              const myScore = isLocal ? sA : sB;
              const opScore = isLocal ? sB : sA;
              const diff = myScore - opScore;

              const phase = String(m.phase || '').toLowerCase();
              const isCuartos = phase.includes('cuarto');
              const isSemi = phase.includes('semi');
              const isFinal = phase.includes('final') && !isSemi;

              let pointsEarned = 0;
              let phaseBonus = 0;

              if (myScore > opScore) {
                // VICTORIA: Base + Diferencia
                pointsEarned = 6 + (diff * 2);
                
                // BONO DE PROGRESO (Solo si ganas pasas de ronda)
                if (isCuartos) phaseBonus = 3; // Pasas a Semis
                if (isSemi) phaseBonus = 5;    // Pasas a Final
                if (isFinal) phaseBonus = 10;  // Campeón
                
                ratingBonus += pointsEarned + phaseBonus;
              } else if (myScore < opScore) {
                // DERROTA: Te eliminan, no hay bono de avance. Castigo normal.
                pointsEarned = -3 + (diff * 1); 
                ratingBonus += pointsEarned; 
              } else {
                // EMPATE: (Asumiendo que van a penaltis, pero en stats base es empate)
                pointsEarned = 2;
                ratingBonus += pointsEarned;
              }

              console.log(`Partido ID ${m.id} [Fase: ${phase || 'Regular'}] | Res: ${myScore}-${opScore} | Puntos Partido: ${pointsEarned} | Bono Avance: +${phaseBonus}`);
            });

            const g = myGoals.length; 
            const mp = myMatches.length; 
            const base = 65; 
            
            // CÁLCULO FINAL
            let rat = base + goalsPoints + (mp * 1) + ratingBonus; 
            rat = Math.max(65, Math.min(rat, 99));

            console.log(`RESUMEN -> Base: ${base} | Puntos por Jugar: +${mp} | Puntos Goles: +${goalsPoints} | Bonus Rendimiento Total: +${ratingBonus} | RATING FINAL: ${rat}`);

            setLivePlayer({ 
              ...player, 
              rating: Math.round(rat), 
              pac: Math.max(65, Math.round(rat + 2)), 
              sho: Math.max(65, 60 + goalsPoints * 2), 
              pas: Math.max(65, 65 + (mp * 2)), 
              dri: Math.max(65, Math.round(rat - 1)), 
              def: Math.max(65, Math.round(60 + (ratingBonus * 0.5))), 
              phy: Math.max(65, Math.round(70 + (ratingBonus * 0.3))) 
            }); 
          } 
        } 
      } catch (e) { console.error("Fallo general Dashboard:", e); } 
    }; 
    if (player?.id) fetchLiveStats(); 
  }, [player]); 

  return ( 
    <div className="h-screen flex flex-col font-sans overflow-hidden relative" 
      style={{ backgroundColor: '#0a0a0a', backgroundImage: `linear-gradient(30deg, #0f0f0f 12%, transparent 12.5%, transparent 87%, #0f0f0f 87.5%, #0f0f0f), linear-gradient(150deg, #0f0f0f 12%, transparent 12.5%, transparent 87%, #0f0f0f 87.5%, #0f0f0f), linear-gradient(60deg, #141414 25%, transparent 25.5%, transparent 75%, #141414 75%, #141414)`, backgroundSize: '40px 70px' }}> 
      
      <div className="pt-8 pb-0 px-8 flex justify-between items-start z-30"> 
        <div> 
          <h1 className="text-xl font-black italic tracking-tighter text-orange-500 uppercase">PRO LEAGUE</h1> 
          <div className="flex items-center gap-2 mt-1"> 
            <Clock size={10} className="text-orange-400 animate-pulse" /> 
            <span className="text-[10px] font-black font-mono text-zinc-400 tracking-widest uppercase">{formattedDate} | {formattedTime}</span> 
          </div> 
        </div> 
        <button onClick={onLogout} className="text-rose-500 bg-rose-500/10 p-2 rounded-xl border border-rose-500/20 active:scale-90"> 
          <LogOut size={18} /> 
        </button> 
      </div> 

      <div className="flex flex-col items-center justify-start relative mt-2"> 
        <div className="absolute top-0 w-80 h-80 bg-orange-600/15 blur-[100px] rounded-full pointer-events-none" /> 
        
        <div onClick={onEdit} className="relative w-full h-[210px] flex items-center justify-center z-10 cursor-pointer active:scale-95 transition-transform" style={{ perspective: '2000px' }}> 
          <motion.div 
            initial={{ rotateY: 1080, scale: 0, opacity: 0 }} 
            animate={{ rotateY: 0, scale: 0.52, opacity: 1 }} 
            transition={{ duration: 1.8, ease: [0.34, 1.56, 0.64, 1] }} 
            className="flex items-center justify-center drop-shadow-[0_25px_50px_rgba(0,0,0,0.9)]" 
            style={{ transformStyle: 'preserve-3d' }}
          > 
            <FutCard player={livePlayer} view="dashboard" /> 
          </motion.div> 
        </div> 

        <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-[0.3em] mt-2">Toca la carta para editar perfil</p>
      </div> 

      <div className="flex-1 bg-[#0a0a0a]/90 backdrop-blur-3xl rounded-t-[45px] px-6 pt-10 pb-8 border-t border-white/10 mt-6 shadow-[0_-30px_60px_rgba(0,0,0,1)]"> 
        <div className="flex flex-col gap-5"> 
            <button onClick={() => navigate(`/tournament/${tId}`, { state: { tab: 'matches' } })} className="bg-zinc-900/40 border border-white/5 rounded-[30px] p-8 flex items-center gap-6 active:scale-95 transition-all shadow-xl"> 
              <div className="text-blue-400"><Calendar size={32} /></div> 
              <span className="text-sm text-zinc-200 font-black uppercase italic tracking-widest">Ver Partidos</span> 
            </button> 
            <button onClick={() => navigate(`/tournament/${tId}`, { state: { tab: 'table' } })} className="bg-zinc-900/40 border border-white/5 rounded-[30px] p-8 flex items-center gap-6 active:scale-95 transition-all shadow-xl"> 
              <div className="text-emerald-400"><Table size={32} /></div> 
              <span className="text-sm text-zinc-200 font-black uppercase italic tracking-widest">Ver Clasificación</span> 
            </button> 
        </div> 
      </div> 
    </div> 
  ); 
}; 

export default MainDashboard;