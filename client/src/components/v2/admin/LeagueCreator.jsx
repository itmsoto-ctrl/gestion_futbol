import React, { useState } from 'react';
import API_BASE_URL from '../../../apiConfig'; // ✅ Añadido para producción
import CalendarPreview from './CalendarPreview';
import VenueSelector from '../shared/VenueSearch';

const LeagueCreator = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempVenue, setTempVenue] = useState({ name: '', address: '', city: '' });

  const [config, setConfig] = useState({
    name: 'Nueva Liga 2026',
    pointsPerWin: 3,
    teamsCount: 6,
    duration: 60,
    startDate: new Date().toISOString().split('T')[0],
    hasReturnMatch: 0, 
    hasPlayoffs: 0,
    playoffTeams: 4,
    playoffFormat: 'single', 
    teams: Array(6).fill("").map((_, i) => ({ id: i, name: `Equipo ${i + 1}` })),
    selectedVenues: [],
    registrationConfig: {
      fullName: true,
      dni: false,
      phone: false,
      photo: false,
      age: false,
      number: true
    }
  });

  const handleTeamsCountChange = (count) => {
    const val = parseInt(count) || 0;
    const newTeams = Array(val).fill("").map((_, i) => ({
      id: i,
      name: config.teams[i]?.name || `Equipo ${i + 1}`
    }));
    setConfig({ ...config, teamsCount: val, teams: newTeams });
  };

  const updateTeamName = (id, name) => {
    const newTeams = config.teams.map(t => t.id === id ? { ...t, name } : t);
    setConfig({ ...config, teams: newTeams });
  };

  const toggleRegistrationField = (field) => {
    if (field === 'fullName') return;
    setConfig({
      ...config,
      registrationConfig: { ...config.registrationConfig, [field]: !config.registrationConfig[field] }
    });
  };

  const confirmAddVenue = () => {
    const newVenue = {
      id: Date.now(),
      name: tempVenue.name,
      address: tempVenue.address,
      city: tempVenue.city,
      slots: [{ fieldName: 'Campo 1', day: 'Mon', start: '19:00', end: '20:00' }]
    };
    setConfig({...config, selectedVenues: [...config.selectedVenues, newVenue]});
    setIsModalOpen(false);
    setTempVenue({ name: '', address: '', city: '' });
  };

  const addSlotToVenue = (venueId) => {
    const updated = config.selectedVenues.map(v => 
      v.id === venueId ? { ...v, slots: [...v.slots, { fieldName: `Campo ${v.slots.length + 1}`, day: 'Mon', start: '20:00', end: '21:00' }] } : v
    );
    setConfig({ ...config, selectedVenues: updated });
  };

  const updateSlot = (venueId, slotIndex, field, value) => {
    const updated = config.selectedVenues.map(v => {
      if (v.id === venueId) {
        const newSlots = [...v.slots];
        newSlots[slotIndex] = { ...newSlots[slotIndex], [field]: value };
        return { ...v, slots: newSlots };
      }
      return v;
    });
    setConfig({ ...config, selectedVenues: updated });
  };

  const removeVenue = (venueId) => {
    setConfig({ ...config, selectedVenues: config.selectedVenues.filter(v => v.id !== venueId) });
  };

  // ✅ CORRECCIÓN CRÍTICA DE ENVÍO
  const handlePublishLeague = async (generatedSchedule) => {
    if (!generatedSchedule || generatedSchedule.length === 0) {
      alert("⚠️ El calendario está vacío.");
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // 1. Quitamos los IDs manuales de los equipos para evitar error 500 en DB
      const sanitizedTeams = config.teams.map(t => ({ name: t.name }));

      // 2. Aplanamos el objeto para que el servidor lo reciba correctamente
      const payload = {
        ...config,
        teams: sanitizedTeams,
        schedule: generatedSchedule,
        hasReturnMatch: Boolean(config.hasReturnMatch),
        hasPlayoffs: Boolean(config.hasPlayoffs)
      };

      const response = await fetch(`${API_BASE_URL}/api/leagues/create`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert(`¡GOL! Liga creada con éxito.`);
        window.location.href = '/admin/dashboard'; 
      } else {
        const errorData = await response.json();
        alert(`Error del servidor: ${errorData.message || 'Error desconocido'}`);
      }
    } catch (error) {
      alert("No se pudo conectar con el servidor de Railway.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-8 pb-32 font-sans relative">
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md p-8 rounded-[2.5rem] space-y-6">
            <h3 className="text-xl font-black italic uppercase text-lime-400">Detalles de Sede</h3>
            <div className="space-y-4">
              <input type="text" value={tempVenue.name} readOnly className="w-full bg-zinc-800/50 rounded-2xl py-4 px-5 text-sm text-zinc-500 border border-zinc-700 font-bold" />
              <input type="text" placeholder="Dirección" onChange={(e) => setTempVenue({...tempVenue, address: e.target.value})} className="w-full bg-zinc-800 rounded-2xl py-4 px-5 text-sm outline-none border border-zinc-700 focus:border-lime-400" />
              <input type="text" placeholder="Población" onChange={(e) => setTempVenue({...tempVenue, city: e.target.value})} className="w-full bg-zinc-800 rounded-2xl py-4 px-5 text-sm outline-none border border-zinc-700 focus:border-lime-400" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-[10px] font-bold uppercase text-zinc-500">Cancelar</button>
              <button onClick={confirmAddVenue} className="flex-[2] bg-lime-400 text-zinc-950 py-4 rounded-2xl font-black uppercase italic text-sm shadow-lg shadow-lime-400/10">Guardar Sede</button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto lg:grid lg:grid-cols-3 lg:gap-12">
        <div className="lg:col-span-2">
          <header className="mb-10">
            <h2 className="text-3xl font-black uppercase italic text-lime-400 leading-none">Configurador de Liga</h2>
            <div className="flex gap-2 mt-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= i ? 'bg-lime-400 shadow-[0_0_10px_rgba(163,230,53,0.3)]' : 'bg-zinc-800'}`} />
              ))}
            </div>
          </header>

          {step === 1 && (
            <div className="space-y-6 animate-in slide-in-from-right duration-300">
              <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800">
                <label className="text-[10px] uppercase font-bold text-zinc-500 mb-2 block tracking-widest">Nombre de la Competición</label>
                <input type="text" className="w-full bg-zinc-800 border-none rounded-2xl py-4 px-6 text-xl font-black text-white outline-none focus:ring-2 ring-lime-400 uppercase" value={config.name} onChange={(e) => setConfig({...config, name: e.target.value})} placeholder="Ej: Torneo Clausura 2026" />
              </div>

              <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800">
                <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-4 tracking-widest">Datos Obligatorios del Jugador</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {Object.keys(config.registrationConfig).map((field) => (
                    <button key={field} onClick={() => toggleRegistrationField(field)} className={`py-3 px-4 rounded-xl text-[10px] font-black uppercase transition-all border ${config.registrationConfig[field] ? 'bg-lime-400 text-zinc-950 border-lime-400 shadow-[0_0_15px_rgba(163,230,53,0.2)]' : 'bg-zinc-800/50 text-zinc-300 border-zinc-700/50 hover:border-zinc-500 hover:text-white'}`}>{field === 'fullName' ? 'Nombre' : field === 'dni' ? 'DNI / NIE' : field === 'phone' ? 'Teléfono' : field === 'photo' ? 'Foto Ficha' : field === 'age' ? 'Edad' : 'Dorsal'}</button>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800">
                  <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-2">Fecha de Inicio</label>
                  <input type="date" className="w-full bg-zinc-800 rounded-2xl py-3 px-4 text-sm border-none outline-none text-lime-400" value={config.startDate} onChange={(e) => setConfig({...config, startDate: e.target.value})} />
                </div>
                <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800">
                  <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-2">Formato de Liga</label>
                  <div className="flex gap-2">
                    <button onClick={() => setConfig({...config, hasReturnMatch: 0})} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase border ${config.hasReturnMatch === 0 ? 'border-lime-400 bg-lime-400/10 text-lime-400 shadow-lg' : 'border-zinc-800 text-zinc-600'}`}>Solo Ida</button>
                    <button onClick={() => setConfig({...config, hasReturnMatch: 1})} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase border ${config.hasReturnMatch === 1 ? 'border-lime-400 bg-lime-400/10 text-lime-400 shadow-lg' : 'border-zinc-800 text-zinc-600'}`}>Ida y Vuelta</button>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] uppercase font-bold text-zinc-500">¿Incluir Playoffs?</label>
                  <button onClick={() => setConfig({...config, hasPlayoffs: config.hasPlayoffs ? 0 : 1})} className={`w-12 h-6 rounded-full relative transition-colors ${config.hasPlayoffs ? 'bg-lime-400' : 'bg-zinc-800'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-zinc-950 rounded-full transition-all ${config.hasPlayoffs ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
                {config.hasPlayoffs === 1 && (
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-800 animate-in fade-in zoom-in">
                    <div>
                      <label className="text-[9px] uppercase font-bold text-zinc-600 block mb-2">Equipos en Playoff</label>
                      <select className="w-full bg-zinc-800 rounded-xl p-3 text-xs border border-zinc-700 outline-none focus:border-lime-400 font-bold" value={config.playoffTeams} onChange={(e) => setConfig({...config, playoffTeams: parseInt(e.target.value)})}>
                        <option value={2}>TOP 2</option><option value={4}>TOP 4</option><option value={8}>TOP 8</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] uppercase font-bold text-zinc-600 block mb-2">Formato Eliminatoria</label>
                      <select className="w-full bg-zinc-800 rounded-xl p-3 text-xs border border-zinc-700 outline-none focus:border-lime-400 font-bold" value={config.playoffFormat} onChange={(e) => setConfig({...config, playoffFormat: e.target.value})}>
                        <option value="single">Partido Único</option><option value="double">Ida y Vuelta</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800">
                <label className="text-[10px] uppercase font-bold text-zinc-500 mb-2 block tracking-widest">Número de Equipos</label>
                <input type="number" className="w-full bg-zinc-800 border-none rounded-2xl py-4 px-6 text-2xl font-black text-lime-400 outline-none" value={config.teamsCount} onChange={(e) => handleTeamsCountChange(e.target.value)} />
              </div>

              <button onClick={() => setStep(2)} className="w-full bg-lime-400 text-zinc-950 font-black py-5 rounded-3xl text-xl uppercase italic shadow-xl shadow-lime-400/10">Siguiente: Equipos</button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right duration-300">
              <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800">
                <h3 className="text-sm font-black uppercase italic text-lime-400 mb-6 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-lime-400"></span> Nombra los equipos
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {config.teams.map((team) => (
                    <div key={team.id} className="flex items-center gap-3 bg-zinc-800/50 p-4 rounded-2xl border border-zinc-800 focus-within:border-lime-400 transition-colors">
                      <span className="text-[10px] font-black text-zinc-600 w-4">{team.id + 1}</span>
                      <input type="text" className="bg-transparent border-none outline-none text-xs font-bold w-full text-white" value={team.name} onChange={(e) => updateTeamName(team.id, e.target.value)} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setStep(1)} className="flex-1 bg-zinc-900 border border-zinc-800 py-5 rounded-3xl font-bold uppercase text-[10px]">Atrás</button>
                <button onClick={() => setStep(3)} className="flex-[2] bg-lime-400 text-zinc-950 font-black py-5 rounded-3xl text-xl uppercase italic">Siguiente: Sedes</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in slide-in-from-right duration-300">
              <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800">
                <label className="text-[10px] uppercase font-bold text-zinc-500 mb-4 block tracking-widest">Añadir Campo/Sede</label>
                <VenueSelector 
                  onSelect={(venue) => {
                    if (config.selectedVenues.some(v => v.id === venue.id)) return;
                    const formattedVenue = {
                      id: venue.id,
                      name: venue.name,
                      address: venue.address,
                      city: venue.city,
                      slots: [{ fieldName: 'Campo 1', day: 'Mon', start: '19:00', end: '20:00' }]
                    };
                    setConfig({...config, selectedVenues: [...config.selectedVenues, formattedVenue]});
                  }}
                  onAddNew={(name) => {
                    setTempVenue({ ...tempVenue, name });
                    setIsModalOpen(true);
                  }}
                />
              </div>

              <div className="space-y-4">
                {config.selectedVenues.map((venue) => (
                  <div key={venue.id} className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800 space-y-4 shadow-inner">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lime-400 uppercase text-sm">📍 {venue.name}</h3>
                        <p className="text-[9px] text-zinc-500 font-bold uppercase">{venue.city} • {venue.address}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => addSlotToVenue(venue.id)} className="text-[9px] bg-zinc-800 px-4 py-2 rounded-xl font-bold border border-zinc-700 hover:bg-zinc-700 transition-colors">+ Franja</button>
                        <button onClick={() => removeVenue(venue.id)} className="text-[9px] bg-red-500/10 text-red-500 px-4 py-2 rounded-xl font-bold border border-red-500/20 hover:bg-red-500 hover:text-white transition-all">Eliminar</button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {venue.slots.map((slot, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-2 pt-3 border-t border-zinc-800/50 items-center">
                          <input type="text" placeholder="Campo" className="col-span-4 bg-zinc-900 rounded-xl p-2 text-[10px] font-bold outline-none border border-transparent focus:border-zinc-700" value={slot.fieldName} onChange={(e) => updateSlot(venue.id, idx, 'fieldName', e.target.value)} />
                          <select className="col-span-3 bg-zinc-800 rounded-xl p-2 text-[10px] font-bold outline-none cursor-pointer" value={slot.day} onChange={(e) => updateSlot(venue.id, idx, 'day', e.target.value)}>
                            <option value="Mon">LUN</option><option value="Tue">MAR</option><option value="Wed">MIE</option><option value="Thu">JUE</option><option value="Fri">VIE</option><option value="Sat">SAB</option><option value="Sun">DOM</option>
                          </select>
                          <input type="time" className="col-span-2 bg-zinc-800 rounded-xl p-2 text-[10px] text-white" value={slot.start} onChange={(e) => updateSlot(venue.id, idx, 'start', e.target.value)} />
                          <input type="time" className="col-span-2 bg-zinc-800 rounded-xl p-2 text-[10px] text-white" value={slot.end} onChange={(e) => updateSlot(venue.id, idx, 'end', e.target.value)} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <button onClick={() => setStep(2)} className="flex-1 bg-zinc-900 border border-zinc-800 py-5 rounded-3xl font-bold uppercase text-[10px]">Atrás</button>
                <button onClick={() => setStep(4)} disabled={config.selectedVenues.length === 0} className={`flex-[2] py-5 rounded-3xl text-xl uppercase italic font-black transition-all ${config.selectedVenues.length > 0 ? 'bg-lime-400 text-zinc-950 shadow-xl' : 'bg-zinc-800 text-zinc-600 opacity-50 cursor-not-allowed'}`}>Generar Calendario</button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="animate-in zoom-in duration-300">
              <CalendarPreview config={config} onConfirm={(finalSchedule) => handlePublishLeague(finalSchedule)} />
              {loading && <p className="text-center text-lime-400 font-bold mt-4 animate-pulse uppercase text-[10px] tracking-widest leading-none">Iniciando transacción en Railway...</p>}
              <button onClick={() => setStep(3)} disabled={loading} className="w-full mt-4 text-zinc-600 font-bold uppercase text-[9px] hover:text-white transition-colors">Volver a configuración de sedes</button>
            </div>
          )}
        </div>

        <div className="hidden lg:block">
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2rem] sticky top-10 shadow-2xl">
            <h3 className="text-lime-400 font-black italic uppercase mb-6 text-sm tracking-widest text-center border-b border-zinc-800 pb-4 leading-none">Resumen</h3>
            <div className="space-y-6">
              <div className="flex justify-between items-end border-b border-zinc-800 pb-2"><span className="text-[10px] text-zinc-500 uppercase font-bold">Nombre</span><span className="text-[11px] font-black text-white truncate max-w-[120px] uppercase italic">{config.name}</span></div>
              <div className="flex justify-between items-end border-b border-zinc-800 pb-2"><span className="text-[10px] text-zinc-500 uppercase font-bold">Inicio</span><span className="text-sm font-black text-lime-400">{config.startDate}</span></div>
              <div className="flex justify-between items-end border-b border-zinc-800 pb-2"><span className="text-[10px] text-zinc-500 uppercase font-bold">Equipos</span><span className="text-xl font-black">{config.teamsCount}</span></div>
              <div className="flex justify-between items-end border-b border-zinc-800 pb-2"><span className="text-[10px] text-zinc-500 uppercase font-bold">Playoffs</span><span className="text-sm font-bold text-lime-400">{config.hasPlayoffs ? `TOP ${config.playoffTeams}` : 'NO'}</span></div>
              <div className="flex justify-between items-end border-b border-zinc-800 pb-2"><span className="text-[10px] text-zinc-500 uppercase font-bold">Sedes</span><span className="text-sm font-bold text-white">{config.selectedVenues.length}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeagueCreator;