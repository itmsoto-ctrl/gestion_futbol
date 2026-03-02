import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API_BASE_URL from '../apiConfig';

const TeamPortal = () => {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/leagues/team-portal/${token}`)
      .then(res => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="p-10 text-white text-center font-black">CARGANDO MOTOR...</div>;
  if (!data?.team) return <div className="p-10 text-red-500 text-center font-black">ENLACE CADUCADO</div>;

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-[3rem] p-8 shadow-2xl">
        <header className="text-center mb-10">
          <span className="bg-lime-400 text-zinc-950 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
            {data.team.leagueName}
          </span>
          <h1 className="text-4xl font-black uppercase italic mt-4 leading-none">
            {data.team.teamName}
          </h1>
        </header>

        {data.type === 'CAPTAIN_INVITE' ? (
          <div className="space-y-6 text-center animate-in fade-in slide-in-from-bottom-4">
            <p className="text-zinc-400 text-sm leading-relaxed">
              Hola, has sido seleccionado para ser el <b>Capitán</b> de este equipo. 
              Para empezar a inscribir a tus jugadores, primero vincula tu cuenta.
            </p>
            <button 
              onClick={() => window.location.href = `/login?claim=${data.team.id}`}
              className="w-full bg-white text-zinc-950 font-black py-5 rounded-3xl text-xl uppercase italic shadow-xl"
            >
              Reclamar mi Equipo
            </button>
          </div>
        ) : (
          <form className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <p className="text-zinc-500 text-[10px] font-bold uppercase text-center mb-6 tracking-widest">
              Formulario de Inscripción para Jugadores
            </p>
            <input type="text" placeholder="NOMBRE COMPLETO" className="w-full bg-zinc-800 p-5 rounded-2xl border border-zinc-700 outline-none focus:border-lime-400" />
            <div className="flex gap-4">
              <input type="number" placeholder="DORSAL" className="w-1/3 bg-zinc-800 p-5 rounded-2xl border border-zinc-700 outline-none" />
              <input type="text" placeholder="DNI / NIE" className="w-2/3 bg-zinc-800 p-5 rounded-2xl border border-zinc-700 outline-none" />
            </div>
            
            <div className="bg-zinc-800 border-2 border-dashed border-zinc-700 rounded-2xl p-6 text-center cursor-pointer hover:border-lime-400 transition-colors">
              <p className="text-[10px] font-black uppercase text-zinc-500">📸 Subir Foto de Ficha</p>
            </div>

            <button className="w-full bg-lime-400 text-zinc-950 font-black py-5 rounded-3xl text-xl uppercase italic mt-6">
              Confirmar Inscripción
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default TeamPortal;