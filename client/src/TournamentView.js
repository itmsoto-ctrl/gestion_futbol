import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const TournamentView = ({ user }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [matches, setMatches] = useState([]);
    const [teams, setTeams] = useState([]);
    const [players, setPlayers] = useState([]);
    const [allGoals, setAllGoals] = useState([]);
    const [stats, setStats] = useState({ goleadores: [], porteros: [] });
    const [tournamentInfo, setTournamentInfo] = useState(null);
    const [showTable, setShowTable] = useState(false);
    const [loading, setLoading] = useState(true);
    const [expandedMatchId, setExpandedMatchId] = useState(null);

    const isAdmin = user?.role === 'admin';
    const API_URL = "https://gestionfutbol-production.up.railway.app";

    const loadData = useCallback(async () => {
        try {
            const [resM, resT, resP, resS, resG, resTourneys] = await Promise.all([
                axios.get(`${API_URL}/matches/${id}`),
                axios.get(`${API_URL}/teams/${id}`),
                axios.get(`${API_URL}/players/${id}`),
                axios.get(`${API_URL}/stats/${id}`),
                axios.get(`${API_URL}/goals/${id}`),
                axios.get(`${API_URL}/tournaments`)
            ]);
            setMatches(resM.data || []);
            setTeams(resT.data || []);
            setPlayers(resP.data || []);
            setStats(resS.data || { goleadores: [], porteros: [] });
            setAllGoals(resG.data || []);
            setTournamentInfo(resTourneys.data.find(t => t.id === parseInt(id)));
            setLoading(false);
        } catch (error) { console.error(error); setLoading(false); }
    }, [id, API_URL]);

    useEffect(() => { loadData(); }, [loadData]);

    // --- LÓGICA DE AUTO-FINALIZADO (VERDE) ---
    // Buscamos la fecha del último partido que tiene goles registrados
    const latestPlayedDate = useMemo(() => {
        const played = matches.filter(m => m.played);
        if (played.length === 0) return null;
        return new Date(Math.max(...played.map(m => new Date(m.match_date))));
    }, [matches]);

    const standingsList = useMemo(() => {
        let table = {};
        teams.forEach(t => { table[t.id] = { id: t.id, name: t.name, logo: t.logo_url, pts: 0, gf: 0, gc: 0, pj: 0 }; });
        matches.forEach(m => {
            const isMain = tournamentInfo?.type === 'liga' ? m.phase.toLowerCase().includes('liga') : m.phase.toLowerCase().includes('grupo');
            if (m.played && isMain) {
                const tA = table[m.team_a_id]; const tB = table[m.team_b_id];
                if (tA && tB) {
                    tA.pj++; tB.pj++;
                    tA.gf += m.team_a_goals; tA.gc += m.team_b_goals;
                    tB.gf += m.team_b_goals; tB.gc += m.team_a_goals;
                    if (m.team_a_goals > m.team_b_goals) tA.pts += 2;
                    else if (m.team_a_goals < m.team_b_goals) tB.pts += 2;
                    else { tA.pts += 1; tB.pts += 1; }
                }
            }
        });
        return Object.values(table).sort((a, b) => b.pts - a.pts || (b.gf - b.gc) - (a.gf - a.gc));
    }, [matches, teams, tournamentInfo]);

    const getTeamByRank = (rank) => standingsList[rank - 1] || { name: `${rank}º Clasif.`, id: null };
    const getWinnerId = (m) => (m?.team_a_goals > m?.team_b_goals ? m.team_a_id : m?.team_b_id);
    const getGoalsInMatch = (pId, mId) => allGoals.filter(g => g.player_id === pId && g.match_id === mId).length;

    // --- ACCIONES ---
    const addGoal = async (mId, pId, tId, side) => {
        await axios.post(`${API_URL}/add-player-goal`, { match_id: mId, player_id: pId, team_id: tId, team_side: side });
        loadData();
    };
    const removeGoal = async (mId, pId, tId, side) => {
        try { await axios.post(`${API_URL}/remove-player-goal`, { match_id: mId, player_id: pId, team_id: tId, team_side: side }); loadData(); } catch (e) {}
    };
    const activatePhase = async (phase, pairings) => {
        if (!window.confirm(`¿Confirmas que la fase anterior ha terminado? Se fijarán los cruces ahora.`)) return;
        await axios.post(`${API_URL}/activate-phase/${id}`, { phase, pairings });
        loadData();
    };

    // --- RENDERIZADO DE PARTIDO ---
    const MatchCard = ({ m }) => {
        const isExpanded = expandedMatchId === m.id;
        const matchDate = new Date(m.match_date);
        // Si el partido es anterior o igual al último jugado, se pone en verde
        const isFinished = latestPlayedDate && matchDate <= latestPlayedDate && !isExpanded;

        return (
            <div onClick={() => isAdmin && setExpandedMatchId(isExpanded ? null : m.id)}
                 style={{ border: '1px solid #ddd', borderRadius: '15px', background: isFinished ? '#d4edda' : 'white', marginBottom: '15px', overflow:'hidden', boxShadow:'0 3px 6px rgba(0,0,0,0.05)', cursor: isAdmin ? 'pointer' : 'default' }}>
                <div style={{ background: isFinished ? '#c3e6cb' : '#f1f3f5', padding: '12px 15px', fontSize: '13px', color: '#333', borderBottom: '1px solid #eee', display:'flex', justifyContent:'space-between', fontWeight:'bold' }}>
                    <span>📅 {matchDate.toLocaleDateString([], {day:'2-digit', month:'2-digit'})} {matchDate.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                    <span>🏟️ Campo {m.field} {m.referee ? `| 👤 ${m.referee}` : ''}</span>
                </div>
                <div style={{ display: 'flex', padding: '15px 5px', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{ flex: '1 1 35%', textAlign: 'center' }}>
                        <img src={m.team_a_logo || 'https://via.placeholder.com/40'} width="45" height="45" style={{borderRadius:'50%', objectFit:'cover', border:'1px solid #eee'}} alt="logo" />
                        <div style={{ fontWeight: 'bold', fontSize: '14px', margin:'8px 0' }}>{m.team_a_name}</div>
                        {isExpanded && isAdmin && players.filter(p => p.team_id === m.team_a_id).map(p => {
                            const goals = getGoalsInMatch(p.id, m.id);
                            return (
                                <div key={p.id} style={{marginBottom:10, display:'flex', alignItems:'center', justifyContent:'center'}}>
                                    <button onClick={(e) => { e.stopPropagation(); addGoal(m.id, p.id, m.team_a_id, 'team_a_goals'); }} 
                                            style={{padding:'15px 5px', width:'85%', fontSize:13, fontWeight:'bold', borderRadius:12, background: goals > 0 ? '#ffc107' : '#f8f9fa', border: '1px solid #ccd'}}>
                                        ⚽ {p.name} {goals > 0 ? `(${goals})` : ''}
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); removeGoal(m.id, p.id, m.team_a_id, 'team_a_goals'); }} style={{color:'red', background:'none', border:'none', fontSize:25, marginLeft:8}}>×</button>
                                </div>
                            );
                        })}
                    </div>
                    <div style={{ flex: '0 0 28%', textAlign: 'center', paddingTop: '15px' }}>
                        <div style={{ fontSize: '30px', fontWeight: '900', whiteSpace: 'nowrap' }}>{m.team_a_goals} - {m.team_b_goals}</div>
                        {isExpanded && <button onClick={(e) => { e.stopPropagation(); setExpandedMatchId(null); }} style={{marginTop:20, fontSize:11, background:'#333', color:'#fff', border:'none', padding:'8px 15px', borderRadius:8}}>CERRAR 🔼</button>}
                    </div>
                    <div style={{ flex: '1 1 35%', textAlign: 'center' }}>
                        <img src={m.team_b_logo || 'https://via.placeholder.com/40'} width="45" height="45" style={{borderRadius:'50%', objectFit:'cover', border:'1px solid #eee'}} alt="logo" />
                        <div style={{ fontWeight: 'bold', fontSize: '14px', margin:'8px 0' }}>{m.team_b_name}</div>
                        {isExpanded && isAdmin && players.filter(p => p.team_id === m.team_b_id).map(p => {
                            const goals = getGoalsInMatch(p.id, m.id);
                            return (
                                <div key={p.id} style={{marginBottom:10, display:'flex', alignItems:'center', justifyContent:'center'}}>
                                    <button onClick={(e) => { e.stopPropagation(); removeGoal(m.id, p.id, m.team_b_id, 'team_b_goals'); }} style={{color:'red', background:'none', border:'none', fontSize:25, marginRight:8}}>×</button>
                                    <button onClick={(e) => { e.stopPropagation(); addGoal(m.id, p.id, m.team_b_id, 'team_b_goals'); }} 
                                            style={{padding:'15px 5px', width:'85%', fontSize:13, fontWeight:'bold', borderRadius:12, background: goals > 0 ? '#ffc107' : '#f8f9fa', border: '1px solid #ccd'}}>
                                        {p.name} {goals > 0 ? `(${goals})` : ''} ⚽
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    if (loading) return <div style={{ padding: '100px 0', textAlign: 'center' }}>Iniciando v3.1...</div>;

    const qMatches = matches.filter(m => m.phase.includes('cuarto'));
    const sMatches = matches.filter(m => m.phase.includes('semi'));
    const fMatches = matches.filter(m => m.phase.includes('final'));
    const gMatches = matches.filter(m => m.phase.includes('grupo') || m.phase.includes('liga'));

    return (
        <div style={{ padding: '0 0 50px 0', fontFamily: 'Arial', maxWidth: '600px', margin: 'auto', background: '#f8f9fa', minHeight: '100vh' }}>
            {/* CABECERA */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#000', padding: '15px 20px', color: 'white', position: 'sticky', top: 0, zIndex: 1000 }}>
                <button onClick={() => navigate('/dashboard')} style={{ background: 'none', color: 'white', border: 'none', fontSize:'20px' }}>←</button>
                <div style={{textAlign:'center'}}><div style={{fontSize:'14px', fontWeight:'bold'}}>{tournamentInfo?.name}</div></div>
                <button onClick={() => setShowTable(!showTable)} style={{ background: '#007bff', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '8px', fontWeight:'bold' }}>{showTable ? '⚽' : '📊'}</button>
            </div>

            <div style={{ padding: '15px' }}>
                {/* 1. CUADRO DINÁMICO */}
                {!showTable && tournamentInfo?.type === 'campeonato' && teams.length === 8 && (
                    <div style={{ background: '#fff', padding: '15px', borderRadius: '15px', marginBottom: '30px', border: '1px solid #eee', boxShadow:'0 4px 10px rgba(0,0,0,0.05)' }}>
                        <h4 style={{ textAlign: 'center', margin: '0 0 10px 0', fontSize: '11px', color: '#666' }}>🏆 CUADRO PROYECTADO</h4>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '5px' }}>
                            <div style={{ flex: 1.2 }}>
                                {[ [1,8], [2,7], [3,6], [4,5] ].map((pair, i) => (
                                    <div key={i} style={{ background: '#f8f9fa', marginBottom: '5px', padding: '5px', borderRadius: '5px', border: '1px solid #eee', fontSize: '9px' }}>
                                        <div style={{display:'flex', justifyContent:'space-between'}}><span>{qMatches[i] ? qMatches[i].team_a_name : getTeamByRank(pair[0]).name}</span><b>{qMatches[i]?.team_a_goals ?? ''}</b></div>
                                        <div style={{display:'flex', justifyContent:'space-between', borderTop:'1px solid #fff'}}><span>{qMatches[i] ? qMatches[i].team_b_name : getTeamByRank(pair[1]).name}</span><b>{qMatches[i]?.team_b_goals ?? ''}</b></div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ flex: 1, display:'flex', flexDirection:'column', justifyContent:'space-around', fontSize:8, textAlign:'center', color:'#999' }}>
                                {[0,1].map(i => (<div key={i} style={{border:'1px dashed #ccc', padding:5, borderRadius:5}}><div>{sMatches[i] ? sMatches[i].team_a_name : 'Winner'}</div><div>{sMatches[i] ? sMatches[i].team_b_name : 'Winner'}</div></div>))}
                            </div>
                            <div style={{ flex: 0.8, display:'flex', alignItems:'center' }}><div style={{ height:'60px', width:'100%', background:'#fff3cd', border:'2px solid #ffeeba', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px' }}>🏆</div></div>
                        </div>
                    </div>
                )}

                {showTable ? (
                    <div style={{ background: 'white', padding: '15px', borderRadius: '15px' }}>
                        <table width="100%" style={{ fontSize: '13px' }}>
                            <thead><tr style={{textAlign:'left', color:'#888'}}><th>POS</th><th>EQUIPO</th><th>PTS</th><th>GF</th></tr></thead>
                            <tbody>{standingsList.map((t, i) => (
                                <tr key={t.id} style={{ borderBottom: '1px solid #f8f9fa' }}>
                                    <td style={{padding:'15px 0'}}>{i + 1}</td>
                                    <td style={{display:'flex', alignItems:'center', gap:8}}><img src={t.logo || 'https://via.placeholder.com/20'} width="20" height="20" style={{borderRadius:'50%'}} /> {t.name}</td>
                                    <td style={{fontWeight:'bold', color:'#007bff'}}>{t.pts}</td><td>{t.gf}</td>
                                </tr>
                            ))}</tbody>
                        </table>
                    </div>
                ) : (
                    <div>
                        <div style={{ background: '#333', color: 'white', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '15px', textAlign:'center', fontWeight:'bold' }}>1. FASE DE GRUPOS / LIGA</div>
                        {gMatches.map(m => <MatchCard key={m.id} m={m} />)}

                        <div style={{ background: '#007bff', color: 'white', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '15px', marginTop:40, textAlign:'center', fontWeight:'bold' }}>2. CUARTOS DE FINAL</div>
                        {qMatches.length > 0 ? qMatches.map(m => <MatchCard key={m.id} m={m} />) : 
                            isAdmin && standingsList.length === 8 && <button onClick={() => activatePhase('cuartos', [{a: standingsList[0].id, b: standingsList[7].id, field: 1}, {a: standingsList[1].id, b: standingsList[6].id, field: 2}, {a: standingsList[2].id, b: standingsList[5].id, field: 1}, {a: standingsList[3].id, b: standingsList[4].id, field: 2}])} style={{width:'100%', padding:18, background:'#28a745', color:'#fff', border:'none', borderRadius:12, fontWeight:'bold', fontSize:16}}>⚡ ACTIVAR CUARTOS</button>
                        }

                        <div style={{ background: '#198754', color: 'white', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '15px', marginTop:40, textAlign:'center', fontWeight:'bold' }}>3. SEMIFINALES</div>
                        {sMatches.length > 0 ? sMatches.map(m => <MatchCard key={m.id} m={m} />) : 
                            isAdmin && qMatches.length === 4 && qMatches.every(m => m.played) && <button onClick={() => activatePhase('semifinal', [{a: getWinnerId(qMatches[0]), b: getWinnerId(qMatches[3]), field: 1}, {a: getWinnerId(qMatches[1]), b: getWinnerId(qMatches[2]), field: 2}])} style={{width:'100%', padding:18, background:'#28a745', color:'#fff', border:'none', borderRadius:12, fontWeight:'bold', fontSize:16}}>⚡ ACTIVAR SEMIFINALES</button>
                        }

                        <div style={{ background: '#ffc107', color: 'black', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '15px', marginTop:40, textAlign:'center', fontWeight:'bold' }}>4. GRAN FINAL</div>
                        {fMatches.length > 0 ? fMatches.map(m => <MatchCard key={m.id} m={m} />) : 
                            isAdmin && sMatches.length === 2 && sMatches.every(m => m.played) && <button onClick={() => activatePhase('final', [{a: getWinnerId(sMatches[0]), b: getWinnerId(sMatches[1]), field: 1}])} style={{width:'100%', padding:18, background:'#28a745', color:'#fff', border:'none', borderRadius:12, fontWeight:'bold', fontSize:16}}>⚡ ACTIVAR FINAL</button>
                        }
                    </div>
                )}
                
                {/* ESTADÍSTICAS */}
                <div style={{ marginTop: '50px', background: 'white', padding: '20px', borderRadius: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                    <h4 style={{margin: '0 0 15px 0'}}>🏆 Goleadores (Pichichi)</h4>
                    {stats.goleadores.map((g, i) => <div key={i} style={{fontSize:13, padding:'10px 0', borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between'}}><span>{i+1}. {g.name} ({g.team_name})</span><b>{g.total_goals} ⚽</b></div>)}
                    <h4 style={{margin: '30px 0 15px 0'}}>🧤 Zamora</h4>
                    {stats.porteros.map((p, i) => <div key={i} style={{fontSize:13, padding:'10px 0', borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between'}}><span>{i+1}. {p.name} ({p.team_name})</span><b style={{color:'red'}}>{p.goals_against} 🥅</b></div>)}
                </div>
            </div>
        </div>
    );
};
export default TournamentView;