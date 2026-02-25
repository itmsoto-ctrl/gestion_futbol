import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const API_URL = "https://gestionfutbol-production.up.railway.app";

const TournamentView = ({ user }) => {
    const { id } = useParams();
    const [matches, setMatches] = useState([]);
    const [teams, setTeams] = useState([]);
    const [players, setPlayers] = useState([]);
    const [allGoals, setAllGoals] = useState([]);
    const [stats, setStats] = useState({ goleadores: [], porteros: [] });
    const [tournamentInfo, setTournamentInfo] = useState(null);
    const [loading, setLoading] = useState(true);

    const isAdmin = user?.role === 'admin';

    const loadData = useCallback(async () => {
        try {
            const [resM, resT, resP, resS, resG, resTourneys] = await Promise.allSettled([
                axios.get(`${API_URL}/matches/${id}`),
                axios.get(`${API_URL}/teams/${id}`),
                axios.get(`${API_URL}/players/${id}`),
                axios.get(`${API_URL}/stats/${id}`),
                axios.get(`${API_URL}/goals/${id}`),
                axios.get(`${API_URL}/tournaments`)
            ]);
            
            if (resM.status === 'fulfilled') setMatches(resM.value.data || []);
            if (resT.status === 'fulfilled') setTeams(resT.value.data || []);
            if (resP.status === 'fulfilled') setPlayers(resP.value.data || []);
            if (resS.status === 'fulfilled') setStats(resS.value.data || { goleadores: [], porteros: [] });
            if (resG.status === 'fulfilled') setAllGoals(resG.value.data || []);
            if (resTourneys.status === 'fulfilled') {
                setTournamentInfo(resTourneys.value.data.find(t => t.id === parseInt(id)));
            }
        } catch (error) { console.error("Error cargando datos:", error); }
        finally { setLoading(false); }
    }, [id]);

    useEffect(() => { loadData(); }, [loadData]);

    // --- ACTUALIZACIÓN OPTIMISTA DE GOLES ---
    const handleGoal = async (e, mId, pId, tId, side, action) => {
        e.stopPropagation();
        
        // 1. Clonar estado actual para respaldo
        const previousMatches = [...matches];

        // 2. Actualizar UI inmediatamente
        setMatches(prev => prev.map(m => {
            if (m.id === mId) {
                const newVal = action === 'add' ? m[side] + 1 : Math.max(0, m[side] - 1);
                return { ...m, [side]: newVal };
            }
            return m;
        }));

        // 3. Llamada al servidor
        try {
            const url = action === 'add' ? '/add-player-goal' : '/remove-player-goal';
            await axios.post(`${API_URL}${url}`, { 
                match_id: mId, player_id: pId, team_id: tId, team_side: side 
            });
            // Recargamos goles y stats en segundo plano para sincronizar IDs
            const [resG, resS] = await Promise.all([
                axios.get(`${API_URL}/goals/${id}`),
                axios.get(`${API_URL}/stats/${id}`)
            ]);
            setAllGoals(resG.data);
            setStats(resS.data);
        } catch (err) {
            setMatches(previousMatches); // Revertir si falla
            alert("Error al guardar el gol");
        }
    };

    // --- BANNER DE LA FINAL & CAMPEÓN ---
    const FinalModule = () => {
        const finalMatch = matches.find(m => m.phase === 'final');
        if (!finalMatch) return null;

        const isFinished = finalMatch.played === 1;
        const winnerName = finalMatch.team_a_goals > finalMatch.team_b_goals ? finalMatch.team_a_name : finalMatch.team_b_name;
        const winnerLogo = finalMatch.team_a_goals > finalMatch.team_b_goals ? finalMatch.team_a_logo : finalMatch.team_b_logo;

        return (
            <div style={{ marginBottom: '30px' }}>
                {/* SI HAY CAMPEÓN: MÓDULO ESPECIAL */}
                {isFinished && (
                    <div style={{
                        background: 'linear-gradient(145deg, #000, #1a1a1a)',
                        borderRadius: '20px',
                        padding: '30px',
                        textAlign: 'center',
                        border: '4px solid #d4af37',
                        boxShadow: '0 0 30px rgba(212, 175, 55, 0.4)',
                        animation: 'fadeIn 1.5s ease-in',
                        marginBottom: '20px'
                    }}>
                        <div style={{ fontSize: '50px', marginBottom: '10px' }}>🥇</div>
                        <h2 style={{ color: '#d4af37', margin: '0', letterSpacing: '2px', fontWeight: '900' }}>CAMPEÓN</h2>
                        <img src={winnerLogo} alt="logo" style={{ width: '80px', margin: '15px 0' }} />
                        <div style={{ fontSize: '28px', color: '#fff', fontWeight: '900', textTransform: 'uppercase' }}>
                            {winnerName}
                        </div>
                    </div>
                )}

                {/* BANNER DEL PARTIDO (Compacto) */}
                <div style={{
                    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                    padding: '12px 15px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    color: '#fff',
                    border: '1px solid #334155',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                }}>
                    {/* Equipo A */}
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <img src={finalMatch.team_a_logo} style={{ width: '24px', height: '24px', objectFit: 'contain' }} alt="L" />
                        <div style={{ fontSize: '13px', fontWeight: '800', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {finalMatch.team_a_name || 'FINALISTA 1'}
                        </div>
                    </div>

                    {/* Resultado Central */}
                    <div style={{ 
                        flex: '0 0 100px', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center',
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        padding: '4px 0'
                    }}>
                        <div style={{ fontSize: '9px', color: '#d4af37', fontWeight: 'bold' }}>FINAL</div>
                        <div style={{ fontSize: '20px', fontWeight: '900', fontFamily: 'monospace' }}>
                            {finalMatch.team_a_goals} - {finalMatch.team_b_goals}
                        </div>
                    </div>

                    {/* Equipo B */}
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                        <div style={{ fontSize: '13px', fontWeight: '800', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {finalMatch.team_b_name || 'FINALISTA 2'}
                        </div>
                        <img src={finalMatch.team_b_logo} style={{ width: '24px', height: '24px', objectFit: 'contain' }} alt="L" />
                    </div>
                </div>
            </div>
        );
    };

    if (loading) return <div style={{ padding: '50px', textAlign: 'center', color: '#666' }}>Cargando Torneo...</div>;

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '15px', fontFamily: 'system-ui' }}>
            <FinalModule />
            
            {/* Aquí iría el resto de tus componentes: Listado de Partidos, Stats, etc. */}
            <div style={{ color: '#334155' }}>
                <h3 style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>
                    Calendario de Partidos
                </h3>
                {/* Mapeo de matches aquí... */}
            </div>
        </div>
    );
};

export default TournamentView;
