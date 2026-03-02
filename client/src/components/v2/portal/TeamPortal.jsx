import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const TeamPortal = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPortalInfo = async () => {
      try {
        // Cambia localhost por tu URL de Railway si vas a probar en móvil real
        const response = await fetch(`https://gestionfutbol-production.up.railway.app/api/leagues/team-portal/${token}`);
        const result = await response.json();
        
        console.log("📦 VORA DATA:", result);
        setData(result);
      } catch (err) {
        console.error("Error en portal:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPortalInfo();
  }, [token]);

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-lime-400 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!data || !data.team) return <div className="text-white text-center p-20 font-black uppercase">Enlace no válido o equipo inexistente</div>;

  const isCaptainInvite = data.type === 'CAPTAIN_INVITE';

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 flex flex-col items-center justify-center font-sans relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-96 bg-lime-400/10 blur-[120px] rounded-full -mt-48"></div>

      <div className="max-w-md w-full space-y-8 z-10">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl">
            <span className="w-2 h-2 bg-lime-400 rounded-full animate-pulse"></span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                Invitación de {data.adminName || 'Organización'}
            </span>
          </div>
          
          <h1 className="text-4xl font-black uppercase italic leading-[0.9] tracking-tighter">
            {isCaptainInvite ? (
              <>¿ERES EL <span className="text-lime-400">RESPONSABLE</span>?</>
            ) : (
              <>¡TE HAN INVITADO A <span className="text-lime-400">JUGAR</span>!</>
            )}
          </h1>
          <p className="text-zinc-500 font-bold uppercase text-[11px] tracking-widest">
            Liga: <span className="text-white">{data.team.leagueName}</span>
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-10 rounded-[3rem] shadow-2xl text-center space-y-4 relative group">
           <div className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">Equipo</div>
           <div className="text-5xl font-black uppercase italic group-hover:scale-105 transition-transform duration-500">
             {data.team.teamName}
           </div>
           {data.team.logo && (
             <img src={data.team.logo} alt="Logo" className="w-20 h-20 mx-auto rounded-full border-2 border-lime-400 p-1 mt-4" />
           )}
        </div>

        {/* SECCIÓN DE ACCIONES DINÁMICAS */}
<div className="space-y-3 pt-4">
  {isCaptainInvite ? (
    // CASO A: El equipo NO tiene capitán aún
    <>
      <button 
        onClick={() => navigate(`/login?token=${token}&dest=claim`)}
        className="w-full bg-lime-400 text-zinc-950 py-5 rounded-[2rem] font-black uppercase italic text-lg hover:bg-white transition-all shadow-xl active:scale-95"
      >
        SÍ, SOY EL CAPITÁN
      </button>

      <button 
        onClick={() => alert("¡Oído cocina! Pásale este enlace a tu capitán para que active el equipo y podáis registraros todos.")}
        className="w-full bg-zinc-900 border border-zinc-800 text-zinc-400 py-5 rounded-[2rem] font-black uppercase italic text-sm hover:text-white transition-all active:scale-95"
      >
        NO, EL RESPONSABLE ES OTRO
      </button>
    </>
  ) : (
    // CASO B: El equipo YA tiene capitán, invitación normal para jugadores
    <>
      <button 
        onClick={() => navigate(`/login?token=${token}&dest=join`)}
        className="w-full bg-white text-zinc-950 py-5 rounded-[2rem] font-black uppercase italic text-lg hover:bg-lime-400 transition-all shadow-xl active:scale-95"
      >
        UNIRME AL EQUIPO
      </button>

      <button 
        onClick={() => navigate(`/register?token=${token}&dest=join`)}
        className="w-full bg-zinc-900 border border-zinc-800 text-white py-5 rounded-[2rem] font-black uppercase italic text-sm active:scale-95"
      >
        NO TENGO CUENTA, REGISTRARME
      </button>
    </>
  )}
</div>
      </div>
    </div>
  );
};

export default TeamPortal;