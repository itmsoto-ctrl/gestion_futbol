import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Save, Loader2, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';
import API_BASE_URL from '../../../apiConfig';

const DAYS_MAP = { 0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat' };

const AdminCalendarEditor = ({ league }) => {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingIdx, setEditingIdx] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  const leagueId = league?.id;

  // 🛡️ PARSEO ROBUSTO DE HORARIOS (Configuración original de la liga)
  const venues = useMemo(() => {
    let raw = league?.playing_days || league?.selectedVenues || [];
    if (typeof raw === 'string') {
      try { raw = JSON.parse(raw); } catch (e) { raw = []; }
    }
    return Array.isArray(raw) ? raw : [raw];
  }, [league]);

  // Función para ordenar el calendario por fecha y hora
  const sortSchedule = (list) => {
    return [...list].sort((a, b) => {
      if (a.dateStr !== b.dateStr) return a.dateStr.localeCompare(b.dateStr);
      return a.time.localeCompare(b.time);
    });
  };

  // 🔄 CARGA DE DATOS DESDE EL BACKEND
  const fetchMatches = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/leagues/${leagueId}/full-calendar`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        const mapped = data.map(m => {
          // 🛠️ FIX DE FECHA: Evita desfase de zona horaria (UTC)
          const [year, month, day] = m.match_date.split('-').map(Number);
          const d = new Date(year, month - 1, day);

          return {
            id: m.id,
            round: m.round,
            dateStr: m.match_date, 
            dateObj: d,
            time: m.match_time ? m.match_time.slice(0, 5) : '00:00',
            fieldName: m.pitch_name || 'Pista Principal',
            venue_id: m.venue_id,
            match: { home: m.home_name, away: m.away_name }
          };
        });
        setSchedule(sortSchedule(mapped));
        setHasChanges(false);
      }
    } catch (error) {
      console.error("Error al cargar calendario:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (leagueId) fetchMatches();
  }, [leagueId]);

  // 🔄 FUNCIÓN DE INTERCAMBIO (SWAP)
  const swapMatchDetails = (targetIdx, newSlot) => {
    let newSchedule = [...schedule];
    const currentMatch = newSchedule[targetIdx];
    
    // Buscamos si hay otro partido en ese mismo slot para intercambiar
    const swappingMatch = newSchedule.find(s => 
      s.dateStr === currentMatch.dateStr && 
      s.time === newSlot.start && 
      s.fieldName === newSlot.fieldName
    );

    if (swappingMatch) {
      // Intercambio de valores entre los dos partidos
      const tempTime = currentMatch.time;
      const tempField = currentMatch.fieldName;
      const tempVenue = currentMatch.venue_id;

      currentMatch.time = swappingMatch.time;
      currentMatch.fieldName = swappingMatch.fieldName;
      currentMatch.venue_id = swappingMatch.venue_id;

      swappingMatch.time = tempTime;
      swappingMatch.fieldName = tempField;
      swappingMatch.venue_id = tempVenue;
    } else {
      // Si el hueco está libre, simplemente movemos el partido
      currentMatch.time = newSlot.start;
      currentMatch.fieldName = newSlot.fieldName;
      currentMatch.venue_id = newSlot.venue_id;
    }
    
    setSchedule(sortSchedule(newSchedule));
    setEditingIdx(null);
    setHasChanges(true);
  };

  // 💾 GUARDADO SECUENCIAL EN BD
  const saveChangesToDB = async () => {
    setSaving(true);
    try {
      for (const m of schedule) {
        const response = await fetch(`${API_BASE_URL}/api/leagues/matches/${m.id}`, {
          method: 'PATCH',
          headers: { 
            'Content-Type': 'application/json', 
            'Authorization': `Bearer ${localStorage.getItem('token')}` 
          },
          body: JSON.stringify({ 
            match_date: m.dateStr, 
            match_time: m.time, 
            venue_id: m.venue_id, 
            pitch_name: m.fieldName 
          })
        });

        if (!response.ok) throw new Error(`Fallo al actualizar partido ${m.id}`);
      }
       
       setHasChanges(false);
       await fetchMatches(); // Refresco tras éxito
       alert("✅ Calendario actualizado en la Base de Datos");

    } catch (err) { 
      alert("⚠️ Error al guardar: " + err.message); 
    } finally { 
      setSaving(false); 
    }
  };

  if (loading) return (
    <div className="p-10 text-center flex flex-col items-center gap-4">
      <Loader2 className="animate-spin text-lime-400" size={32} />
      <p className="text-lime-400 font-black uppercase tracking-widest text-[10px]">Actualizando Pizarra...</p>
    </div>
  );

  return (
    <div className="mt-12 bg-zinc-900/30 border border-zinc-800/50 rounded-[2.5rem] p-6 sm:p-8">
      
      <div className="flex justify-between items-center mb-10 gap-4">
        <div>
          <h3 className="text-3xl font-black italic uppercase text-white leading-none tracking-tighter">Calendario <span className="text-lime-400">Oficial</span></h3>
          <p className="text-[9px] text-zinc-500 font-bold uppercase mt-2 tracking-widest italic">Haz click en un partido para reubicarlo en otro horario</p>
        </div>
        {hasChanges && (
            <button 
              onClick={saveChangesToDB} 
              disabled={saving} 
              className="bg-lime-400 text-black font-black uppercase italic px-8 py-4 rounded-2xl flex items-center gap-2 shadow-[0_0_30px_rgba(163,230,53,0.3)] hover:scale-105 active:scale-95 transition-all"
            >
              {saving ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> Aplicar Cambios</>}
            </button>
        )}
      </div>

      <div className="space-y-8">
        {Object.values(schedule.reduce((acc, m) => {
          if (!acc[m.dateStr]) acc[m.dateStr] = [];
          acc[m.dateStr].push(m);
          return acc;
        }, {})).map((group, gIdx) => {
          const d = group[0].dateObj;
          const dateLabel = d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
          const dayKey = DAYS_MAP[d.getDay()];

          return (
            <div key={gIdx} className="bg-zinc-900/40 border border-zinc-800 rounded-[2rem] p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase text-lime-400 tracking-widest leading-none mb-1">{dayKey}</span>
                  <span className="text-sm font-black uppercase text-white italic">{dateLabel}</span>
                </div>
                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest bg-zinc-900 px-3 py-1 rounded-lg">Jornada {group[0].round}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {group.map((item) => {
                  const globalIdx = schedule.findIndex(s => s === item);
                  
                  // Encontramos todos los slots configurados para ese día o para la sede en general
                  const daySlots = venues.flatMap(v => {
                      const slots = v.slots || v.playing_slots || [];
                      const filtered = slots.filter(s => s.day === dayKey);
                      return (filtered.length > 0 ? filtered : slots).map(s => ({ ...s, venue_id: v.id }));
                  });

                  return (
                    <div key={item.id} className="relative">
                      <div 
                        onClick={() => setEditingIdx(editingIdx === globalIdx ? null : globalIdx)}
                        className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer relative overflow-hidden group
                        ${editingIdx === globalIdx ? 'bg-zinc-800 border-lime-400 ring-4 ring-lime-400/10' : 'bg-zinc-950/40 border-zinc-800 hover:border-zinc-700'}`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="text-xs font-black uppercase italic text-zinc-100 mb-1">
                              {item.match.home} <span className="text-zinc-700 not-italic">VS</span> {item.match.away}
                            </p>
                            <div className="flex items-center gap-3">
                              <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{item.fieldName}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end">
                            <div className="flex items-center gap-1.5 text-lime-400">
                              <Clock size={12}/>
                              <span className="text-xs font-black">{item.time}H</span>
                            </div>
                          </div>
                        </div>

                        {editingIdx === globalIdx && (
                          <div className="mt-5 pt-5 border-t border-zinc-700 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                            <p className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-3">Cambiar a horario disponible:</p>
                            <div className="grid grid-cols-2 gap-2">
                              {daySlots.map((slot, sIdx) => (
                                <button 
                                  key={sIdx}
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); swapMatchDetails(globalIdx, slot); }}
                                  className={`py-3 px-2 rounded-xl text-[9px] font-black border transition-all flex flex-col items-center gap-1
                                  ${item.time === slot.start && item.fieldName === slot.fieldName 
                                    ? 'bg-lime-400 text-black border-lime-400 shadow-[0_0_15px_rgba(163,230,53,0.4)]' 
                                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-600'}`}
                                >
                                  <span className="opacity-60">{slot.fieldName}</span>
                                  <span>{slot.start}H</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminCalendarEditor;