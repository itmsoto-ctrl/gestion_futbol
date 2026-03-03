import React, { useState, useEffect } from 'react';

const DAYS_MAP = { 0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat' };
const HOLIDAYS_2026 = {
  '2026-01-01': 'Año Nuevo', '2026-01-06': 'Reyes Magos', '2026-03-19': 'San José',
  '2026-04-02': 'Jueves Santo', '2026-04-03': 'Viernes Santo', '2026-04-06': 'Lunes de Pascua',
  '2026-05-01': 'Fiesta del Trabajo', '2026-08-15': 'Asunción de la Virgen',
  '2026-10-12': 'Fiesta Nacional', '2026-11-01': 'Todos los Santos',
  '2026-12-06': 'Constitución', '2026-12-08': 'Inmaculada', '2026-12-25': 'Navidad'
};

const CalendarPreview = ({ config, onConfirm }) => {
  const [schedule, setSchedule] = useState([]);
  const [cancelledDates, setCancelledDates] = useState([]);
  const [editingIdx, setEditingIdx] = useState(null);

  const toLocalDate = (dateStr) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d, 12, 0, 0);
  };

  const sortSchedule = (list) => {
    return [...list].sort((a, b) => {
      if (a.dateStr !== b.dateStr) return a.dateStr.localeCompare(b.dateStr);
      return a.time.localeCompare(b.time); 
    });
  };

  useEffect(() => {
    generateCalendar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cancelledDates, config]);

  const getHolidaysDetails = (baseDate) => {
    const d = new Date(baseDate);
    const dayOfWeek = d.getDay() || 7; 
    d.setDate(d.getDate() - dayOfWeek + 1);
    let found = [];
    for (let i = 0; i < 7; i++) {
      const check = new Date(d);
      check.setDate(check.getDate() + i);
      const str = check.toISOString().split('T')[0];
      if (HOLIDAYS_2026[str]) found.push({ name: HOLIDAYS_2026[str], date: check.getDate() });
    }
    return found;
  };

  const generateCalendar = () => {
    if (!config.teams?.length) return;

    let teams = [...config.teams].map(t => t.name);
    if (teams.length % 2 !== 0) teams.push("DESCANSO");
    const numTeams = teams.length;
    let rounds = [];

    for (let i = 0; i < numTeams - 1; i++) {
      let rMatches = [];
      for (let j = 0; j < numTeams / 2; j++) {
        let home = teams[j];
        let away = teams[numTeams - 1 - j];
        if ((i + j) % 2 === 1) [home, away] = [away, home];
        if (home !== "DESCANSO" && away !== "DESCANSO") rMatches.push({ home, away });
      }
      rounds.push(rMatches);
      teams.splice(1, 0, teams.pop());
    }

    if (config.hasReturnMatch === 1) {
      const ret = rounds.map(r => r.map(m => ({ home: m.away, away: m.home })));
      rounds = [...rounds, ...ret];
    }

    const generated = [];
    let iterDate = toLocalDate(config.startDate);
    let roundIdx = 0;

    while (roundIdx < rounds.length) {
      // ✅ CORRECCIÓN: Capturamos el valor para evitar el error no-loop-func
      const currentRoundNumber = roundIdx + 1;
      const dayKey = DAYS_MAP[iterDate.getDay()];
      const dateStr = iterDate.toISOString().split('T')[0];
      const hasSlot = config.selectedVenues?.some(v => v.slots?.some(s => s.day === dayKey));
      
      if (hasSlot && !cancelledDates.includes(dateStr)) {
        let currentRoundMatches = [...rounds[roundIdx]];
        config.selectedVenues.forEach(venue => {
          venue.slots?.filter(s => s.day === dayKey).forEach(slot => {
            if (currentRoundMatches.length > 0) {
              generated.push({
                type: 'REGULAR', dateStr, dateObj: new Date(iterDate),
                venue: venue.name, fieldName: slot.fieldName, time: slot.start,
                match: currentRoundMatches.shift(), 
                round: currentRoundNumber, // 👈 Usamos la constante
                weekHolidays: getHolidaysDetails(iterDate),
                isHoliday: !!HOLIDAYS_2026[dateStr]
              });
            }
          });
        });
        if (currentRoundMatches.length === 0) roundIdx++;
      }
      iterDate.setDate(iterDate.getDate() + 1);
    }

    // Playoff Logic...
    if (config.hasPlayoffs === 1 && config.selectedVenues.length > 0) {
      const phases = [];
      if (config.playoffTeams === 4) phases.push('SEMIFINAL IDA');
      if (config.playoffTeams === 4 && config.playoffFormat === 'double') phases.push('SEMIFINAL VUELTA');
      phases.push('GRAN FINAL');

      phases.forEach((phase, pIdx) => {
        let assigned = false;
        while (!assigned) {
          const dayKey = DAYS_MAP[iterDate.getDay()];
          const dateStr = iterDate.toISOString().split('T')[0];
          const hasSlot = config.selectedVenues.some(v => v.slots?.some(s => s.day === dayKey));
          if (hasSlot && !cancelledDates.includes(dateStr)) {
            const venue = config.selectedVenues[0];
            const slotsOfDay = venue.slots.filter(s => s.day === dayKey);
            const matchesToCreate = phase.includes('SEMIFINAL') ? 2 : 1;
            for(let i=0; i < matchesToCreate; i++) {
                const slot = slotsOfDay[i] || slotsOfDay[0];
                // En CalendarPreview.jsx
                generated.push({
                  type: 'REGULAR',
                  dateStr,
                  venue_id: venue.id, // 👈 ENVÍA EL ID, NO SOLO EL NOMBRE
                  venue: venue.name,
                  match: currentRoundMatches.shift(), 
                  // ...
                });
            }
            assigned = true;
          }
          iterDate.setDate(iterDate.getDate() + 1);
        }
      });
    }
    setSchedule(sortSchedule(generated));
  };

  const swapMatchDetails = (targetIdx, newSlot) => {
    const newSchedule = [...schedule];
    const currentMatch = newSchedule[targetIdx];
    const swappingMatch = newSchedule.find(s => s.dateStr === currentMatch.dateStr && s.time === newSlot.start && s.fieldName === newSlot.fieldName);

    if (swappingMatch) {
      const tempTime = currentMatch.time;
      const tempField = currentMatch.fieldName;
      currentMatch.time = swappingMatch.time;
      currentMatch.fieldName = swappingMatch.fieldName;
      swappingMatch.time = tempTime;
      swappingMatch.fieldName = tempField;
    } else {
      currentMatch.time = newSlot.start;
      currentMatch.fieldName = newSlot.fieldName;
    }
    setSchedule(sortSchedule(newSchedule));
    setEditingIdx(null);
  };

  return (
    <div className="space-y-4">
      <div className="max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar space-y-8">
        {Object.values(schedule.reduce((acc, match) => {
          if (!acc[match.dateStr]) acc[match.dateStr] = [];
          acc[match.dateStr].push(match);
          return acc;
        }, {})).map((group, gIdx) => {
          const isFinal = group.some(m => m.type === 'GRAN FINAL');
          const isPlayoff = group.some(m => m.type.includes('SEMIFINAL'));
          const phaseLabel = isFinal ? 'GRAN FINAL' : isPlayoff ? 'PLAYOFFS' : 'LIGA REGULAR';
          const phaseColor = isFinal ? 'bg-lime-400 text-zinc-950' : isPlayoff ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-800 text-zinc-500';

          return (
            <div key={gIdx} className={`bg-zinc-900/30 border ${isFinal ? 'border-lime-400/50' : 'border-zinc-800'} rounded-[2.5rem] p-6 space-y-4 relative`}>
              <div className="absolute top-6 right-6">
                 <span className={`text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${phaseColor}`}>
                    {phaseLabel}
                 </span>
              </div>

              <div className={`flex flex-col border-l-4 pl-4 ${isFinal ? 'border-lime-400' : 'border-zinc-600'}`}>
                <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">
                  {group[0].type.includes('REGULAR') ? `Jornada ${group[0].round}` : group[0].type}
                </span>
                <span className="text-sm font-black uppercase text-white">
                  {group[0].dateObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                </span>
                {group[0].weekHolidays?.length > 0 && (
                  <p className="text-[9px] font-bold text-red-500 uppercase mt-1">
                    ⚠️ {group[0].weekHolidays.map(h => h.name).join(' + ')}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                {group.map((item, iIdx) => {
                  const globalIdx = schedule.findIndex(s => s === item);
                  const dayKey = DAYS_MAP[item.dateObj.getDay()];
                  const allDaySlots = config.selectedVenues.flatMap(v => v.slots.filter(s => s.day === dayKey));

                  return (
                    <div key={`${gIdx}-${iIdx}`} className="relative group/match">
                      <div 
                        onClick={() => setEditingIdx(editingIdx === globalIdx ? null : globalIdx)}
                        className={`p-5 rounded-2xl border transition-all duration-300 relative cursor-pointer
                        ${item.isHoliday ? 'border-red-500 bg-red-500/10' : 'border-zinc-800 bg-zinc-950/50'}
                        ${editingIdx === globalIdx ? 'ring-2 ring-lime-400 border-transparent z-20' : ''}`}
                      >
                        <div className="flex justify-between items-center pr-8">
                          <div className="flex-1">
                            <p className="text-sm font-black italic uppercase flex items-center gap-2 leading-none">
                              {item.match.home} <span className="text-[10px] text-zinc-700 not-italic">vs</span> {item.match.away}
                            </p>
                            <div className="flex gap-2 mt-3">
                               <span className="text-[8px] bg-zinc-800 text-zinc-500 px-2 py-1 rounded font-black uppercase">{item.fieldName}</span>
                               <span className={`text-[8px] font-black px-2 py-1 rounded uppercase ${item.isHoliday ? 'bg-red-500 text-white' : 'bg-lime-400/10 text-lime-400'}`}>
                                  {item.time}H
                               </span>
                            </div>
                          </div>
                        </div>

                        <button 
                          onClick={(e) => { e.stopPropagation(); setCancelledDates([...cancelledDates, item.dateStr]); }}
                          className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-600 hover:text-red-500 flex items-center justify-center transition-all z-30"
                        >✕</button>

                        {editingIdx === globalIdx && (
                          <div className="mt-5 pt-5 border-t border-zinc-800 grid grid-cols-2 gap-2 animate-in fade-in zoom-in duration-200">
                            {allDaySlots.map((slot, sIdx) => (
                              <button 
                                key={sIdx}
                                onClick={(e) => { e.stopPropagation(); swapMatchDetails(globalIdx, slot); }}
                                className={`py-3 px-2 rounded-xl text-[9px] font-black border transition-all ${item.time === slot.start && item.fieldName === slot.fieldName ? 'bg-lime-400 text-zinc-950 border-lime-400' : 'bg-zinc-800 text-zinc-500 border-zinc-700'}`}
                              >
                                {slot.fieldName} - {slot.start}H
                              </button>
                            ))}
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

      <button onClick={() => onConfirm(schedule)} className="w-full bg-lime-400 text-zinc-950 font-black py-5 rounded-3xl text-xl uppercase italic shadow-xl">
        Confirmar y Publicar Calendario
      </button>
    </div>
  );
};

export default CalendarPreview;