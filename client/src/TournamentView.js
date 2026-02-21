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
    const [tournamentInfo, setTournamentInfo] = useState(null);
    const [showTable, setShowTable] = useState(false);
    const [editingMatch, setEditingMatch] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expandedMatchId, setExpandedMatchId] = useState(null);

    const isAdmin = user?.role === 'admin';
    const API_URL = "https://gestionfutbol-production.up.railway.app";

    const loadData = useCallback(async () => {
        try {
            const [resM, resT, resP, resS, resTourneys] = await Promise.all([
                axios.get(`${API_URL}/matches/${id}`),
                axios.get(`${API_URL}/teams/${id}`),
                axios.get(`${API_URL}/players/${id}`),
                axios.get(`${API_URL}/stats/${id}`),
                axios.get(`${API_URL}/tournaments`)
            ]);
            setMatches(resM.data || []);
            setTeams(resT.data || []);
            setPlayers(resP.data || []);
            setStats(resS.data || { goleadores: [], porteros: [] });
            setTournamentInfo(resTourneys.data.find(t => t.id === parseInt(id)));
            setLoading(false);
        } catch (error) { console.error(error); setLoading(false); }
    }, [id]);

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

    const getTeamByRank = (rank) => standingsList[rank - 1] || { name: `${rank}º...`, id: null };
    const getWinnerId = (m) => (m?.team_a_goals > m?.team_b_goals ? m.team_a_id : m?.team_b_id);

    const formatTime = (str) => str ? str.split(' ')[1]?.slice(0, 5) : '--:--';
    const formatDate = (str) => {
        if (!str) return 'S/F';
        const d = str.split(' ')[0].split('-');
        return `${d[2]}/${d[1]}`;
    };

    const addGoal = async (mId, pId, tId, side) => {
        await axios.post(`${API_URL}/add-player-goal`, { match_id: mId, player_id: pId, team_id: tId, team_side: side });
        loadData();
    };

    const finalizeMatch = async (m) => {
        if (!window.confirm("¿Finalizar partido? Se bloqueará el marcador.")) return;
        await axios.put(`${API_URL}/matches/${m.id}`, { ...m, played: 1 });
        setExpandedMatchId(null);
        loadData();
    };

    const activatePhase = async (phase, pairings) => {
        const code = window.prompt("Introduce el código de seguridad para activar fase:");
        if (code !== "0209") return alert("Código incorrecto");
        await axios.post(`${API_URL}/activate-phase/${id}`, { phase, pairings });
        loadData();
    };

    const handleSaveMatch = async (m) => {
        await axios.put(`${API_URL}/matches/${m.id}`, m);
        setEditingMatch(null);
        loadData();
    };

    const MatchCard = ({ m }) => {
        const isExpanded = expandedMatchId === m.id;
        const canManage = isAdmin && !m.played;
        return (
            <div onClick={() => isAdmin && setExpandedMatchId(isExpanded ? null : m.id)}
                 style={{ border: '1px solid #ddd', borderRadius: '15px', background: m.played ? '#d4edda' : 'white', marginBottom: '15px', overflow:'hidden', boxShadow:'0 3px 6px rgba(0,0,0,0.05)' }}>
                <div style={{ background: m.played ? '#c3e6cb' : '#f8f9fa', padding: '12px', fontSize: '13px', display:'flex', justifyContent:'space-between', fontWeight:'bold' }}>
                    <span>📅 {formatDate(m.match_date)} {formatTime(m.match_date)}</span>
                    <span>🏟️ C{m.field} | 👤 {m.referee || 'S/A'}</span>
                </div>
                <div style={{ display: 'flex', padding: '15px 5px', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{ flex: '1 1 35%', textAlign: 'center' }}>
                        <img src={m.team_a_logo || 'https://via.placeholder.com/40'} width="40" height="40" style={{borderRadius:'50%', objectFit:'cover'}} alt="logo" />
                        <div style={{ fontWeight: 'bold', fontSize: '13px', margin:'5px 0' }}>{m.team_a_name}</div>
                        {isExpanded && canManage && players.filter(p => p.team_id === m.team_a_id).map(p => (
                            <button key={p.id} onClick={(e) => { e.stopPropagation(); addGoal(m.id, p.id, m.team_a_id, 'team_a_goals'); }} style={{padding:'12px 4px', width:'95%', fontSize:12, marginBottom:5, borderRadius:8, background:'#f0f4ff'}}>⚽ {p.name}</button>
                        ))}
                    </div>
                    <div style={{ flex: '0 0 28%', textAlign: 'center', paddingTop: '10px' }}>
                        <div style={{ fontSize: '28px', fontWeight: '900' }}>{m.team_a_goals} - {m.team_b_goals}</div>
                        {isExpanded && isAdmin && (
                            <>
                                {!m.played ? <button onClick={(e) => { e.stopPropagation(); finalizeMatch(m); }} style={{marginTop:15, padding:8, background:'green', color:'#fff', border:'none', borderRadius:5, fontSize:10}}>FINALIZAR</button>
                                : <button onClick={(e) => { e.stopPropagation(); setEditingMatch({...m}); }} style={{marginTop:15, padding:8, background:'#ffc107', border:'none', borderRadius:5, fontSize:10}}>EDITAR</button>}
                            </>
                        )}
                    </div>
                    <div style={{ flex: '1 1 35%', textAlign: 'center' }}>
                        <img src={m.team_b_logo || 'https://via.placeholder.com/40'} width="40" height="40" style={{borderRadius:'50%', objectFit:'cover'}} alt="logo" />
                        <div style={{ fontWeight: 'bold', fontSize: '13px', margin:'5px 0' }}>{m.team_b_name}</div>
                        {isExpanded && canManage && players.filter(p => p.team_id === m.team_b_id).map(p => (
                            <button key={p.id} onClick={(e) => { e.stopPropagation(); addGoal(m.id, p.id, m.team_b_id, 'team_b_goals'); }} style={{padding:'12px 4px', width:'95%', fontSize:12, marginBottom:5, borderRadius:8, background:'#fff0f0'}}>{p.name} ⚽</button>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    if (loading) return <div style={{ padding: '100px 0', textAlign: 'center' }}>Cargando v3.2...</div>;

    const qMatches = matches.filter(m => m.phase.toLowerCase().includes('cuarto'));
    const sMatches = matches.filter(m => m.phase.toLowerCase().includes('semi'));
    const fMatches = matches.filter(m => m.phase.toLowerCase().includes('final'));

    return (
        <div style={{ padding: '0 0 50px 0', fontFamily: 'Arial', maxWidth: '600px', margin: 'auto', background: '#f8f9fa', minHeight: '100vh' }}>
            {/* CABECERA */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#000', padding: '15px 20px', color: 'white', position: 'sticky', top: 0, zIndex: 1000 }}>
                <button onClick={() => navigate('/dashboard')} style={{ background: 'none', color: 'white', border: 'none', fontSize:'24px' }}>←</button>
                <div style={{textAlign:'center'}}><div style={{fontSize:'14px', fontWeight:'bold'}}>{tournamentInfo?.name}</div></div>
                <button onClick={() => setShowTable(!showTable)} style={{ background: '#007bff', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '8px', fontSize: '12px', fontWeight:'bold' }}>{showTable ? '⚽' : '📊'}</button>
            </div>

            <div style={{ padding: '15px' }}>
                {!showTable && tournamentInfo?.type === 'campeonato' && (
                    <div style={{ background: '#fff', padding: '15px', borderRadius: '15px', marginBottom: '30px', border: '1px solid #eee' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '5px' }}>
                            <div style={{ flex: 1.2 }}>
                                {[ [1,8], [2,7], [3,6], [4,5] ].map((pair, i) => {
                                    const teamA = qMatches[i] ? {name: qMatches[i].team_a_name} : getTeamByRank(pair[0]);
                                    const teamB = qMatches[i] ? {name: qMatches[i].team_b_name} : getTeamByRank(pair[1]);
                                    return (
                                        <div key={i} style={{ background: '#f8f9fa', marginBottom: '5px', padding: '5px', borderRadius: '5px', border: '1px solid #eee', fontSize: '9px' }}>
                                            <div style={{display:'flex', justifyContent:'space-between'}}><span>{teamA.name}</span><b>{qMatches[i]?.team_a_goals ?? ''}</b></div>
                                            <div style={{display:'flex', justifyContent:'space-between', borderTop:'1px solid #fff'}}><span>{teamB.name}</span><b>{qMatches[i]?.team_b_goals ?? ''}</b></div>
                                        </div>
                                    );
                                })}
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
                        <div style={{ background: '#333', color: 'white', padding: '10px', borderRadius: '8px', fontSize: '12px', marginBottom: '15px', textAlign:'center', fontWeight:'bold' }}>1. FASE DE GRUPOS / LIGA</div>
                        {matches.filter(m => m.phase.includes('grupo') || m.phase.includes('liga')).map(m => <MatchCard key={m.id} m={m} />)}
                        
                        {isAdmin && matches.filter(m => m.phase.includes('grupo')).every(m => m.played) && qMatches.length === 0 && <button onClick={() => activatePhase('cuartos', [{a: standingsList[0].id, b: standingsList[7].id, field: 1}, {a: standingsList[1].id, b: standingsList[6].id, field: 2}, {a: standingsList[2].id, b: standingsList[5].id, field: 1}, {a: standingsList[3].id, b: standingsList[4].id, field: 2}])} style={{width:'100%', padding:15, background:'#28a745', color:'#fff', border:'none', borderRadius:10, fontWeight:'bold', marginBottom:20}}>⚡ ACTIVAR CUARTOS</button>}
                        
                        {qMatches.length > 0 && <div style={{ background: '#007bff', color: 'white', padding: '10px', borderRadius: '8px', fontSize: '12px', marginBottom: '15px', textAlign:'center', fontWeight:'bold', marginTop:30 }}>2. CUARTOS DE FINAL</div>}
                        {qMatches.map(m => <MatchCard key={m.id} m={m} />)}

                        {isAdmin && qMatches.length === 4 && qMatches.every(m => m.played) && sMatches.length === 0 && <button onClick={() => activatePhase('semifinal', [{a: getWinnerId(qMatches[0]), b: getWinnerId(qMatches[3]), field: 1}, {a: getWinnerId(qMatches[1]), b: getWinnerId(qMatches[2]), field: 2}])} style={{width:'100%', padding:15, background:'#28a745', color:'#fff', border:'none', borderRadius:10, fontWeight:'bold', marginBottom:20}}>⚡ ACTIVAR SEMIFINALES</button>}
                        
                        {sMatches.length > 0 && <div style={{ background: '#198754', color: 'white', padding: '10px', borderRadius: '8px', fontSize: '12px', marginBottom: '15px', textAlign:'center', fontWeight:'bold', marginTop:30 }}>3. SEMIFINALES</div>}
                        {sMatches.map(m => <MatchCard key={m.id} m={m} />)}

                        {isAdmin && sMatches.length === 2 && sMatches.every(m => m.played) && fMatches.length === 0 && <button onClick={() => activatePhase('final', [{a: getWinnerId(sMatches[0]), b: getWinnerId(sMatches[1]), field: 1}])} style={{width:'100%', padding:15, background:'#28a745', color:'#fff', border:'none', borderRadius:10, fontWeight:'bold', marginBottom:20}}>⚡ ACTIVAR GRAN FINAL</button>}
                        
                        {fMatches.length > 0 && <div style={{ background: '#ffc107', color: 'black', padding: '10px', borderRadius: '8px', fontSize: '12px', marginBottom: '15px', textAlign:'center', fontWeight:'bold', marginTop:30 }}>4. GRAN FINAL</div>}
                        {fMatches.map(m => <MatchCard key={m.id} m={m} />)}
                    </div>
                )}
                
                <div style={{ marginTop: '50px', background: 'white', padding: '20px', borderRadius: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                    <h4 style={{margin: '0 0 15px 0'}}>🏆 Máximos Goleadores</h4>
                    {stats.goleadores.map((g, i) => <div key={i} style={{fontSize:13, padding:'10px 0', borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between'}}><span>{i+1}. {g.name} ({g.team_name})</span><b>{g.total_goals} ⚽</b></div>)}
                </div>
            </div>

            {editingMatch && (
                <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.85)', zIndex:2000, padding:20, display:'flex', alignItems:'center'}}>
                    <div style={{background:'#fff', width:'100%', padding:20, borderRadius:15}}>
                        <h4 style={{marginTop:0}}>Editar Partido (v3.2)</h4>
                        <input type="datetime-local" value={editingMatch.match_date?.replace(' ', 'T').slice(0, 16)} onChange={e => setEditingMatch({...editingMatch, match_date: e.target.value})} style={{width:'100%', padding:12, marginBottom:15, borderRadius:8, border:'1px solid #ccc'}} />
                        <input placeholder="Árbitro" value={editingMatch.referee} onChange={e => setEditingMatch({...editingMatch, referee: e.target.value})} style={{width:'100%', padding:12, marginBottom:15, borderRadius:8, border:'1px solid #ccc'}} />
                        <div style={{display:'flex', gap:10}}><button onClick={() => handleSaveMatch(editingMatch)} style={{flex:1, padding:15, background:'green', color:'#fff', borderRadius:10, border:'none', fontWeight:'bold'}}>GUARDAR</button><button onClick={() => setEditingMatch(null)} style={{flex:1, padding:15, border:'none', background:'#eee', borderRadius:10}}>CERRAR</button></div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default TournamentView;