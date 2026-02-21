import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const TournamentView = ({ user }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [matches, setMatches] = useState([]);
    const [teams, setTeams] = useState([]);
    const [players, setPlayers] = useState([]);
    const [stats, setStats] = useState({ goleadores: [], porteros: [] });
    const [allGoals, setAllGoals] = useState([]);
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
    const getWinner = (m) => (m?.team_a_goals > m?.team_b_goals ? {name: m.team_a_name, id: m.team_a_id} : {name: m.team_b_name, id: m.team_b_id});
    const getGoalsInMatch = (pId, mId) => allGoals.filter(g => g.player_id === pId && g.match_id === mId).length;

    const addGoal = async (mId, pId, tId, side) => {
        await axios.post(`${API_URL}/add-player-goal`, { match_id: mId, player_id: pId, team_id: tId, team_side: side });
        loadData();
    };

    const finalizeMatch = async (m) => {
        if (!window.confirm("¿Finalizar partido?")) return;
        await axios.put(`${API_URL}/matches/${m.id}`, { ...m, played: 1 });
        setExpandedMatchId(null); loadData();
    };

    const activatePhase = async (phase, pairings) => {
        const code = window.prompt("Código de seguridad:");
        if (code !== "0209") return alert("Error");
        await axios.post(`${API_URL}/activate-phase/${id}`, { phase, pairings });
        loadData();
    };

    const handleSaveMatch = async (m) => {
        await axios.put(`${API_URL}/matches/${m.id}`, m);
        setEditingMatch(null); loadData();
    };

    const MatchCard = ({ m }) => {
        const isExpanded = expandedMatchId === m.id;
        const canEdit = isAdmin && !m.played;
        return (
            <div onClick={() => isAdmin && setExpandedMatchId(isExpanded ? null : m.id)}
                 style={{ border: '1px solid #ddd', borderRadius: '15px', background: m.played ? '#d4edda' : 'white', marginBottom: '15px', overflow:'hidden', boxShadow:'0 3px 6px rgba(0,0,0,0.05)', cursor: isAdmin ? 'pointer' : 'default' }}>
                <div style={{ background: m.played ? '#c3e6cb' : '#f8f9fa', padding: '12px 15px', fontSize: '13px', display:'flex', justifyContent:'space-between', fontWeight:'bold' }}>
                    <span>📅 {m.match_date ? m.match_date.split(' ')[0].split('-').reverse().join('/') : ''} {m.match_date ? m.match_date.split(' ')[1]?.slice(0,5) : ''}</span>
                    <span>🏟️ C{m.field} {m.referee && `| 👤 ${m.referee}`}</span>
                </div>
                <div style={{ display: 'flex', padding: '15px 5px', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{ flex: '1 1 35%', textAlign: 'center' }}>
                        <img src={m.team_a_logo || 'https://via.placeholder.com/40'} width="40" height="40" style={{borderRadius:'50%', objectFit:'cover'}} alt="logo" />
                        <div style={{ fontWeight: 'bold', fontSize: '12px', margin:'5px 0' }}>{m.team_a_name}</div>
                        {isExpanded && canEdit && players.filter(p => p.team_id === m.team_a_id).map(p => {
                            const goals = getGoalsInMatch(p.id, m.id);
                            return (
                                <button key={p.id} onClick={(e) => { e.stopPropagation(); addGoal(m.id, p.id, m.team_a_id, 'team_a_goals'); }} 
                                        style={{padding:'12px 4px', width:'100%', fontSize:12, marginTop:5, borderRadius:8, background: goals > 0 ? '#ffc107' : '#f0f4ff', fontWeight:'bold'}}>
                                    ⚽ {p.name} {goals > 0 ? `(${goals})` : ''}
                                </button>
                            );
                        })}
                    </div>
                    <div style={{ flex: '0 0 28%', textAlign: 'center', paddingTop: '10px' }}>
                        <div style={{ fontSize: '28px', fontWeight: '900' }}>{m.team_a_goals} - {m.team_b_goals}</div>
                        {isExpanded && isAdmin && (
                            <button onClick={(e) => { e.stopPropagation(); m.played ? setEditingMatch({...m}) : finalizeMatch(m); }} 
                                    style={{marginTop:15, padding:'8px 12px', background: m.played ? '#ffc107' : 'green', color: m.played ? '#000' : '#fff', border:'none', borderRadius:5, fontSize:10, fontWeight:'bold'}}>
                                {m.played ? '✏️ EDITAR' : '✅ FINALIZAR'}
                            </button>
                        )}
                    </div>
                    <div style={{ flex: '1 1 35%', textAlign: 'center' }}>
                        <img src={m.team_b_logo || 'https://via.placeholder.com/40'} width="40" height="40" style={{borderRadius:'50%', objectFit:'cover'}} alt="logo" />
                        <div style={{ fontWeight: 'bold', fontSize: '12px', margin:'5px 0' }}>{m.team_b_name}</div>
                        {isExpanded && canEdit && players.filter(p => p.team_id === m.team_b_id).map(p => {
                            const goals = getGoalsInMatch(p.id, m.id);
                            return (
                                <button key={p.id} onClick={(e) => { e.stopPropagation(); addGoal(m.id, p.id, m.team_b_id, 'team_b_goals'); }} 
                                        style={{padding:'12px 4px', width:'100%', fontSize:12, marginTop:5, borderRadius:8, background: goals > 0 ? '#ffc107' : '#fff0f0', fontWeight:'bold'}}>
                                    {p.name} {goals > 0 ? `(${goals})` : ''} ⚽
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    if (loading) return <div style={{ padding: '100px 0', textAlign: 'center' }}>Cargando v3.3...</div>;

    const qMatches = matches.filter(m => m.phase.toLowerCase().includes('cuarto'));
    const sMatches = matches.filter(m => m.phase.toLowerCase().includes('semi'));
    const fMatches = matches.filter(m => m.phase.toLowerCase().includes('final'));
    const gMatches = matches.filter(m => m.phase.toLowerCase().includes('grupo') || m.phase.toLowerCase().includes('liga'));

    return (
        <div style={{ padding: '0 0 50px 0', fontFamily: 'Arial', maxWidth: '600px', margin: 'auto', background: '#f8f9fa', minHeight: '100vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#000', padding: '15px 20px', color: 'white', position: 'sticky', top: 0, zIndex: 1000 }}>
                <button onClick={() => navigate('/dashboard')} style={{ background: 'none', color: 'white', border: 'none', fontSize:'20px' }}>←</button>
                <div style={{textAlign:'center'}}><div style={{fontSize:'14px', fontWeight:'bold'}}>{tournamentInfo?.name}</div></div>
                <button onClick={() => setShowTable(!showTable)} style={{ background: '#007bff', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '8px', fontSize: '12px', fontWeight:'bold' }}>{showTable ? '⚽' : '📊'}</button>
            </div>

            <div style={{ padding: '15px' }}>
                {!showTable && tournamentInfo?.type === 'campeonato' && teams.length === 8 && (
                    <div style={{ background: '#fff', padding: '15px', borderRadius: '15px', marginBottom: '30px', border: '1px solid #eee', boxShadow:'0 4px 10px rgba(0,0,0,0.05)' }}>
                        <h4 style={{ textAlign: 'center', margin: '0 0 10px 0', fontSize: '11px', color: '#666' }}>🏆 CUADRO DE ELIMINATORIAS</h4>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '5px' }}>
                            <div style={{ flex: 1.2 }}>
                                {[ [1,8], [2,7], [3,6], [4,5] ].map((pair, i) => (
                                    <div key={i} style={{ background: '#f8f9fa', marginBottom: '5px', padding: '5px', borderRadius: '5px', border: '1px solid #eee', fontSize: '9px' }}>
                                        <div style={{display:'flex', justifyContent:'space-between', color: qMatches[i] ? '#000' : '#007bff'}}><span>{qMatches[i] ? qMatches[i].team_a_name : getTeamByRank(pair[0]).name}</span><b>{qMatches[i]?.team_a_goals ?? ''}</b></div>
                                        <div style={{display:'flex', justifyContent:'space-between', borderTop:'1px solid #fff', color: qMatches[i] ? '#000' : '#007bff'}}><span>{qMatches[i] ? qMatches[i].team_b_name : getTeamByRank(pair[1]).name}</span><b>{qMatches[i]?.team_b_goals ?? ''}</b></div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ flex: 1, display:'flex', flexDirection:'column', justifyContent:'space-around', fontSize:8, textAlign:'center', color:'#999' }}>
                                {[0,1].map(i => (<div key={i} style={{border:'1px dashed #ccc', padding:5, borderRadius:5}}><div>{sMatches[i] ? sMatches[i].team_a_name : (qMatches[i*2] ? getWinner(qMatches[i*2]).name : 'Winner')}</div><div>{sMatches[i] ? sMatches[i].team_b_name : (qMatches[i*2+1] ? getWinner(qMatches[i*2+1]).name : 'Winner')}</div></div>))}
                            </div>
                            <div style={{ flex: 0.8, display:'flex', alignItems:'center' }}><div style={{ height:'60px', width:'100%', background:'#fff3cd', border:'2px solid #ffeeba', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>🏆</div></div>
                        </div>
                    </div>
                )}

                {showTable ? (
                    <div style={{ background: 'white', padding: '15px', borderRadius: '15px' }}>
                        <h3>📊 Clasificación</h3>
                        <table width="100%" style={{ fontSize: '13px' }}>
                            <thead><tr style={{textAlign:'left', color:'#888', borderBottom:'2px solid #eee'}}><th>POS</th><th>EQUIPO</th><th>PTS</th><th>GF</th></tr></thead>
                            <tbody>{standingsList.map((t, i) => (
                                <tr key={t.id} style={{ borderBottom: '1px solid #f8f9fa' }}><td style={{padding:'15px 0'}}>{i + 1}</td><td>{t.name}</td><td style={{fontWeight:'bold', color:'#007bff'}}>{t.pts}</td><td>{t.gf}</td></tr>
                            ))}</tbody>
                        </table>
                    </div>
                ) : (
                    <div>
                        {isAdmin && (
                            <div style={{marginBottom:20}}>
                                {gMatches.every(m => m.played) && qMatches.length === 0 && <button onClick={() => activatePhase('cuartos', [{a: standingsList[0].id, b: standingsList[7].id, field: 1}, {a: standingsList[1].id, b: standingsList[6].id, field: 2}, {a: standingsList[2].id, b: standingsList[5].id, field: 1}, {a: standingsList[3].id, b: standingsList[4].id, field: 2}])} style={{width:'100%', padding:15, background:'#28a745', color:'#fff', border:'none', borderRadius:10, fontWeight:'bold'}}>⚡ ACTIVAR CUARTOS</button>}
                                {qMatches.length === 4 && qMatches.every(m => m.played) && sMatches.length === 0 && <button onClick={() => activatePhase('semifinal', [{a: getWinner(qMatches[0]).id, b: getWinner(qMatches[3]).id, field: 1}, {a: getWinner(qMatches[1]).id, b: getWinner(qMatches[2]).id, field: 2}])} style={{width:'100%', padding:15, background:'#28a745', color:'#fff', border:'none', borderRadius:10, fontWeight:'bold'}}>⚡ ACTIVAR SEMIFINALES</button>}
                                {sMatches.length === 2 && sMatches.every(m => m.played) && fMatches.length === 0 && <button onClick={() => activatePhase('final', [{a: getWinner(sMatches[0]).id, b: getWinner(sMatches[1]).id, field: 1}])} style={{width:'100%', padding:15, background:'#28a745', color:'#fff', border:'none', borderRadius:10, fontWeight:'bold'}}>⚡ ACTIVAR GRAN FINAL</button>}
                            </div>
                        )}
                        <div style={{ background: '#333', color: 'white', padding: '10px', borderRadius: '8px', fontSize: '12px', marginBottom: '15px', textAlign:'center', fontWeight:'bold' }}>PARTIDOS</div>
                        {gMatches.map(m => <MatchCard key={m.id} m={m} />)}
                        {qMatches.map(m => <MatchCard key={m.id} m={m} />)}
                        {sMatches.map(m => <MatchCard key={m.id} m={m} />)}
                        {fMatches.map(m => <MatchCard key={m.id} m={m} />)}
                    </div>
                )}
                
                <div style={{ marginTop: '50px', background: 'white', padding: '20px', borderRadius: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                    <h4 style={{margin: '0 0 15px 0', borderLeft: '5px solid #ffc107', paddingLeft: 10}}>🏆 Pichichi</h4>
                    {stats.goleadores.map((g, i) => <div key={i} style={{fontSize:13, padding:'10px 0', borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between'}}><span>{i+1}. {g.name} ({g.team_name})</span><b>{g.total_goals} ⚽</b></div>)}
                    <h4 style={{margin: '30px 0 15px 0', borderLeft: '5px solid #0dcaf0', paddingLeft: 10}}>🧤 Zamora</h4>
                    {stats.porteros.map((p, i) => <div key={i} style={{fontSize:13, padding:'10px 0', borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between'}}><span>{i+1}. {p.name} ({p.team_name})</span><b style={{color:'red'}}>{p.goals_against} 🥅</b></div>)}
                </div>
            </div>

            {editingMatch && (
                <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.85)', zIndex:2000, padding:20, display:'flex', alignItems:'center'}}>
                    <div style={{background:'#fff', width:'100%', padding:20, borderRadius:15}}>
                        <h4 style={{marginTop:0}}>Editar Partido</h4>
                        <label style={{fontSize:11}}>Goles {editingMatch.team_a_name}:</label>
                        <input type="number" value={editingMatch.team_a_goals} onChange={e => setEditingMatch({...editingMatch, team_a_goals: parseInt(e.target.value)})} style={{width:'90%', padding:10, marginBottom:10}} />
                        <label style={{fontSize:11}}>Goles {editingMatch.team_b_name}:</label>
                        <input type="number" value={editingMatch.team_b_goals} onChange={e => setEditingMatch({...editingMatch, team_b_goals: parseInt(e.target.value)})} style={{width:'90%', padding:10, marginBottom:10}} />
                        <label style={{fontSize:11}}>Árbitro:</label>
                        <input value={editingMatch.referee} onChange={e => setEditingMatch({...editingMatch, referee: e.target.value})} style={{width:'90%', padding:10, marginBottom:10}} />
                        <button onClick={() => handleSaveMatch(editingMatch)} style={{width:'100%', padding:15, background:'green', color:'#fff', borderRadius:10, border:'none'}}>GUARDAR CAMBIOS</button>
                        <button onClick={() => setEditingMatch(null)} style={{width:'100%', marginTop:10}}>CERRAR</button>
                    </div>
                </div>
            )}
        </div>
    );
};
export default TournamentView;