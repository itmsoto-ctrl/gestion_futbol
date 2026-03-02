import React, { useState } from 'react';

const EditTeamModal = ({ team, onClose, onUpdate }) => {
  const [phone, setPhone] = useState(team.captain_phone || '');
  const [logo, setLogo] = useState(team.logo || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch(`https://gestionfutbol-production.up.railway.app/api/leagues/teams/${team.id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ captain_phone: phone, logo: logo })
      });

      if (response.ok) {
        onUpdate(); // Refresca la lista en el Dashboard
        onClose();
      }
    } catch (error) {
      alert("Error al actualizar el equipo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-zinc-900 w-full max-w-md rounded-[2.5rem] p-8 border border-zinc-800 animate-in slide-in-from-bottom">
        <header className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-black uppercase italic text-white">Ajustes: {team.name}</h2>
          <button onClick={onClose} className="text-zinc-500 font-bold text-xl">✕</button>
        </header>

        <div className="space-y-6">
          {/* CAMPO TELÉFONO */}
          <div>
            <label className="text-[10px] font-black uppercase text-zinc-500 ml-4 mb-2 block tracking-widest">Teléfono del Capitán</label>
            <input 
              type="tel" 
              placeholder="Ej: 600123456"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-zinc-800 p-5 rounded-3xl border border-zinc-700 outline-none focus:border-lime-400 text-white font-bold"
            />
          </div>

          {/* CAMPO LOGO (URL POR AHORA) */}
          <div>
            <label className="text-[10px] font-black uppercase text-zinc-500 ml-4 mb-2 block tracking-widest">URL del Escudo/Logo</label>
            <input 
              type="text" 
              placeholder="https://servidor.com/logo.png"
              value={logo}
              onChange={(e) => setLogo(e.target.value)}
              className="w-full bg-zinc-800 p-5 rounded-3xl border border-zinc-700 outline-none focus:border-lime-400 text-white text-xs"
            />
          </div>

          <button 
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-lime-400 text-zinc-950 font-black py-5 rounded-3xl text-xl uppercase italic mt-4 shadow-xl shadow-lime-400/20"
          >
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditTeamModal;