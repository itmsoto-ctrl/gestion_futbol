import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const API_URL = "https://gestionfutbol-production.up.railway.app";

const TournamentView = ({ user }) => {
    const { id } = useParams();
    
    // 1. ESTADOS DE DATOS
    const [matches, setMatches] = useState([]);
    const [teams, setTeams] = useState([]);
    const [players, setPlayers] = useState([]);
    const [allGoals, setAllGoals] = useState([]);
    const [stats, setStats] = useState({ goleadores: [], porteros: [] });
    const [tournamentInfo, setTournamentInfo] = useState(null);

    // 2. ESTADOS DE INTERFAZ
    const [loading, setLoading] = useState(true);
    const [expandedMatchId, setExpandedMatchId] = useState(null);

    const isAdmin = user?.role === 'admin';

    // --- CARGA DE DATOS ---
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
        } catch (error) { console.error("Error:", error); }
        finally { setLoading(false); }
    }, [id]);

    useEffect(() => { loadData(); }, [loadData]);

    // --- LÓGICA DE CLASIFICACIÓN REAL-TIME ---
    const standings = useMemo(() => {
        let table = {};
        teams.forEach(t => { table[t.id] = { id: t.id, name: t.name, logo: t.logo_url, pts: 0, gf: 0, gc: 0, pj: 0 }; });
        matches.forEach(m => {
            const ph = m.phase?.toLowerCase() || '';
            if (m.played && (ph === 'grupo' || ph === 'liga')) {
                const tA = table[m.team_a_id]; const tB = table[m.team_b_id];
                if (tA && tB) {
                    tA.pj++; tB.pj++;
                    tA.gf += m.team_a_goals; tA.gc += m.team_b_goals;
                    tB.gf += m.team_b_goals; tB.gc += m.team_a_goals;
                    if (m.team_a_goals > m.team_b_goals) tA.pts += 3;
                    else if (m.team_a_goals < m.team_b_goals) tB.pts += 3;
                    else { tA.pts += 1; tB.pts += 1; }
                }
            }
        });
        return Object.values(table).sort((a, b) => b.pts - a.pts || (b.gf - b.gc) - (a.gf - a.gc));
    }, [matches, teams]);

    // --- ACCIONES OPTIMISTAS ---
    const handleGoal = async (e, mId, pId, tId, side, action) => {
        e.stopPropagation();
        const prevMatches = [...matches];
        setMatches(prev => prev.map(m => m.id === mId ? { ...m, [side]: action === 'add' ? m[side] + 1 : Math.max(0, m[side] - 1) } : m));

        try {
            const url = action === 'add' ? '/add-player-goal' : '/remove-player-goal';
            await axios.post(`${API_URL}${url}`, { match_id: mId, player_id: pId, team_id: tId, team_side: side });
            const [resG, resS] = await Promise.all([axios.get(`${API_URL}/goals/${id}`), axios.get(`${API_URL}/stats/${id}`)]);
            setAllGoals(resG.data); setStats(resS.data);
        } catch (err) { setMatches(prevMatches); alert("Error de conexión"); }
    };

    // --- COMPONENTE MÓDULO FINAL & CAMPEÓN ---
    const FinalModule = () => {
        const finalMatch = matches.find(m => m.phase === 'final');
        if (!finalMatch) return null;

        const isFinished = finalMatch.played === 1;
        const winnerId = finalMatch.team_a_goals > finalMatch.team_b_goals ? finalMatch.team_a_id : finalMatch.team_b_id;
        const winner = teams.find(t => t.id === winnerId);

        return (
            <div style={{ marginBottom: '25px' }}>
                {isFinished && winner && (
                    <div style={{ background: 'linear-gradient(145deg, #000, #1a1a1a)', borderRadius: '15px', padding: '20px', textAlign: 'center', border: '3px solid #d4af37', boxShadow: '0 10px 25px rgba(212,175,55,0.3)', marginBottom: '15px' }}>
                        <div style={{ fontSize: '40px' }}>🏆</div>
                        <h4 style={{ color: '#d4af37', margin: '5px 0', textTransform: 'uppercase' }}>CAMPEÓN DEL TORNEO</h4>
                        <img src={winner.logo_url} alt="logo" style={{ width: '60px', height: '60px', objectFit: 'contain', margin: '10px' }} />
                        <div style={{ fontSize: '22px', color: '#fff', fontWeight: '900' }}>{winner.name}</div>
                    </div>
                )}
                <div style={{ background: '#0f172a', padding: '10px 15px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#fff', border: '1px solid #334155' }}>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                        <img src={finalMatch.team_a_logo} style={{ width: '22px', height: '22px' }} alt="" />
                        <span style={{ fontSize: '12px', fontWeight: '800', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{finalMatch.team_a_name}</span>
                    </div>
                    <div style={{ flex: '0 0 80px', textAlign: 'center', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', padding: '2px' }}>
                        <div style={{ fontSize: '18px', fontWeight: '900' }}>{finalMatch.team_a_goals} - {finalMatch.team_b_goals}</div>
                        <div style={{ fontSize: '8px', color: '#d4af37' }}>FINAL</div>
                    </div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', minWidth: 0 }}>
                        <span style={{ fontSize: '12px', fontWeight: '800', textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{finalMatch.team_b_name}</span>
                        <img src={finalMatch.team_b_logo} style={{ width: '22px', height: '22px' }} alt="" />
                    </div>
                </div>
            </div>
        );
    };

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando...</div>;

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '15px' }}>
            <FinalModule />
            
            {/* LISTADO DE PARTIDOS */}
            <h4 style={{ color: '#1e293b', borderBottom: '1px solid #ddd', paddingBottom: '8px' }}>PARTIDOS</h4>
            {matches.map(m => (
                <div key={m.id} 
                     onClick={() => setExpandedMatchId(expandedMatchId === m.id ? null : m.id)}
                     style={{ background: '#fff', padding: '12px', borderRadius: '8px', marginBottom: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ flex: 1, fontSize: '13px', fontWeight: '600' }}>{m.team_a_name}</div>
                        <div style={{ background: '#f1f5f9', padding: '4px 10px', borderRadius: '4px', fontWeight: 'bold' }}>{m.team_a_goals} - {m.team_b_goals}</div>
                        <div style={{ flex: 1, textAlign: 'right', fontSize: '13px', fontWeight: '600' }}>{m.team_b_name}</div>
                    </div>

                    {/* DETALLE DE GOLEADORES (Al expandir) */}
                    {expandedMatchId === m.id && isAdmin && (
                        <div style={{ marginTop: '15px', borderTop: '1px dashed #eee', paddingTop: '10px' }}>
                            <p style={{ fontSize: '11px', color: '#666' }}>Gestionar Goles:</p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px' }}>
                                {/* Goles Equipo A */}
                                <div style={{ flex: 1 }}>
                                    {players.filter(p => p.team_id === m.team_a_id).map(p => (
                                        <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                            <span style={{ fontSize: '11px' }}>{p.name} ({allGoals.filter(g => g.player_id === p.id && g.match_id === m.id).length})</span>
                                            <div>
                                                <button onClick={(e) => handleGoal(e, m.id, p.id, m.team_a_id, 'team_a_goals', 'add')}>+</button>
                                                <button onClick={(e) => handleGoal(e, m.id, p.id, m.team_a_id, 'team_a_goals', 'remove')}>-</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {/* Goles Equipo B */}
                                <div style={{ flex: 1 }}>
                                    {players.filter(p => p.team_id === m.team_b_id).map(p => (
                                        <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                            <span style={{ fontSize: '11px' }}>{p.name} ({allGoals.filter(g => g.player_id === p.id && g.match_id === m.id).length})</span>
                                            <div>
                                                <button onClick={(e) => handleGoal(e, m.id, p.id, m.team_b_id, 'team_b_goals', 'add')}>+</button>
                                                <button onClick={(e) => handleGoal(e, m.id, p.id, m.team_b_id, 'team_b_goals', 'remove')}>-</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default TournamentView;
