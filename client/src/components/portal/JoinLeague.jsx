import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ShieldCheck, User, ArrowRight, Loader2, Trophy } from 'lucide-react';
import API_BASE_URL from '../../apiConfig'; // Ajusta la ruta si es necesario

const JoinLeague = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [claiming, setClaiming] = useState(false);

    // 1. Cargar datos del portal al entrar
    useEffect(() => {
        const fetchPortalData = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/leagues/team-portal/${token}`);
                setData(res.data);
            } catch (err) {
                console.error("Error al cargar el portal:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchPortalData();
    }, [token]);

    const handleAction = async (actionType) => {
        const userToken = localStorage.getItem('token');

        // Si no está logueado, lo mandamos al login guardando a dónde quería ir
        if (!userToken) {
            navigate(`/admin/login?token=${token}&dest=${actionType}`);
            return;
        }

        if (actionType === 'CAPTAIN_INVITE') {
            setClaiming(true);
            try {
                const res = await axios.post(`${API_BASE_URL}/api/leagues/claim-team`, 
                    { teamId: data.team.id },
                    { headers: { Authorization: `Bearer ${userToken}` } }
                );

                if (res.data.success) {
                    // 🚀 SALTO CLAVE: Directo a completar la ficha
                    navigate('/complete-profile', { 
                        state: { 
                            leagueId: data.team.league_id,
                            teamId: data.team.id,
                            inviteToken: token 
                        } 
                    });
                }
            } catch (err) {
                alert(err.response?.data?.message || "Error al reclamar el equipo");
            } finally {
                setClaiming(false);
            }
        } else {
            // Si es un jugador normal, también lo mandamos a completar su ficha para esa liga
            navigate('/complete-profile', { 
                state: { 
                    leagueId: data.team.league_id,
                    teamId: data.team.id,
                    inviteToken: token 
                } 
            });
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
            <Loader2 className="text-lime-400 animate-spin" size={48} />
        </div>
    );

    if (!data) return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">
            <p className="font-black uppercase italic">Enlace no válido o expirado</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-zinc-950 text-white p-6 flex flex-col items-center justify-center">
            {/* Header de la Liga */}
            <div className="text-center mb-10">
                <div className="inline-block bg-lime-400 text-zinc-950 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                    Invitación Oficial VORA
                </div>
                <h1 className="text-4xl font-black uppercase italic leading-none">
                    {data.team.leagueName}
                </h1>
            </div>

            {/* Tarjeta del Equipo */}
            <div className="w-full max-w-sm bg-zinc-900 border-2 border-zinc-800 rounded-[3rem] p-8 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-6 opacity-10">
                    <Trophy size={120} />
                </div>

                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-24 h-24 bg-zinc-800 rounded-3xl mb-6 flex items-center justify-center border-2 border-lime-400/20">
                        {data.team.logo ? (
                            <img src={data.team.logo} className="w-full h-full object-contain" alt="Logo" />
                        ) : (
                            <span className="text-4xl font-black text-lime-400">{data.team.teamName[0]}</span>
                        )}
                    </div>

                    <h2 className="text-2xl font-black uppercase italic mb-2">{data.team.teamName}</h2>
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-8">
                        {data.type === 'CAPTAIN_INVITE' ? 'Equipo sin capitán' : 'Inscripciones abiertas'}
                    </p>

                    {/* Botón Dinámico */}
                    <button
                        onClick={() => handleAction(data.type)}
                        disabled={claiming}
                        className="w-full bg-white text-zinc-950 font-black py-5 rounded-2xl flex items-center justify-center gap-3 uppercase italic transition-all active:scale-95 hover:bg-lime-400"
                    >
                        {claiming ? (
                            <Loader2 className="animate-spin" />
                        ) : data.type === 'CAPTAIN_INVITE' ? (
                            <> <ShieldCheck size={20} /> Soy el Capitán </>
                        ) : (
                            <> <User size={20} /> Unirme al Equipo </>
                        )}
                        <ArrowRight size={20} />
                    </button>
                </div>
            </div>

            <p className="mt-10 text-[8px] text-zinc-700 font-black uppercase tracking-[0.4em]">
                Vora Digital Sports System
            </p>
        </div>
    );
};

export default JoinLeague;