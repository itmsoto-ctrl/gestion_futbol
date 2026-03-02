import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Loader2, ShieldCheck, ArrowRight } from 'lucide-react';
import API_BASE_URL from '../../apiConfig';

const JoinLeague = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [claiming, setClaiming] = useState(false);

    useEffect(() => {
        const loadPortal = async () => {
            try {
                // ✅ CORRECCIÓN: 'res' ahora está correctamente definido aquí
                const res = await axios.get(`${API_BASE_URL}/api/leagues/team-portal/${token}`);
                setData(res.data);
            } catch (err) {
                console.error("Error portal:", err);
            } finally {
                setLoading(false);
            }
        };
        if (token) loadPortal();
    }, [token]);

    // ✅ CORRECCIÓN: Nombre de función unificado a 'handleClaimCaptain'
    const handleClaimCaptain = async () => {
        const userToken = localStorage.getItem('token');
        
        if (!userToken) {
            navigate(`/admin/login?token=${token}&dest=claim`);
            return;
        }

        setClaiming(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/api/leagues/claim-team`, 
                { teamId: data.team.id },
                { headers: { Authorization: `Bearer ${userToken}` } }
            );

            if (res.data.success) {
                // 🚀 ESTE ES EL SALTO QUE TE FALTABA
                navigate('/complete-profile', { 
                    state: { 
                        leagueId: data.team.league_id, 
                        teamId: data.team.id 
                    } 
                });
            }
        } catch (err) {
            alert(err.response?.data?.message || "Error al vincular");
        } finally {
            setClaiming(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
            <Loader2 className="text-lime-400 animate-spin" size={40} />
        </div>
    );

    return (
        <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6">
            {/* 📸 LOGO SHINE AÑADIDO */}
            <img src="/logo-shine.webp" alt="VORA" className="h-12 mb-10 drop-shadow-[0_0_15px_rgba(163,230,53,0.3)]" />

            <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 p-8 rounded-[3rem] text-center shadow-2xl">
                <h1 className="text-3xl font-black uppercase italic mb-2">{data?.team?.teamName}</h1>
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-8">
                    {data?.team?.leagueName}
                </p>

                <button 
                    onClick={handleClaimCaptain} // ✅ Ahora coincide con la función
                    disabled={claiming}
                    className="w-full bg-lime-400 text-zinc-950 font-black py-5 rounded-2xl flex items-center justify-center gap-2 uppercase italic transition-all active:scale-95"
                >
                    {claiming ? <Loader2 className="animate-spin" /> : <><ShieldCheck size={20} /> Soy el Capitán <ArrowRight size={20} /></>}
                </button>
            </div>
        </div>
    );
};

export default JoinLeague;