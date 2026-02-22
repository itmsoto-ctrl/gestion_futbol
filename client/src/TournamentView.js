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
    const [showResetMenu, setShowResetMenu] = useState(false);
    const [showActivateMenu, setShowActivateMenu] = useState(false);
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
            setMatches(resM.data || []); setTeams(resT.data || []); setPlayers(resP.data || []);
            setStats(resS.data || { goleadores: [], porteros: [] }); setAllGoals(resG.data || []);
            setTournamentInfo(resTourneys.data.find(t => t.id === parseInt(id)));
            setLoading(false);
        } catch (error) { console.error(error); }
    }, [id, API_URL]);

    useEffect(() => { loadData(); }, [loadData]);

    const standings = useMemo(() => {
        let table = {};
        teams.forEach(t => { table[t.id] = { id: t.id, name: t.name, logo: t.logo_url, pts: 0, gf: 0, gc: 0, pj: 0 }; });
        matches.forEach(m => {
            const phase = m.phase.toLowerCase();
            if (m.played && (phase.includes('grupo') || phase.includes('liga'))) {
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

    const getTeamByRank = (rank) => standings[rank - 1] || { name: `${rank}º Clasif.`, id: null };
    const getWinner = (m) => (m?.team_a_goals > m?.team_b_goals ? {name: m.team_a_name, id: m.team_a_id} : {name: m.team_b_name, id: m.team_b_id});
    const getWinnerId = (m) => (m?.team_a_goals > m?.team_b_goals ? m.team_a_id : m?.team_b_id);
    const getGoalsInMatch = (pId, mId) => allGoals.filter(g => g.player_id === pId && g.match_id === mId).length;

    const handleAddPlayer = async () => {
        if (!newPlayer.name || !newPlayer.team_id) return alert("Faltan datos");
        await axios.post(`${API_URL}/players`, newPlayer);
        setNewPlayer({ name: '', team_id: '', is_goalkeeper: false });
        loadData();
    };

    const handleGoal = async (mId, pId, tId, side, action) => {
        const url = action === 'add' ? '/add-player-goal' : '/remove-player-goal';
        await axios.post(`${API_URL}${url}`, { match_id: mId, player_id: pId, team_id: tId, team_side: side });
        loadData();
    };

    const handleReset = async (target) => {
        if (window.prompt(`Código RESET ${target}:`) !== "0209") return alert("Código incorrecto");
        await axios.post(`${API_URL}/reset-tournament/${id}`, { target });
        window.location.reload();
    };

    const handleActivate = async (phase) => {
        if (window.prompt(`Código ACTIVAR ${phase}:`) !== "0209") return alert("Código incorrecto");
        let pairings = [];
        const qM = matches.filter(m => m.phase.toLowerCase().includes('cuarto'));
        const sM = matches.filter(m => m.phase.toLowerCase().includes('semifinal'));
        if (phase === 'cuartos') {
            pairings = [{a: standings[0].id, b: standings[7].id, field: 1}, {a: standings[1].id, b: standings[6].id, field: 2}, {a: standings[2].id, b: standings[5].id, field: 1}, {a: standings[3].id, b: standings[4].id, field: 2}];
        } else if (phase === 'semifinal') {
            pairings = [{a: getWinnerId(qM[0]), b: getWinnerId(qM[3]), field: 1}, {a: getWinnerId(qM[1]), b: getWinnerId(qM[2]), field: 2}];
        } else if (phase === 'final') {
            pairings = [{a: getWinnerId(sM[0]), b: getWinnerId(sM[1]), field: 1}];
        }
        await axios.post(`${API_URL}/activate-phase/${id}`, { phase, pairings });
        loadData(); setShowActivateMenu(false);
    };

    const handleSaveMatch = async (m) => {
        await axios.put(`${API_URL}/matches/${m.id}`, {...m, played: 0});
        setEditingMatch(null); loadData();
    };

    const MatchCard = ({ m }) => {
        const isExp = expandedMatchId === m.id;
        const isFin = m.played === 1;
        return (
            <div onClick={() => isAdmin && setExpandedMatchId(isExp ? null : m.id)}
                 style={{ border: '1px solid #ddd', borderRadius: '15px', background: isFin ? '#e8f5e9' : 'white', marginBottom: '15px', overflow:'hidden', boxShadow:'0 3px 6px rgba(0,0,0,0.05)', cursor: isAdmin ? 'pointer' : 'default' }}>
                <div style={{ background: isFin ? '#c8e6c9' : '#f8f9fa', padding: '12px 15px', fontSize: '13px', borderBottom: '1px solid #eee', display:'flex', justifyContent:'space-between', fontWeight:'bold' }}>
                    <span>📅 {m.match_date ? m.match_date.split(' ')[0].split('-').reverse().join('/') : ''} {m.match_date ? m.match_date.split(' ')[1]?.slice(0,5) : ''}</span>
                    <span>🏟️ C{m.field} {m.referee && `| 👤 ${m.referee}`}</span>
                </div>
                <div style={{ display: 'flex', padding: '20px 5px 10px 5px', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{ flex: '1 1 35%', textAlign: 'center' }}>
                        <img src={m.team_a_logo || 'https://via.placeholder.com/40'} width="40" height="40" style={{borderRadius:'50%'}} alt="logo" />
                        <div style={{ fontWeight: 'bold', fontSize: '12px', margin:'5px 0' }}>{m.team_a_name}</div>
                        {isExp && isAdmin && !isFin && players.filter(p => p.team_id === m.team_a_id).map(p => {
                            const g = getGoalsInMatch(p.id, m.id);
                            return (
                                <div key={p.id} style={{display:'flex', alignItems:'center', marginBottom:12}}>
                                    <button onClick={(e) => { e.stopPropagation(); handleGoal(m.id, p.id, m.team_a_id, 'team_a_goals', 'add'); }} style={{padding:'16px 4px', flex:1, fontSize:13, fontWeight:'bold', borderRadius:10, background: g > 0 ? '#ffc107' : '#f0f4ff', border:'1px solid #ccd'}}>⚽ {p.name} {g > 0 ? `(${g})` : ''}</button>
                                    <button onClick={(e) => { e.stopPropagation(); handleGoal(m.id, p.id, m.team_a_id, 'team_a_goals', 'remove'); }} style={{marginLeft:8, color:'red', background:'none', border:'none', fontSize:30}}>×</button>
                                </div>
                            );
                        })}
                    </div>
                    <div style={{ flex: '0 0 28%', textAlign: 'center', paddingTop: '10px' }}>
                        <div style={{ fontSize: '32px', fontWeight: '900' }}>{m.team_a_goals} - {m.team_b_goals}</div>
                        {isExp && isAdmin && (
                            <button onClick={(e) => { e.stopPropagation(); isFin ? setEditingMatch({...m}) : axios.put(`${API_URL}/matches/${m.id}`, {...m, played:1}).then(()=>loadData()); }} style={{marginTop:20, padding:'10px 15px', background: isFin ? '#ffc107' : '#28a745', color: isFin ? '#000' : '#fff', border:'none', borderRadius:10, fontSize:12, fontWeight:'bold', width:'100%'}}>
                                {isFin ? '✏️ EDITAR' : '✅ FINALIZAR'}
                            </button>
                        )}
                    </div>
                    <div style={{ flex: '1 1 35%', textAlign: 'center' }}>
                        <img src={m.team_b_logo || 'https://via.placeholder.com/40'} width="40" height="40" style={{borderRadius:'50%'}} alt="logo" />
                        <div style={{ fontWeight: 'bold', fontSize: '12px', margin:'5px 0' }}>{m.team_b_name}</div>
                        {isExp && isAdmin && !isFin && players.filter(p => p.team_id === m.team_b_id).map(p => {
                            const g = getGoalsInMatch(p.id, m.id);
                            return (
                                <div key={p.id} style={{display:'flex', alignItems:'center', marginBottom:12}}>
                                    <button onClick={(e) => { e.stopPropagation(); handleGoal(m.id, p.id, m.team_b_id, 'team_b_goals', 'remove'); }} style={{marginRight:8, color:'red', border:'none', background:'none', fontSize:30}}>×</button>
                                    <button onClick={(e) => { e.stopPropagation(); handleGoal(m.id, p.id, m.team_b_id, 'team_b_goals', 'add'); }} style={{padding:'16px 4px', flex:1, fontSize:13, fontWeight:'bold', borderRadius:10, background: g > 0 ? '#ffc107' : '#f0f4ff'}}> {p.name} {g > 0 ? `(${g})` : ''} ⚽</button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    if (loading) return <div style={{ padding: '100px 0', textAlign: 'center' }}>v3.5.8 - Cargando...</div>;

    const qM = matches.filter(m => m.phase.toLowerCase().includes('cuarto'));
    const sM = matches.filter(m => m.phase.toLowerCase().includes('semifinal'));
    const fM = matches.filter(m => m.phase.toLowerCase().includes('final'));

    return (
        <div style={{ padding: '0 0 50px 0', fontFamily: 'Arial', maxWidth: '600px', margin: 'auto', background: '#f8f9fa', minHeight: '100vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#000', padding: '15px 20px', color: 'white', position: 'sticky', top: 0, zIndex: 1000 }}>
                <button onClick={() => navigate('/dashboard')} style={{ background: 'none', color: 'white', border: 'none', fontSize:'20px' }}>←</button>
                <div>
                    {isAdmin && <button onClick={() => setShowActivateMenu(!showActivateMenu)} style={{background:'#28a745', color:'#fff', border:'none', padding:'8px 12px', borderRadius:8, fontSize:11, marginRight:5, fontWeight:'bold'}}>ACTIVAR ⚡</button>}
                    {isAdmin && <button onClick={() => setShowResetMenu(!showResetMenu)} style={{background:'#dc3545', color:'#fff', border:'none', padding:'8px 12px', borderRadius:8, fontSize:11, marginRight:5, fontWeight:'bold'}}>RESET ⚙️</button>}
                </div>
                <button onClick={() => setShowTable(!showTable)} style={{ background: '#007bff', color: 'white', border: 'none', padding: '8px 15px', borderRadius: 8, fontWeight:'bold' }}>{showTable ? '⚽' : '📊'}</button>
            </div>

            {showResetMenu && (
                <div style={{ background: '#fff', padding: 15, borderBottom: '2px solid #dc3545', display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
                    <button onClick={() => handleReset('all')} style={{ padding: 10, background: '#dc3545', color: '#fff', borderRadius: 5, fontSize:10 }}>TODO</button>
                    <button onClick={() => handleReset('cuartos')} style={{ padding: 10, background: '#333', color: '#fff', borderRadius: 5, fontSize:10 }}>CUARTOS</button>
                    <button onClick={() => handleReset('semifinal')} style={{ padding: 10, background: '#333', color: '#fff', borderRadius: 5, fontSize:10 }}>SEMIS</button>
                    <button onClick={() => handleReset('final')} style={{ padding: 10, background: '#333', color: '#fff', borderRadius: 5, fontSize:10 }}>FINAL</button>
                </div>
            )}

            {showActivateMenu && (
                <div style={{ background: '#fff', padding: 15, borderBottom: '2px solid #28a745', display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
                    <button onClick={() => handleActivate('cuartos')} style={{ padding: 10, background: '#28a745', color: '#fff', borderRadius: 5, fontSize:10 }}>CUARTOS</button>
                    <button onClick={() => handleActivate('semifinal')} style={{ padding: 10, background: '#28a745', color: '#fff', borderRadius: 5, fontSize:10 }}>SEMIS</button>
                    <button onClick={() => handleActivate('final')} style={{ padding: 10, background: '#28a745', color: '#fff', borderRadius: 5, fontSize:10 }}>FINAL</button>
                </div>
            )}

            <div style={{ padding: '15px' }}>
                {!showTable && tournamentInfo?.type === 'campeonato' && teams.length === 8 && (
                    <div style={{ background: '#fff', padding: '15px', borderRadius: '15px', marginBottom: '30px', border: '1px solid #eee', boxShadow:'0 4px 10px rgba(0,0,0,0.05)' }}>
                        <h4 style={{ textAlign: 'center', margin: '0 0 10px 0', fontSize: '11px', color: '#666' }}>🏆 CUADRO DE PLAYOFFS</h4>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '5px' }}>
                            <div style={{ flex: 1.2 }}>
                                {[ [1,8], [2,7], [3,6], [4,5] ].map((pair, i) => (
                                    <div key={i} style={{ background: '#f8f9fa', marginBottom: '5px', padding: '5px', borderRadius: '5px', border: '1px solid #eee', fontSize: '9px' }}>
                                        <div style={{display:'flex', justifyContent:'space-between', color: qM[i] ? '#000' : '#007bff'}}><span style={{maxWidth:60, overflow:'hidden', whiteSpace:'nowrap'}}>{qM[i] ? qM[i].team_a_name : getTeamByRank(pair[0]).name}</span><b>{qM[i]?.team_a_goals ?? ''}</b></div>
                                        <div style={{display:'flex', justifyContent:'space-between', color: qM[i] ? '#000' : '#007bff', borderTop:'1px solid #fff'}}><span style={{maxWidth:60, overflow:'hidden', whiteSpace:'nowrap'}}>{qM[i] ? qM[i].team_b_name : getTeamByRank(pair[1]).name}</span><b>{qM[i]?.team_b_goals ?? ''}</b></div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ flex: 1, display:'flex', flexDirection:'column', justifyContent:'space-around', fontSize:8, textAlign:'center', color:'#999' }}>
                                {[0, 1].map(i => (<div key={i} style={{border:'1px dashed #ccc', padding:5, borderRadius:5}}><div>{sM[i] ? sM[i].team_a_name : getWinnerName(qM[i*2])}</div><div>{sM[i] ? sM[i].team_b_name : getWinnerName(qM[i*2+1])}</div></div>))}
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
                        {isAdmin && teams.length > 0 && (
                            <div style={{ background: '#e3f2fd', padding: '12px', borderRadius: '10px', marginBottom: '20px', fontSize: '12px', border:'1px solid #b2dbff' }}>
                                <b>Añadir Jugador: </b>
                                <input placeholder="Nombre" value={newPlayer.name} onChange={e => setNewPlayer({...newPlayer, name: e.target.value})} style={{width:'80px', padding:4}} />
                                <select value={newPlayer.team_id} onChange={e => setNewPlayer({...newPlayer, team_id: e.target.value})} style={{padding:4}}>
                                    <option value="">Equipo...</option>
                                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                                <button onClick={handleAddPlayer}>OK</button>
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

            {editingMatch && (
                <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.85)', zIndex:2000, padding:20, display:'flex', alignItems:'center'}}>
                    <div style={{background:'#fff', width:'100%', padding:20, borderRadius:15}}>
                        <h4 style={{marginTop:0}}>Edición Manual</h4>
                        <input type="number" value={editingMatch.team_a_goals} onChange={e => setEditingMatch({...editingMatch, team_a_goals: parseInt(e.target.value)})} style={{width:'90%', padding:15, marginBottom:10, fontSize:18}} />
                        <input type="number" value={editingMatch.team_b_goals} onChange={e => setEditingMatch({...editingMatch, team_b_goals: parseInt(e.target.value)})} style={{width:'90%', padding:15, marginBottom:10, fontSize:18}} />
                        <button onClick={() => { axios.put(`${API_URL}/matches/${editingMatch.id}`, {...editingMatch, played: 0}).then(()=> {setEditingMatch(null); loadData();}) }} style={{width:'100%', padding:15, background:'green', color:'#fff', borderRadius:10, border:'none', fontWeight:'bold'}}>DESBLOQUEAR Y GUARDAR</button>
                        <button onClick={() => setEditingMatch(null)} style={{width:'100%', padding:12, background:'#eee', border:'none', borderRadius:10, marginTop:10, width:'100%'}}>CANCELAR</button>
                    </div>
                </div>
            )}
        </div>
    );
};
export default TournamentView;