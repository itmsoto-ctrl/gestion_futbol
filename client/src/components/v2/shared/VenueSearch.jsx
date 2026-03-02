import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../../../apiConfig';

const VenueSelector = ({ onSelect, onAddNew }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const searchDB = async () => {
      if (searchTerm.length > 2) {
        setLoading(true);
        try {
          // 🔌 LLAMADA REAL A TU SERVIDOR EN EL MAC MINI
          const token = localStorage.getItem('token');
          const response = await fetch(`${API_BASE_URL}/api/admin/venues/search?q=${searchTerm}`, {
            headers: { 
              'Authorization': `Bearer ${token}` 
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setResults(data);
          }
        } catch (err) {
          console.error("🚨 Error en la búsqueda de sedes:", err);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      searchDB();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]); // <-- Aquí es donde te marcaba el error por algo abierto arriba

  return (
    <div className="space-y-4">
      <div className="relative">
        <input 
          type="text"
          className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 px-6 focus:border-lime-400 outline-none transition-all uppercase font-bold text-xs tracking-widest text-white"
          placeholder="Busca por nombre, calle o ciudad..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <span className="absolute right-6 top-5 opacity-40 text-[8px] uppercase font-black tracking-widest text-lime-400">
          {loading ? 'Buscando...' : 'Railway Live'}
        </span>
      </div>

      {/* RESULTADOS DE LA BASE DE DATOS */}
      {results.length > 0 && (
        <div className="bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden shadow-2xl animate-in fade-in slide-in-from-top-2">
          {results.map(venue => (
            <button 
              key={venue.id}
              onClick={() => {
                onSelect(venue);
                setSearchTerm('');
              }}
              className="w-full text-left p-5 hover:bg-lime-400 hover:text-zinc-950 border-b border-zinc-800 last:border-none transition-all group"
            >
              <p className="font-black uppercase italic">{venue.name}</p>
              <p className="text-[9px] opacity-60 font-bold uppercase group-hover:opacity-100">
                {venue.address} • {venue.city}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* BOTÓN PARA CREAR NUEVA SEDE SI NO EXISTE */}
      {searchTerm.length > 3 && results.length === 0 && !loading && (
        <button 
          onClick={() => onAddNew(searchTerm)}
          className="w-full bg-zinc-900/50 border border-dashed border-zinc-700 p-6 rounded-3xl text-zinc-500 text-[10px] font-black uppercase tracking-widest hover:border-lime-400 hover:text-white transition-all"
        >
          No existe "{searchTerm}". <span className="text-lime-400 underline">Crear sede nueva</span>
        </button>
      )}
    </div>
  );
};

export default VenueSelector;