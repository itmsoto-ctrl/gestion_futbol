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
    const [newPlayer, setNewPlayer] = useState({ name: '', team_id: '', is_goalkeeper: false });

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
        } catch (error) { console.error(error); }
    }, [id, API_URL]);

    useEffect(() => { loadData(); }, [loadData]);

    const standings = useMemo(() => {
        let table = {};
        teams.forEach(t => { table[t.id] = { id: t.id, name: t.name, logo: t.logo_url, pts: 0, gf: 0, gc: 0, pj: 0 }; });
        matches.forEach(m => {
            const isMain = tournamentInfo?.type === 'liga' ? m.phase.includes('liga') : m.phase.includes('grupo');
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

    const getWinner = (m) => (m?.team_a_goals > m?.team_b_goals ? {name: m.team_a_name, id: m.team_a_id} : {name: m.team_b_name, id: m.team_b_id});
    const getGoalsInMatch = (pId, mId) => allGoals.filter(g => g.player_id === pId && g.match_id === mId).length;

    const handleGoal = async (mId, pId, tId, side, action) => {
        const url = action === 'add' ? '/add-player-goal' : '/remove-player-goal';
        await axios.post(`${API_URL}${url}`, { match_id: mId, player_id: pId, team_id: tId, team_side: side });
        loadData();
    };

    const handleReset = async () => {
        if (window.prompt("Código RESET Maestro:") !== "0209") return alert("Incorrecto");
        await axios.post(`${API_URL}/reset-tournament/${id}`);
        window.location.reload();
    };

    const activatePhase = async (phase, pairings) => {
        if (window.prompt(`Activar ${phase} (Código):`) !== "0209") return alert("Error");
        await axios.post(`${API_URL}/activate-phase/${id}`, { phase, pairings });
        loadData();
    };

    const handleAddPlayer = async () => {
        if (!newPlayer.name || !newPlayer.team_id) return alert("Faltan datos");
        await axios.post(`${API_URL}/players`, newPlayer);
        setNewPlayer({ name: '', team_id: '', is_goalkeeper: false });
        loadData();
    };

    const MatchCard = ({ m }) => {
        const isExp = expandedMatchId === m.id;
        const isFinished = m.played === 1;
        return (
            <div onClick={() => isAdmin && setExpandedMatchId(isExp ? null : m.id)}
                 style={{ border: '1px solid #ddd', borderRadius: '15px', background: isFinished ? '#e8f5e9' : 'white', marginBottom: '15px', overflow:'hidden', boxShadow:'0 3px 6px rgba(0,0,0,0.05)', cursor: isAdmin ? 'pointer' : 'default' }}>
                <div style={{ background: isFinished ? '#c8e6c9' : '#f8f9fa', padding: '12px 15px', fontSize: '13px', borderBottom: '1px solid #eee', display:'flex', justifyContent:'space-between', fontWeight:'bold' }}>
                    <span>📅 {m.match_date ? m.match_date.split(' ')[0].split('-').reverse().join('/') : ''} {m.match_date ? m.match_date.split(' ')[1]?.slice(0,5) : ''}</span>
                    <span>🏟️ C{m.field} {m.referee && `| 👤 ${m.referee}`}</span>
                </div>
                <div style={{ display: 'flex', padding: '15px 5px', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{ flex: '1 1 35%', textAlign: 'center' }}>
                        <img src={m.team_a_logo || 'https://via.placeholder.com/40'} width="40" height="40" style={{borderRadius:'50%'}} />
                        <div style={{ fontWeight: 'bold', fontSize: '12px', margin:'5px 0' }}>{m.team_a_name}</div>
                        {isExp && isAdmin && players.filter(p => p.team_id === m.team_a_id).map(p => {
                            const g = getGoalsInMatch(p.id, m.id);
                            return (
                                <div key={p.id} style={{display:'flex', alignItems:'center', marginBottom:12}}>
                                    <button 
                                        disabled={isFinished}
                                        onClick={(e) => { e.stopPropagation(); handleGoal(m.id, p.id, m.team_a_id, 'team_a_goals', 'add'); }} 
                                        style={{padding:'16px 4px', flex:1, fontSize:13, fontWeight:'bold', borderRadius:10, background: g > 0 ? '#ffc107' : '#f0f4ff', opacity: isFinished ? 0.6 : 1}}>
                                        ⚽ {p.name} {g > 0 ? `(${g})` : ''}
                                    </button>
                                    {!isFinished && <button onClick={(e) => { e.stopPropagation(); handleGoal(m.id, p.id, m.team_a_id, 'team_a_goals', 'remove'); }} style={{marginLeft:8, color:'red', background:'none', border:'none', fontSize:30}}>×</button>}
                                </div>
                            );
                        })}
                    </div>
                    <div style={{ flex: '0 0 28%', textAlign: 'center', paddingTop: '10px' }}>
                        <div style={{ fontSize: '32px', fontWeight: '900' }}>{m.team_a_goals} - {m.team_b_goals}</div>
                        {isExp && isAdmin && (
                            <button onClick={(e) => { e.stopPropagation(); axios.put(`${API_URL}/matches/${m.id}`, {...m, played: isFinished ? 0 : 1}).then(()=>loadData()); }} 
                                    style={{marginTop:20, padding:'10px 15px', background: isFinished ? '#ffc107' : '#28a745', color: isFinished ? '#000' : '#fff', border:'none', borderRadius:10, fontSize:12, fontWeight:'bold'}}>
                                {isFinished ? '✏️ EDITAR' : '✅ FINALIZAR'}
                            </button>
                        )}
                    </div>
                    <div style={{ flex: '1 1 35%', textAlign: 'center' }}>
                        <img src={m.team_b_logo || 'https://via.placeholder.com/40'} width="40" height="40" style={{borderRadius:'50%'}} />
                        <div style={{ fontWeight: 'bold', fontSize: '12px', margin:'5px 0' }}>{m.team_b_name}</div>
                        {isExp && isAdmin && players.filter(p => p.team_id === m.team_b_id).map(p => {
                            const g = getGoalsInMatch(p.id, m.id);
                            return (
                                <div key={p.id} style={{display:'flex', alignItems:'center', marginBottom:12}}>
                                    {!isFinished && <button onClick={(e) => { e.stopPropagation(); handleGoal(m.id, p.id, m.team_b_id, 'team_b_goals', 'remove'); }} style={{marginRight:8, color:'red', border:'none', background:'none', fontSize:30}}>×</button>}
                                    <button 
                                        disabled={isFinished}
                                        onClick={(e) => { e.stopPropagation(); handleGoal(m.id, p.id, m.team_b_id, 'team_b_goals', 'add'); }} 
                                        style={{padding:'16px 4px', flex:1, fontSize:13, fontWeight:'bold', borderRadius:10, background: g > 0 ? '#ffc107' : '#fff0f0', opacity: isFinished ? 0.6 : 1}}>
                                        {p.name} {g > 0 ? `(${g})` : ''} ⚽
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    const qM = matches.filter(m => m.phase.toLowerCase().includes('cuarto'));
    const sM = matches.filter(m => m.phase.toLowerCase().includes('semi'));
    const fM = matches.filter(m => m.phase.toLowerCase().includes('final'));
    const allGPlayed = matches.filter(m=>m.phase==='grupo').length > 0 && matches.filter(m=>m.phase==='grupo').every(m=>m.played);

    if (loading) return <div style={{ padding: '100px 0', textAlign: 'center' }}>Cargando v3.5...</div>;

    return (
        <div style={{ padding: '0 0 50px 0', fontFamily: 'Arial', maxWidth: '600px', margin: 'auto', background: '#f8f9fa', minHeight: '100vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#000', padding: '15px 20px', color: 'white', position: 'sticky', top: 0, zIndex: 1000 }}>
                <button onClick={() => navigate('/dashboard')} style={{ background: 'none', color: 'white', border: 'none', fontSize:'20px' }}>←</button>
                <div style={{textAlign:'center'}}><div style={{fontSize:'14px', fontWeight:'bold'}}>{tournamentInfo?.name}</div></div>
                <div>
                    {isAdmin && <button onClick={handleReset} style={{background:'#dc3545', color:'#fff', border:'none', padding:'8px 12px', borderRadius:8, fontSize:11, marginRight:10, fontWeight:'bold'}}>RESET</button>}
                    <button onClick={() => setShowTable(!showTable)} style={{ background: '#007bff', color: 'white', border: 'none', padding: '8px 15px', borderRadius: 8, fontWeight:'bold' }}>{showTable ? '⚽' : '📊'}</button>
                </div>
            </div>

            <div style={{ padding: '15px' }}>
                {!showTable && tournamentInfo?.type === 'campeonato' && teams.length === 8 && (
                    <div style={{ background: '#fff', padding: '15px', borderRadius: '15px', marginBottom: '30px', border: '1px solid #eee', boxShadow:'0 4px 10px rgba(0,0,0,0.05)' }}>
                        <h4 style={{ textAlign: 'center', margin: '0 0 10px 0', fontSize: '11px', color: '#666' }}>🏆 CUADRO PROYECTADO (REAL-TIME)</h4>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '5px' }}>
                            <div style={{ flex: 1.2 }}>
                                {[ [1,8], [2,7], [3,6], [4,5] ].map((pair, i) => (
                                    <div key={i} style={{ background: '#f8f9fa', marginBottom: '5px', padding: '5px', borderRadius: '5px', border: '1px solid #eee', fontSize: '9px' }}>
                                        <div style={{display:'flex', justifyContent:'space-between', color: qM[i] ? '#000' : '#007bff'}}><span style={{maxWidth:60, overflow:'hidden', whiteSpace:'nowrap'}}>{qM[i] ? qM[i].team_a_name : (standings[pair[0]-1]?.name || pair[0]+'º')}</span><b>{qM[i]?.team_a_goals ?? ''}</b></div>
                                        <div style={{display:'flex', justifyContent:'space-between', color: qM[i] ? '#000' : '#007bff', borderTop:'1px solid #fff'}}><span style={{maxWidth:60, overflow:'hidden', whiteSpace:'nowrap'}}>{qM[i] ? qM[i].team_b_name : (standings[pair[1]-1]?.name || pair[1]+'º')}</span><b>{qM[i]?.team_b_goals ?? ''}</b></div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ flex: 1, display:'flex', flexDirection:'column', justifyContent:'space-around', fontSize:8, textAlign:'center', color:'#999' }}>
                                {[0,1].map(i => (<div key={i} style={{border:'1px dashed #ccc', padding:5, borderRadius:5}}><div>{sM[i] ? sM[i].team_a_name : (qM[i*2] ? getWinner(qM[i*2]).name : 'Winner')}</div><div>{sM[i] ? sM[i].team_b_name : (qM[i*2+1] ? getWinner(qM[i*2+1]).name : 'Winner')}</div></div>))}
                            </div>
                            <div style={{ flex: 0.8, display:'flex', alignItems:'center' }}><div style={{ height:'60px', width:'100%', background:'#fff3cd', border:'2px solid #ffeeba', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10 }}>🏆</div></div>
                        </div>
                    </div>
                )}

                {showTable ? (
                    <div style={{ background: 'white', padding: '15px', borderRadius: '15px' }}>
                        <h3>📊 Clasificación</h3>
                        <table width="100%" style={{ fontSize: '13px' }}>
                            <thead><tr style={{textAlign:'left', color:'#888', borderBottom:'2px solid #eee'}}><th>POS</th><th>EQUIPO</th><th>PTS</th><th>GF</th></tr></thead>
                            <tbody>{standings.map((t, i) => (
                                <tr key={t.id} style={{ borderBottom: '1px solid #f8f9fa' }}><td style={{padding:'15px 0'}}>{i + 1}</td><td>{t.name}</td><td style={{fontWeight:'bold', color:'#007bff'}}>{t.pts}</td><td>{t.gf}</td></tr>
                            ))}</tbody>
                        </table>
                    </div>
                ) : (
                    <div>
                        {isAdmin && (
                            <div style={{ background: '#e3f2fd', padding: '12px', borderRadius: '10px', marginBottom: '20px', fontSize: '12px', border:'1px solid #b2dbff' }}>
                                <b>Añadir Jugador: </b>
                                <input placeholder="Nombre" value={newPlayer.name} onChange={e => setNewPlayer({...newPlayer, name: e.target.value})} style={{width:'80px', padding:4}} />
                                <select value={newPlayer.team_id} onChange={e => setNewPlayer({...newPlayer, team_id: e.target.value})} style={{padding:4}}>
                                    <option value="">Equipo...</option>
                                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                                <button onClick={handleAddPlayer} style={{padding:'6px 12px'}}>OK</button>
                            </div>
                        )}

                        {isAdmin && (
                            <div style={{marginBottom:20}}>
                                {allGPlayed && qM.length === 0 && <button onClick={() => activatePhase('cuartos', [{a: standings[0].id, b: standings[7].id, field: 1}, {a: standings[1].id, b: standings[6].id, field: 2}, {a: standings[2].id, b: standings[5].id, field: 1}, {a: standings[3].id, b: standings[4].id, field: 2}])} style={{width:'100%', padding:15, background:'#28a745', color:'#fff', border:'none', borderRadius:10, fontWeight:'bold'}}>⚡ ACTIVAR CUARTOS</div>}
                                {qM.length === 4 && qM.every(m=>m.played) && sM.length === 0 && <button onClick={() => activatePhase('semifinal', [{a: getWinner(qM[0]).id, b: getWinner(qM[3]).id, field: 1}, {a: getWinner(qM[1]).id, b: getWinner(qM[2]).id, field: 2}])} style={{width:'100%', padding:15, background:'#28a745', color:'#fff', border:'none', borderRadius:10, fontWeight:'bold'}}>⚡ ACTIVAR SEMIFINALES</button>}
                                {sM.length === 2 && sM.every(m=>m.played) && fM.length === 0 && <button onClick={() => activatePhase('final', [{a: getWinner(sM[0]).id, b: getWinner(sM[1]).id, field: 1}])} style={{width:'100%', padding:15, background:'#28a745', color:'#fff', border:'none', borderRadius:10, fontWeight:'bold'}}>⚡ ACTIVAR GRAN FINAL</button>}
                            </div>
                        )}
                        <div style={{ background: '#333', color: 'white', padding: '10px', borderRadius: '8px', fontSize: '12px', marginBottom: '15px', textAlign:'center', fontWeight:'bold' }}>PARTIDOS</div>
                        {matches.map(m => <MatchCard key={m.id} m={m} />)}
                    </div>
                )}
                
                <div style={{ marginTop: '50px', background: 'white', padding: '20px', borderRadius: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                    <h4 style={{margin: '0 0 15px 0', borderLeft: '5px solid #ffc107', paddingLeft: 10}}>🏆 Pichichi</h4>
                    {stats.goleadores.map((g, i) => <div key={i} style={{fontSize:13, padding:'10px 0', borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between'}}><span>{i+1}. {g.name} ({g.team_name})</span><b>{g.total} ⚽</b></div>)}
                    <h4 style={{margin: '30px 0 15px 0', borderLeft: '5px solid #0dcaf0', paddingLeft: 10}}>🧤 Zamora</h4>
                    {stats.porteros.map((p, i) => <div key={i} style={{fontSize:13, padding:'10px 0', borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between'}}><span>{i+1}. {p.name} ({p.team_name})</span><b style={{color:'red'}}>{p.against} 🥅</b></div>)}
                </div>
            </div>
        </div>
    );
};
export default TournamentView;