import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../../apiConfig'; // Asegúrate que la ruta sea correcta

const JoinLeague = () => {
    const { token } = useParams(); // Pillamos el F5660E de la URL
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadPortal = async () => {
            try {
                console.log("📡 Llamando al portal con token:", token);
                // 💡 IMPORTANTE: Usamos la ruta team-portal que es pública
                const res = await axios.get(`${API_BASE_URL}/api/leagues/team-portal/${token}`);
                console.log("📦 Objeto recibido de la DB:", res.data);
                setData(res.data);
            } catch (err) {
                console.error("❌ Error al cargar el portal:", err.response?.data || err.message);
            } finally {
                setLoading(false);
            }
        };
        if (token) loadPortal();
    }, [token]);

    const handleClaimCaptain = async () => {
        const userToken = localStorage.getItem('token');
        
        // Si no hay token, lo mandamos a login y que luego vuelva aquí
        if (!userToken) {
            console.log("👋 No hay sesión, redirigiendo a login...");
            navigate(`/admin/login?token=${token}&dest=claim`);
            return;
        }

        try {
            console.log("🚀 Intentando postear claim-team para el ID:", data.team.id);
            const res = await axios.post(`${API_BASE_URL}/api/leagues/claim-team`, 
                { teamId: data.team.id },
                { headers: { Authorization: `Bearer ${userToken}` } }
            );

            if (res.data.success) {
                console.log("✅ Capitán vinculado con éxito!");
                navigate('/complete-profile', { state: { leagueId: data.team.league_id, teamId: data.team.id } });
            }
        } catch (err) {
            console.error("🚨 Error en el POST:", err.response?.data);
            alert(err.response?.data?.message || "Error al vincular");
        }
    };

    if (loading) return <div className="text-white">Cargando...</div>;
    if (!data) return <div className="text-white">Error: No se encontró el equipo. Revisa el token en la URL.</div>;

    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-white text-center">
            <h1 className="text-3xl font-black uppercase italic mb-2">{data.team.teamName}</h1>
            <p className="text-lime-400 font-bold mb-8">{data.team.leagueName}</p>
            
            <button 
                onClick={handleClaimCaptain}
                className="bg-white text-black font-black px-10 py-5 rounded-2xl uppercase italic active:scale-95 transition-all"
            >
                {data.type === 'CAPTAIN_INVITE' ? 'Soy el Capitán' : 'Unirme al Equipo'}
            </button>
        </div>
    );
};

export default JoinLeague;