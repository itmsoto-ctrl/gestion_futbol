import React, { useState, useEffect } from 'react';

const VenueSelector = ({ onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Simulación de búsqueda en base de datos global
  const allVenues = [
    { id: 1, name: 'Polideportivo Municipal Cornellà', address: 'Carrer de la Rugby, 1', city: 'Cornellà' },
    { id: 2, name: 'Camp de Futbol Can Buxeres', address: 'Camí de Can Buxeres, s/n', city: 'Hospitalet' },
  ];

  useEffect(() => {
    if (searchTerm.length > 2) {
      const filtered = allVenues.filter(v => 
        v.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setResults(filtered);
    } else {
      setResults([]);
    }
  }, [searchTerm]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <input 
          type="text"
          className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 px-6 focus:border-lime-400 outline-none transition-all"
          placeholder="Busca por nombre, calle o ciudad..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <span className="absolute right-6 top-5 opacity-30 text-xs uppercase font-bold tracking-widest">Global Search</span>
      </div>

      {/* Resultados del filtrado */}
      {results.length > 0 && (
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
          {results.map(venue => (
            <button 
              key={venue.id}
              onClick={() => onSelect(venue)}
              className="w-full text-left p-4 hover:bg-zinc-800 border-b border-zinc-800 last:border-none"
            >
              <p className="font-bold text-lime-400">{venue.name}</p>
              <p className="text-[10px] text-zinc-500 uppercase">{venue.address} • {venue.city}</p>
            </button>
          ))}
        </div>
      )}

      {/* Si no hay resultados, invitamos a crear uno nuevo */}
      {searchTerm.length > 3 && results.length === 0 && (
        <button 
          onClick={() => setShowCreateModal(true)}
          className="w-full bg-zinc-800/50 border border-dashed border-zinc-700 p-4 rounded-2xl text-zinc-400 text-sm italic"
        >
          ¿No encuentras la sede? <span className="text-white font-bold underline">Crea una nueva</span>
        </button>
      )}
    </div>
  );
};

export default VenueSelector;