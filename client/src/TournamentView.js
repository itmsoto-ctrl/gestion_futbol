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
            setMatches(resM.data || []); setTeams(resT.data || []); setPlayers(resP.data || []);
            setStats(resS.data || { goleadores: [], porteros: [] });
            setTournamentInfo(resTourneys.data.find(t => t.id === parseInt(id)));
            setLoading(false);
        } catch (error) { console.error(error); setLoading(false); }
    }, [id, API_URL]);

    useEffect(() => { loadData(); }, [loadData]);

    const standings = useMemo(() => {
        let table = {};
        teams.forEach(t => { table[t.id] = { id: t.id, name: t.name, logo: t.logo_url, pts: 0, gf: 0, gc: 0, pj: 0 }; });
        matches.forEach(m => {
            const ph = m.phase?.toLowerCase() || '';
            if (m.played && (ph.includes('grupo') || ph.includes('liga'))) {
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

    const getTeamByRank = (rank) => standings[rank - 1] || { name: `${rank}º Clasif.`, id: null };
    const getWinnerId = (m) => (!m || m.team_a_goals === m.team_b_goals) ? null : (m.team_a_goals > m.team_b_goals ? m.team_a_id : m.team_b_id);
    const getWinnerName = (m) => (!m || !m.played) ? '???' : (m.team_a_goals > m.team_b_goals ? m.team_a_name : m.team_b_name);

    const handleGoal = async (e, mId, pId, tId, side, action) => {
        e.stopPropagation();
        const url = action === 'add' ? '/add-player-goal' : '/remove-player-goal';
        await axios.post(`${API_URL}${url}`, { match_id: mId, player_id: pId, team_id: tId, team_side: side });
        loadData();
    };

    const activatePhase = async (phase, pairings) => {
        if (window.prompt(`Código para activar ${phase}:`) !== "0209") return alert("Error");
        await axios.post(`${API_URL}/activate-phase/${id}`, { phase, pairings });
        loadData();
    };

    const MatchCard = ({ m }) => {
        const isExp = expandedMatchId === m.id;
        const isFin = m.played === 1;
        const dateStr = m.match_date ? m.match_date.replace('T', ' ') : "";
        const displayDate = dateStr ? `${parseInt(dateStr.split(' ')[0].split('-')[2])}/${parseInt(dateStr.split(' ')[0].split('-')[1])} ${dateStr.split(' ')[1].slice(0,5)}` : "S/F";

        return (
            <div onClick={() => isAdmin && setExpandedMatchId(isExp ? null : m.id)}
                 style={{ border: '1px solid #ddd', borderRadius: '15px', background: isFin ? '#e8f5e9' : 'white', marginBottom: '15px', overflow:'hidden', boxShadow:'0 3px 6px rgba(0,0,0,0.05)', cursor: isAdmin ? 'pointer' : 'default' }}>
                <div style={{ background: isFin ? '#c8e6c9' : '#f8f9fa', padding: '12px 15px', fontSize: '13px', borderBottom: '1px solid #eee', display:'flex', justifyContent:'space-between', fontWeight:'bold' }}>
                    <span>📅 {displayDate}</span>
                    <span>🏟️ C{m.field} {m.referee && `| 👤 ${m.referee}`}</span>
                </div>
                <div style={{ display: 'flex', padding: '15px 5px', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{ flex: '1 1 35%', textAlign: 'center' }}>
                        <img src={m.team_a_logo || 'https://via.placeholder.com/40'} width="40" height="40" style={{borderRadius:'50%', objectFit:'cover'}} alt="logo" />
                        <div style={{ fontWeight: 'bold', fontSize: '12px', margin:'5px 0' }}>{m.team_a_name}</div>
                        {isExp && isAdmin && !isFin && players.filter(p => p.team_id === m.team_a_id).map(p => (
                            <button key={p.id} onClick={(e) => handleGoal(e, m.id, p.id, m.team_a_id, 'team_a_goals', 'add')} style={{padding:'12px 4px', width:'95%', fontSize:12, fontWeight:'bold', borderRadius:10, background:'#f0f4ff', marginBottom:8, border:'1px solid #ccd'}}>⚽ {p.name}</button>
                        ))}
                    </div>
                    <div style={{ flex: '0 0 28%', textAlign: 'center', paddingTop: '10px' }}>
                        <div style={{ fontSize: '30px', fontWeight: '900' }}>{m.team_a_goals} - {m.team_b_goals}</div>
                        {isExp && isAdmin && (
                            <button onClick={(e) => { e.stopPropagation(); isFin ? setEditingMatch({...m}) : axios.put(`${API_URL}/matches/${m.id}`, {...m, played:1}).then(()=>loadData()); }} style={{marginTop:20, padding:'10px 15px', background: isFin ? '#ffc107' : '#28a745', color: isFin ? '#000' : '#fff', border:'none', borderRadius:10, fontSize:12, fontWeight:'bold', width:'100%'}}>
                                {isFin ? '✏️ EDITAR' : '✅ FINALIZAR'}
                            </button>
                        )}
                    </div>
                    <div style={{ flex: '1 1 35%', textAlign: 'center' }}>
                        <img src={m.team_b_logo || 'https://via.placeholder.com/40'} width="40" height="40" style={{borderRadius:'50%', objectFit:'cover'}} alt="logo" />
                        <div style={{ fontWeight: 'bold', fontSize: '12px', margin:'5px 0' }}>{m.team_b_name}</div>
                        {isExp && isAdmin && !isFin && players.filter(p => p.team_id === m.team_b_id).map(p => (
                            <button key={p.id} onClick={(e) => handleGoal(e, m.id, p.id, m.team_b_id, 'team_b_goals', 'add')} style={{padding:'12px 4px', width:'95%', fontSize:12, fontWeight:'bold', borderRadius:10, background:'#f0f4ff', marginBottom:8, border:'1px solid #ccd'}}>{p.name} ⚽</button>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const qM = matches.filter(m => m.phase.toLowerCase().includes('cuarto'));
    const sM = matches.filter(m => m.phase.toLowerCase().includes('semifinal'));
    const fM = matches.filter(m => m.phase.toLowerCase().includes('final'));
    const allGPlayed = matches.filter(m=>m.phase.toLowerCase().includes('grupo')).length > 0 && matches.filter(m=>m.phase.toLowerCase().includes('grupo')).every(m=>m.played);

    if (loading) return <div style={{ padding: '100px 0', textAlign: 'center' }}>Cargando v3.8.3...</div>;

    return (
        <div style={{ padding: '0 0 50px 0', fontFamily: 'Arial', maxWidth: '600px', margin: 'auto', background: '#f8f9fa', minHeight: '100vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#000', padding: '15px 20px', color: 'white', position: 'sticky', top: 0, zIndex: 1000 }}>
                <button onClick={() => navigate('/dashboard')} style={{ background: 'none', color: 'white', border: 'none', fontSize:'24px' }}>←</button>
                <div style={{textAlign:'center'}}><div style={{fontSize:'14px', fontWeight:'bold'}}>{tournamentInfo?.name}</div></div>
                <button onClick={() => setShowTable(!showTable)} style={{ background: '#007bff', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '8px', fontSize: '12px', fontWeight:'bold' }}>{showTable ? '⚽' : '📊'}</button>
            </div>

            <div style={{ padding: '15px' }}>
                {!showTable && tournamentInfo?.type === 'campeonato' && teams.length === 8 && (
                    <div style={{ background: '#fff', padding: '15px', borderRadius: '15px', marginBottom: '30px', border: '1px solid #eee', boxShadow:'0 4px 10px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '5px' }}>
                            <div style={{ flex: 1.2 }}>
                                {[ [1,8], [2,7], [3,6], [4,5] ].map((pair, i) => (
                                    <div key={i} style={{ background: '#f8f9fa', marginBottom: '5px', padding: '5px', borderRadius: '5px', border: '1px solid #eee', fontSize: '9px' }}>
                                        <div style={{display:'flex', justifyContent:'space-between', color: qM[i] ? '#000' : '#007bff'}}><span>{qM[i] ? qM[i].team_a_name : getTeamByRank(pair[0]).name}</span><b>{qM[i]?.team_a_goals ?? ''}</b></div>
                                        <div style={{display:'flex', justifyContent:'space-between', color: qM[i] ? '#000' : '#007bff', borderTop:'1px solid #fff'}}><span>{qM[i] ? qM[i].team_b_name : getTeamByRank(pair[1]).name}</span><b>{qM[i]?.team_b_goals ?? ''}</b></div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ flex: 1, display:'flex', flexDirection:'column', justifyContent:'space-around', fontSize:8, textAlign:'center', color:'#999' }}>
                                {[0,1].map(i => (<div key={i} style={{border:'1px dashed #ccc', padding:5, borderRadius:5}}><div>{sM[i] ? sM[i].team_a_name : 'Winner'}</div><div>{sM[i] ? sM[i].team_b_name : 'Winner'}</div></div>))}
                            </div>
                            <div style={{ flex: 0.8, display:'flex', alignItems:'center' }}>
                                <div style={{ height:'60px', width:'100%', background:'#fff3cd', border:'2px solid #ffeeba', borderRadius:'8px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontSize:8, textAlign:'center' }}>
                                    <b>{fM[0] ? fM[0].team_a_name : 'Finalista 1'}</b>
                                    <div style={{fontSize:12, fontWeight:900}}>vs</div>
                                    <b>{fM[0] ? fM[0].team_b_name : 'Finalista 2'}</b>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {!showTable ? (
                    <div>
                        {isAdmin && (
                            <div style={{marginBottom:20}}>
                                {allGPlayed && qM.length === 0 && <button onClick={() => activatePhase('cuartos', [{a: getTeamByRank(1).id, b: getTeamByRank(8).id, field: 1}, {a: getTeamByRank(2).id, b: getTeamByRank(7).id, field: 2}, {a: getTeamByRank(3).id, b: getTeamByRank(6).id, field: 1}, {a: getTeamByRank(4).id, b: getTeamByRank(5).id, field: 2}])} style={{width:'100%', padding:15, background:'#28a745', color:'#fff', border:'none', borderRadius:10, fontWeight:'bold'}}>⚡ ACTIVAR CUARTOS</button>}
                                {qM.length === 4 && qM.every(m=>m.played) && sM.length === 0 && <button onClick={() => activatePhase('semifinal', [{a: getWinnerId(qM[0]), b: getWinnerId(qM[3]), field: 1}, {a: getWinnerId(qM[1]), b: getWinnerId(qM[2]), field: 2}])} style={{width:'100%', padding:15, background:'#28a745', color:'#fff', border:'none', borderRadius:10, fontWeight:'bold'}}>⚡ ACTIVAR SEMIFINALES</button>}
                                {sM.length === 2 && sM.every(m=>m.played) && fM.length === 0 && <button onClick={() => activatePhase('final', [{a: getWinnerId(sM[0]), b: getWinnerId(sM[1]), field: 1}])} style={{width:'100%', padding:15, background:'#28a745', color:'#fff', border:'none', borderRadius:10, fontWeight:'bold'}}>⚡ ACTIVAR GRAN FINAL</button>}
                            </div>
                        )}
                        {matches.map(m => <MatchCard key={m.id} m={m} />)}
                    </div>
                ) : (
                    <div style={{ background: 'white', padding: '15px', borderRadius: '15px' }}>
                        <table width="100%" style={{ fontSize: '13px' }}>
                            <thead><tr style={{textAlign:'left', color:'#888'}}><th>POS</th><th>EQUIPO</th><th>PTS</th><th>GF</th></tr></thead>
                            <tbody>{standings.map((t, i) => (
                                <tr key={t.id} style={{ borderBottom: '1px solid #f8f9fa' }}><td style={{padding:'15px 0'}}>{i + 1}</td><td>{t.name}</td><td style={{fontWeight:'bold', color:'#007bff'}}>{t.pts}</td><td>{t.gf}</td></tr>
                            ))}</tbody>
                        </table>
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