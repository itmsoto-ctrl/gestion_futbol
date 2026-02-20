import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const TournamentView = ({ user }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    // DATOS
    const [matches, setMatches] = useState([]);
    const [teams, setTeams] = useState([]);
    const [players, setPlayers] = useState([]);
    const [stats, setStats] = useState({ goleadores: [], porteros: [] });
    const [tournamentInfo, setTournamentInfo] = useState(null);

    // INTERFAZ
    const [showTable, setShowTable] = useState(false);
    const [editingMatch, setEditingMatch] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expandedMatchId, setExpandedMatchId] = useState(null);

    const isAdmin = user?.role === 'admin';
    const API_URL = "https://gestionfutbol-production.up.railway.app";

    useEffect(() => { loadData(); }, [id]);

    const loadData = async () => {
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
    };

    // --- LÓGICA DE CLASIFICACIÓN REAL-TIME ---
    const getStandings = () => {
        let table = {};
        teams.forEach(t => { table[t.id] = { id: t.id, name: t.name, logo: t.logo_url, pts: 0, gf: 0, gc: 0, pj: 0 }; });
        matches.forEach(m => {
            const isMain = tournamentInfo?.type === 'liga' ? m.phase === 'liga' : m.phase === 'grupo';
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
        return Object.values(table).sort((a, b) => b.pts - a.pts || (b.gf - b.gc) - (a.gf - a.gc) || b.gf - a.gf);
    };

    const standingsList = getStandings();
    const getTeamByRank = (rank) => standingsList[rank - 1] || { name: `${rank}º Clasif.`, id: null };
    const getWinner = (m) => (m?.team_a_goals > m?.team_b_goals ? {name: m.team_a_name, id: m.team_a_id} : {name: m.team_b_name, id: m.team_b_id});

    // --- ACCIONES ---
    const addGoal = async (mId, pId, tId, side) => {
        if (!isAdmin) return;
        await axios.post(`${API_URL}/add-player-goal`, { match_id: mId, player_id: pId, team_id: tId, team_side: side });
        loadData(); 
    };

    const removeGoal = async (mId, pId, tId, side) => {
        if (!isAdmin) return;
        try {
            await axios.post(`${API_URL}/remove-player-goal`, { match_id: mId, player_id: pId, team_id: tId, team_side: side });
            loadData();
        } catch (e) { alert("Error"); }
    };

    const activatePhase = async (phase, pairings) => {
        await axios.post(`${API_URL}/generate-playoffs-custom/${id}`, { phase, pairings });
        loadData();
    };

    const handleSaveMatch = async (m) => {
        await axios.put(`${API_URL}/matches/${m.id}`, m);
        setEditingMatch(null);
        loadData();
    };

    // --- COMPONENTE PARTIDO ---
    const MatchCard = ({ m }) => {
        const isExpanded = expandedMatchId === m.id;
        return (
            <div 
                onClick={() => isAdmin && setExpandedMatchId(isExpanded ? null : m.id)}
                style={{ border: '1px solid #ddd', borderRadius: '15px', background: 'white', marginBottom: '15px', overflow:'hidden', boxShadow:'0 3px 6px rgba(0,0,0,0.05)' }}
            >
                <div style={{ background: '#f1f3f5', padding: '10px 15px', fontSize: '11px', color: '#666', borderBottom: '1px solid #eee', display:'flex', justifyContent:'space-between' }}>
                    <span>📅 {m.match_date ? m.match_date.split(' ')[0] : 'S/F'} | 🕒 {m.match_date ? m.match_date.split(' ')[1]?.slice(0,5) : '--:--'}</span>
                    <span>🏟️ C{m.field} | 👤 {m.referee || 'S/A'}</span>
                </div>
                <div style={{ display: 'flex', padding: '15px 5px', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{ flex: '1 1 35%', textAlign: 'center' }}>
                        <img src={m.team_a_logo || 'https://via.placeholder.com/40'} width="40" height="40" style={{borderRadius:'50%', objectFit:'cover'}} alt="logo" />
                        <div style={{ fontWeight: 'bold', fontSize: '12px', margin:'5px 0' }}>{m.team_a_name}</div>
                        {isExpanded && isAdmin && players.filter(p => p.team_id === m.team_a_id).map(p => (
                            <div key={p.id} style={{marginBottom:10, display:'flex', alignItems:'center', justifyContent:'center'}}>
                                <button onClick={(e) => { e.stopPropagation(); addGoal(m.id, p.id, m.team_a_id, 'team_a_goals'); }} style={{padding:'14px 4px', width:'85%', fontSize:13, fontWeight:'bold', borderRadius:10, background:'#f0f4ff', border:'1px solid #ccd'}}>⚽ {p.name}</button>
                                <button onClick={(e) => { e.stopPropagation(); removeGoal(m.id, p.id, m.team_a_id, 'team_a_goals'); }} style={{color:'red', background:'none', border:'none', fontSize:25, marginLeft:8}}>×</button>
                            </div>
                        ))}
                    </div>
                    <div style={{ flex: '0 0 28%', textAlign: 'center', paddingTop: '5px' }}>
                        <div style={{ fontSize: '28px', fontWeight: '900', whiteSpace: 'nowrap' }}>{m.team_a_goals} - {m.team_b_goals}</div>
                        {isExpanded && <button onClick={(e) => { e.stopPropagation(); setEditingMatch({...m}); }} style={{fontSize:9, marginTop:15, background:'#eee', border:'none', padding:'6px 12px', borderRadius:4}}>✏️ EDITAR</button>}
                    </div>
                    <div style={{ flex: '1 1 35%', textAlign: 'center' }}>
                        <img src={m.team_b_logo || 'https://via.placeholder.com/40'} width="40" height="40" style={{borderRadius:'50%', objectFit:'cover'}} alt="logo" />
                        <div style={{ fontWeight: 'bold', fontSize: '12px', margin:'5px 0' }}>{m.team_b_name}</div>
                        {isExpanded && isAdmin && players.filter(p => p.team_id === m.team_b_id).map(p => (
                            <div key={p.id} style={{marginBottom:10, display:'flex', alignItems:'center', justifyContent:'center'}}>
                                <button onClick={(e) => { e.stopPropagation(); removeGoal(m.id, p.id, m.team_b_id, 'team_b_goals'); }} style={{color:'red', background:'none', border:'none', fontSize:25, marginRight:8}}>×</button>
                                <button onClick={(e) => { e.stopPropagation(); addGoal(m.id, p.id, m.team_b_id, 'team_b_goals'); }} style={{padding:'14px 4px', width:'85%', fontSize:13, fontWeight:'bold', borderRadius:10, background:'#fff0f0', border:'1px solid #dcc'}}>{p.name} ⚽</button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>Cargando Torneo...</div>;

    const qMatches = matches.filter(m => m.phase === 'cuartos');
    const sMatches = matches.filter(m => m.phase === 'semi');
    const fMatches = matches.filter(m => m.phase === 'final');
    const allGroupsPlayed = matches.filter(m => m.phase === 'grupo').length > 0 && matches.filter(m => m.phase === 'grupo').every(m => m.played);

    return (
        <div style={{ padding: '0 0 50px 0', fontFamily: 'Arial', maxWidth: '600px', margin: 'auto', background: '#f8f9fa', minHeight: '100vh' }}>
            
            {/* CABECERA */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#000', padding: '15px 20px', color: 'white', position: 'sticky', top: 0, zIndex: 1000 }}>
                <button onClick={() => navigate('/dashboard')} style={{ background: 'none', color: 'white', border: 'none', fontSize:'20px' }}>←</button>
                <div style={{textAlign:'center'}}>
                    <div style={{fontSize:'14px', fontWeight:'bold'}}>{tournamentInfo?.name}</div>
                    <div style={{fontSize:'9px', color:isAdmin?'#2ecc71':'#f1c40f'}}>{isAdmin?'ADMINISTRADOR':'LECTURA'}</div>
                </div>
                <button onClick={() => setShowTable(!showTable)} style={{ background: '#007bff', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '8px', fontSize: '12px', fontWeight:'bold' }}>{showTable ? '⚽' : '📊'}</button>
            </div>

            <div style={{ padding: '15px' }}>
                
                {/* 1. CUADRO PLAYOFFS DINÁMICO */}
                {!showTable && tournamentInfo?.type === 'campeonato' && teams.length === 8 && (
                    <div style={{ background: '#fff', padding: '15px', borderRadius: '15px', marginBottom: '30px', border: '1px solid #eee', boxShadow:'0 4px 10px rgba(0,0,0,0.05)' }}>
                        <h4 style={{ textAlign: 'center', margin: '0 0 10px 0', fontSize: '11px', color: '#666' }}>🏆 CUADRO DE ELIMINATORIAS</h4>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '5px' }}>
                            <div style={{ flex: 1.2 }}>
                                {[0,1,2,3].map(i => {
                                    const dbM = qMatches[i];
                                    return (
                                        <div key={i} style={{ background: '#f8f9fa', marginBottom: '5px', padding: '5px', borderRadius: '5px', border: '1px solid #eee', fontSize: '9px' }}>
                                            <div style={{display:'flex', justifyContent:'space-between', color: dbM ? '#000' : '#007bff'}}>
                                                <span>{dbM ? dbM.team_a_name : getTeamByRank(i+1).name}</span><b>{dbM?.team_a_goals ?? ''}</b>
                                            </div>
                                            <div style={{display:'flex', justifyContent:'space-between', color: dbM ? '#000' : '#007bff', borderTop:'1px solid #fff'}}>
                                                <span>{dbM ? dbM.team_b_name : getTeamByRank(8-i).name}</span><b>{dbM?.team_b_goals ?? ''}</b>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div style={{ flex: 1, display:'flex', flexDirection:'column', justifyContent:'space-around', fontSize:8, textAlign:'center', color:'#999' }}>
                                {[0,1].map(i => (
                                    <div key={i} style={{border:'1px dashed #ccc', padding:5, borderRadius:5}}>
                                        <div>{sMatches[i] ? sMatches[i].team_a_name : 'Winner'} {sMatches[i]?.team_a_goals ?? ''}</div>
                                        <div>{sMatches[i] ? sMatches[i].team_b_name : 'Winner'} {sMatches[i]?.team_b_goals ?? ''}</div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ flex: 0.8, display:'flex', alignItems:'center' }}>
                                <div style={{ height:'60px', width:'100%', background:'#fff3cd', border:'2px solid #ffeeba', borderRadius:'8px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontSize:'8px', textAlign:'center' }}>
                                    <b>{fMatches[0] ? fMatches[0].team_a_name : 'Finalist'}</b>
                                    <span style={{fontSize:12, fontWeight:900}}>{fMatches[0] ? `${fMatches[0].team_a_goals}-${fMatches[0].team_b_goals}` : 'vs'}</span>
                                    <b>{fMatches[0] ? fMatches[0].team_b_name : 'Finalist'}</b>
                                </div>
                            </div>
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
                        <div style={{ background: '#333', color: 'white', padding: '10px', borderRadius: '8px', fontSize: '12px', marginBottom: '15px', textAlign:'center', fontWeight:'bold' }}>1. FASE DE GRUPOS</div>
                        {matches.filter(m => m.phase === 'grupo' || m.phase === 'liga').map(m => <MatchCard key={m.id} m={m} />)}

                        <div style={{ background: '#007bff', color: 'white', padding: '10px', borderRadius: '8px', fontSize: '12px', marginBottom: '15px', marginTop:'40px', textAlign:'center', fontWeight:'bold' }}>2. CUARTOS DE FINAL</div>
                        {qMatches.length > 0 ? qMatches.map(m => <MatchCard key={m.id} m={m} />) : 
                            isAdmin && standingsList.length === 8 && <button onClick={() => activatePhase('cuartos', [{a: standingsList[0].id, b: standingsList[7].id, field: 1}, {a: standingsList[1].id, b: standingsList[6].id, field: 2}, {a: standingsList[2].id, b: standingsList[5].id, field: 1}, {a: standingsList[3].id, b: standingsList[4].id, field: 2}])} style={{width:'100%', padding:15, background:'#28a745', color:'#fff', borderRadius:10, fontWeight:'bold', border:'none'}}>⚡ ACTIVAR CUARTOS</button>
                        }

                        <div style={{ background: '#198754', color: 'white', padding: '10px', borderRadius: '8px', fontSize: '12px', marginBottom: '15px', marginTop:'40px', textAlign:'center', fontWeight:'bold' }}>3. SEMIFINALES</div>
                        {sMatches.length > 0 ? sMatches.map(m => <MatchCard key={m.id} m={m} />) : 
                            isAdmin && qMatches.length === 4 && qMatches.every(m => m.played) && <button onClick={() => activatePhase('semi', [{a: getWinner(qMatches[0]).id, b: getWinner(qMatches[3]).id, field: 1}, {a: getWinner(qMatches[1]).id, b: getWinner(qMatches[2]).id, field: 2}])} style={{width:'100%', padding:15, background:'#28a745', color:'#fff', borderRadius:10, fontWeight:'bold', border:'none'}}>⚡ ACTIVAR SEMIFINALES</button>
                        }

                        <div style={{ background: '#ffc107', color: 'black', padding: '10px', borderRadius: '8px', fontSize: '12px', marginBottom: '15px', marginTop:'40px', textAlign:'center', fontWeight:'bold' }}>4. GRAN FINAL</div>
                        {fMatches.length > 0 ? fMatches.map(m => <MatchCard key={m.id} m={m} />) : 
                            isAdmin && sMatches.length === 2 && sMatches.every(m => m.played) && <button onClick={() => activatePhase('final', [{a: getWinner(sMatches[0]).id, b: getWinner(sMatches[1]).id, field: 1}])} style={{width:'100%', padding:15, background:'#28a745', color:'#fff', borderRadius:10, fontWeight:'bold', border:'none'}}>⚡ ACTIVAR GRAN FINAL</button>
                        }
                    </div>
                )}
            </div>

            {/* MODAL EDICIÓN */}
            {editingMatch && (
                <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.85)', zIndex:2000, padding:20, display:'flex', alignItems:'center'}}>
                    <div style={{background:'#fff', width:'100%', padding:20, borderRadius:15}}>
                        <h4 style={{marginTop:0}}>Editar Partido</h4>
                        <input type="datetime-local" value={editingMatch.match_date?.replace(' ', 'T').slice(0, 16)} onChange={e => setEditingMatch({...editingMatch, match_date: e.target.value})} style={{width:'100%', padding:15, marginBottom:15, borderRadius:10, border:'1px solid #ccc'}} />
                        <input placeholder="Árbitro" value={editingMatch.referee} onChange={e => setEditingMatch({...editingMatch, referee: e.target.value})} style={{width:'100%', padding:15, marginBottom:15, borderRadius:10, border:'1px solid #ccc'}} />
                        <button onClick={() => handleSaveMatch(editingMatch)} style={{width:'100%', padding:15, background:'#198754', color:'#fff', marginBottom:10, borderRadius:10, border:'none', fontWeight:'bold'}}>GUARDAR CAMBIOS</button>
                        <button onClick={() => setEditingMatch(null)} style={{width:'100%', padding:12, background:'#eee', border:'none', borderRadius:10, width:'100%'}}>CERRAR</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TournamentView;