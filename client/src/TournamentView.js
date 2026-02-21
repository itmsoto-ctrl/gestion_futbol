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
    const [editingMatch, setEditingMatch] = useState(null);
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

    const standingsList = useMemo(() => {
        let table = {};
        teams.forEach(t => { table[t.id] = { id: t.id, name: t.name, logo: t.logo_url, pts: 0, gf: 0, gc: 0, pj: 0 }; });
        matches.forEach(m => {
            const isMain = tournamentInfo?.type === 'liga' ? m.phase.toLowerCase().includes('liga') : m.phase.toLowerCase().includes('grupo');
            if (m.played && isMain) {
                const tA = table[m.team_a_id]; const tB = table[m.team_b_id];
                if (tA && tB) {
                    tA.pj++; tB.pj++; tA.gf += m.team_a_goals; tA.gc += m.team_b_goals;
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
    const getWinner = (m) => (m?.team_a_goals > m?.team_b_goals ? {name: m.team_a_name} : {name: m.team_b_name});
    const getGoalsInMatch = (pId, mId) => allGoals.filter(g => g.player_id === pId && g.match_id === mId).length;

    const addGoal = async (mId, pId, tId, side) => {
        await axios.post(`${API_URL}/add-player-goal`, { match_id: mId, player_id: pId, team_id: tId, team_side: side });
        loadData();
    };

    const removeGoal = async (mId, pId, tId, side) => {
        try { await axios.post(`${API_URL}/remove-player-goal`, { match_id: mId, player_id: pId, team_id: tId, team_side: side }); loadData(); } catch (e) {}
    };

    const MatchCard = ({ m }) => {
        const isExpanded = expandedMatchId === m.id;
        return (
            <div onClick={() => isAdmin && setExpandedMatchId(isExpanded ? null : m.id)}
                 style={{ border: '1px solid #ddd', borderRadius: '15px', background: 'white', marginBottom: '15px', overflow:'hidden', boxShadow:'0 3px 6px rgba(0,0,0,0.05)' }}>
                <div style={{ background: '#f8f9fa', padding: '10px 15px', fontSize: '10px', color: '#666', display:'flex', justifyContent:'space-between' }}>
                    <span>📅 {m.match_date ? m.match_date.split(' ')[0] : 'S/F'} | 🕒 {m.match_date ? m.match_date.split(' ')[1]?.slice(0,5) : '--:--'}</span>
                    <span>🏟️ C{m.field} | 👤 {m.referee}</span>
                </div>
                <div style={{ display: 'flex', padding: '15px 5px 10px 5px', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{ flex: '1 1 35%', textAlign: 'center' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '12px' }}>{m.team_a_name}</div>
                        {isExpanded && isAdmin && players.filter(p => p.team_id === m.team_a_id).map(p => {
                            const goals = getGoalsInMatch(p.id, m.id);
                            return (
                                <div key={p.id} style={{marginBottom:10, display:'flex', alignItems:'center', justifyContent:'center'}}>
                                    <button onClick={(e) => { e.stopPropagation(); addGoal(m.id, p.id, m.team_a_id, 'team_a_goals'); }} 
                                            style={{padding:'14px 4px', width:'85%', fontSize:12, fontWeight:'bold', borderRadius:10, background: goals > 0 ? '#ffc107' : '#f0f4ff', border: '1px solid #ccd'}}>
                                        ⚽ {p.name} {goals > 0 ? `(${goals})` : ''}
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); removeGoal(m.id, p.id, m.team_a_id, 'team_a_goals'); }} style={{color:'red', background:'none', border:'none', fontSize:25, marginLeft:8}}>×</button>
                                </div>
                            );
                        })}
                    </div>
                    <div style={{ flex: '0 0 28%', textAlign: 'center', fontSize: 24, fontWeight: 'bold', paddingTop: 10 }}>{m.team_a_goals} - {m.team_b_goals}</div>
                    <div style={{ flex: '1 1 35%', textAlign: 'center' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '12px' }}>{m.team_b_name}</div>
                        {isExpanded && isAdmin && players.filter(p => p.team_id === m.team_b_id).map(p => {
                            const goals = getGoalsInMatch(p.id, m.id);
                            return (
                                <div key={p.id} style={{marginBottom:10, display:'flex', alignItems:'center', justifyContent:'center'}}>
                                    <button onClick={(e) => { e.stopPropagation(); removeGoal(m.id, p.id, m.team_b_id, 'team_b_goals'); }} style={{color:'red', background:'none', border:'none', fontSize:25, marginRight:8}}>×</button>
                                    <button onClick={(e) => { e.stopPropagation(); addGoal(m.id, p.id, m.team_b_id, 'team_b_goals'); }} 
                                            style={{padding:'14px 4px', width:'85%', fontSize:12, fontWeight:'bold', borderRadius:10, background: goals > 0 ? '#ffc107' : '#fff0f0', border: '1px solid #dcc'}}>
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

    if (loading) return <div style={{ padding: '100px 0', textAlign: 'center' }}>Cargando v3.0...</div>;

    const qMatches = matches.filter(m => m.phase.toLowerCase().includes('cuarto'));
    const sMatches = matches.filter(m => m.phase.toLowerCase().includes('semi'));
    const fMatches = matches.filter(m => m.phase.toLowerCase().includes('final'));

    return (
        <div style={{ padding: '0 0 50px 0', fontFamily: 'Arial', maxWidth: '600px', margin: 'auto', background: '#f8f9fa', minHeight: '100vh' }}>
            {/* CABECERA */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#000', padding: '15px 20px', color: 'white', position: 'sticky', top: 0, zIndex: 1000 }}>
                <button onClick={() => navigate('/dashboard')} style={{ background: 'none', color: 'white', border: 'none', fontSize:'20px' }}>←</button>
                <div style={{textAlign:'center'}}><div style={{fontSize:'14px', fontWeight:'bold'}}>{tournamentInfo?.name}</div></div>
                <button onClick={() => setShowTable(!showTable)} style={{ background: '#007bff', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '8px', fontSize: '12px', fontWeight:'bold' }}>{showTable ? '⚽' : '📊'}</button>
            </div>

            <div style={{ padding: '15px' }}>
                {!showTable && tournamentInfo?.type === 'campeonato' && (
                    <div style={{ background: '#fff', padding: '15px', borderRadius: '15px', marginBottom: '30px', border: '1px solid #eee', boxShadow:'0 4px 10px rgba(0,0,0,0.05)' }}>
                        <h4 style={{ textAlign: 'center', margin: '0 0 10px 0', fontSize: 11 }}>🏆 CUADRO DE ELIMINATORIAS</h4>
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
                            <div style={{ flex: 0.8, display:'flex', alignItems:'center' }}><div style={{ height:'60px', width:'100%', background:'#fff3cd', border:'2px solid #ffeeba', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10 }}>🏆</div></div>
                        </div>
                    </div>
                )}

                {showTable ? (
                    <div style={{ background: 'white', padding: '15px', borderRadius: '15px' }}>
                        <h3>📊 Clasificación</h3>
                        <table width="100%" style={{ fontSize: '13px' }}>
                            <thead><tr style={{textAlign:'left', color:'#888'}}><th>POS</th><th>EQUIPO</th><th>PTS</th><th>GF</th></tr></thead>
                            <tbody>{standingsList.map((t, i) => (
                                <tr key={t.id} style={{ borderBottom: '1px solid #f8f9fa' }}><td style={{padding:'15px 0'}}>{i + 1}</td><td>{t.name}</td><td style={{fontWeight:'bold', color:'#007bff'}}>{t.pts}</td><td>{t.gf}</td></tr>
                            ))}</tbody>
                        </table>
                    </div>
                ) : (
                    <div>
                        <div style={{ background: '#333', color: 'white', padding: '10px', borderRadius: '8px', fontSize: '12px', marginBottom: '15px', textAlign:'center', fontWeight:'bold' }}>PARTIDOS</div>
                        {matches.map(m => <MatchCard key={m.id} m={m} />)}
                    </div>
                )}
                
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