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

    // FORMULARIOS
    const [newPlayer, setNewPlayer] = useState({ name: '', team_id: '', is_goalkeeper: false });
    const [newTeam, setNewTeam] = useState({ name: '', group_num: 1, logo_url: '' });
    const [startDate, setStartDate] = useState('');

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

    // --- FUNCIÓN DE CLASIFICACIÓN (LA QUE FALTABA) ---
    const getStandings = () => {
        let table = {};
        teams.forEach(t => { table[t.id] = { id: t.id, name: t.name, logo: t.logo_url, pts: 0, gf: 0, gc: 0, pj: 0 }; });
        matches.forEach(m => {
            const isMainPhase = tournamentInfo?.type === 'liga' ? m.phase === 'liga' : m.phase === 'grupo';
            if (m.played && isMainPhase) {
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
    };

    const standingsList = getStandings();
    const getTeamByRank = (rank) => standingsList[rank - 1] || { name: `${rank}º Clasif.` };
    const getWinnerId = (m) => (m?.team_a_goals > m?.team_b_goals ? m.team_a_id : m?.team_b_id);

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
        } catch (e) { alert("No hay más goles."); }
    };

    const handleAddTeam = async () => {
        const limit = tournamentInfo?.type === 'liga' ? 6 : 8;
        if (teams.length >= limit) return alert("Límite alcanzado");
        await axios.post(`${API_URL}/teams`, { ...newTeam, tournament_id: id });
        setNewTeam({ name: '', group_num: 1, logo_url: '' });
        loadData();
    };

    const handleSaveMatch = async (m) => {
        try {
            await axios.put(`${API_URL}/matches/${m.id}`, m);
            setEditingMatch(null);
            loadData();
        } catch (e) { alert("Error al guardar"); }
    };

    const handleGenerateSchedule = async () => {
        if (!startDate && tournamentInfo.type === 'campeonato') return alert("Selecciona fecha");
        const route = tournamentInfo.type === 'liga' ? 'generate-league' : 'generate-schedule';
        await axios.post(`${API_URL}/${route}/${id}`, { startTime: startDate });
        loadData();
    };

    const activatePhase = async (phase, pairings) => {
        await axios.post(`${API_URL}/generate-playoffs-custom/${id}`, { phase, pairings });
        loadData();
    };

    // --- COMPONENTE PARTIDO ---
    const MatchCard = ({ m }) => {
        const isThisEditing = editingMatch?.id === m.id;
        return (
            <div style={{ border: '1px solid #ddd', borderRadius: '15px', background: 'white', marginBottom: '20px', overflow:'hidden', boxShadow:'0 3px 6px rgba(0,0,0,0.05)' }}>
                <div style={{ background: '#f8f9fa', padding: '10px', fontSize: '11px', color: '#666', borderBottom: '1px solid #eee', display:'flex', justifyContent:'space-between' }}>
                    <span>📅 {m.match_date ? new Date(m.match_date).toLocaleDateString() : 'S/F'} | 🕒 {m.match_date ? new Date(m.match_date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '--:--'}</span>
                    <span>🏟️ C{m.field} | 👤 {m.referee || 'S/A'}</span>
                </div>
                <div style={{ display: 'flex', padding: '15px 10px', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, textAlign: 'center' }}>
                        <img src={m.team_a_logo || 'https://via.placeholder.com/40'} width="40" height="40" style={{borderRadius:'50%', objectFit:'cover'}} alt="logo" />
                        <div style={{ fontWeight: 'bold', fontSize: '14px', margin: '5px 0' }}>{m.team_a_name}</div>
                        {isAdmin && players.filter(p => p.team_id === m.team_a_id).map(p => (
                            <div key={p.id} style={{ marginBottom: '8px', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                <button onClick={() => addGoal(m.id, p.id, m.team_a_id, 'team_a_goals')} style={{ padding: '12px 5px', width: '85%', fontSize: '12px', background: '#f0f4ff', border: '1px solid #ccd', borderRadius: '8px', fontWeight: 'bold' }}>⚽ {p.name}</button>
                                <button onClick={() => removeGoal(m.id, p.id, m.team_a_id, 'team_a_goals')} style={{ color: 'red', background: 'none', border: 'none', fontSize: '20px', marginLeft: '5px' }}>×</button>
                            </div>
                        ))}
                    </div>
                    <div style={{ flex: 0.4, textAlign: 'center', paddingTop: '10px' }}>
                        <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{m.team_a_goals} - {m.team_b_goals}</div>
                        {isAdmin && <button onClick={() => setEditingMatch({...m})} style={{ marginTop: '10px', background: '#eee', border: 'none', padding: '5px 10px', borderRadius: '4px', fontSize: '10px' }}>✏️ EDITAR</button>}
                    </div>
                    <div style={{ flex: 1, textAlign: 'center' }}>
                        <img src={m.team_b_logo || 'https://via.placeholder.com/40'} width="40" height="40" style={{borderRadius:'50%', objectFit:'cover'}} alt="logo" />
                        <div style={{ fontWeight: 'bold', fontSize: '14px', margin: '5px 0' }}>{m.team_b_name}</div>
                        {isAdmin && players.filter(p => p.team_id === m.team_b_id).map(p => (
                            <div key={p.id} style={{ marginBottom: '8px', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                <button onClick={() => removeGoal(m.id, p.id, m.team_b_id, 'team_b_goals')} style={{ color: 'red', background: 'none', border: 'none', fontSize: '20px', marginRight: '5px' }}>×</button>
                                <button onClick={() => addGoal(m.id, p.id, m.team_b_id, 'team_b_goals')} style={{ padding: '12px 5px', width: '85%', fontSize: '12px', background: '#fff0f0', border: '1px solid #dcc', borderRadius: '8px', fontWeight: 'bold' }}>{p.name} ⚽</button>
                            </div>
                        ))}
                    </div>
                </div>
                {isThisEditing && (
                    <div style={{ padding: '15px', background: '#fff9c4', borderTop: '1px solid #fbc02d' }}>
                        <input type="datetime-local" value={editingMatch.match_date ? editingMatch.match_date.replace(' ', 'T').slice(0, 16) : ''} onChange={e => setEditingMatch({...editingMatch, match_date: e.target.value})} style={{ width: '100%', marginBottom: '10px', padding:8 }} />
                        <input placeholder="Árbitro" value={editingMatch.referee || ''} onChange={e => setEditingMatch({...editingMatch, referee: e.target.value})} style={{ width: '100%', marginBottom: '10px', padding:8 }} />
                        <div style={{display:'flex', gap:10}}><button onClick={() => handleSaveMatch(editingMatch)} style={{ flex: 1, background: 'green', color: 'white', padding: '12px', border:'none', borderRadius:5 }}>GUARDAR</button><button onClick={() => setEditingMatch(null)} style={{ flex: 1, background: '#666', color: 'white', padding: '12px', border:'none', borderRadius:5 }}>X</button></div>
                    </div>
                )}
            </div>
        );
    };

    if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>Cargando sistema...</div>;

    const qMatches = matches.filter(m => m.phase === 'cuartos');
    const sMatches = matches.filter(m => m.phase === 'semi');
    const fMatches = matches.filter(m => m.phase === 'final');
    const allMainPlayed = matches.filter(m => m.phase === 'grupo' || m.phase === 'liga').length > 0 && matches.filter(m => m.phase === 'grupo' || m.phase === 'liga').every(m => m.played);

    return (
        <div style={{ padding: '0 0 50px 0', fontFamily: 'Arial', maxWidth: '600px', margin: 'auto', background: '#f8f9fa', minHeight: '100vh' }}>
            {/* CABECERA */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#000', padding: '15px 20px', color: 'white', position: 'sticky', top: 0, zIndex: 1000 }}>
                <button onClick={() => navigate('/dashboard')} style={{ background: 'none', color: 'white', border: 'none', fontSize:'24px' }}>←</button>
                <div style={{textAlign:'center'}}>
                    <div style={{fontSize:'14px', fontWeight:'bold'}}>{tournamentInfo?.name}</div>
                    <div style={{fontSize:'9px', color:isAdmin?'#2ecc71':'#f1c40f'}}>{isAdmin?'MODO ADMIN':'MODO LECTURA'}</div>
                </div>
                <button onClick={() => setShowTable(!showTable)} style={{ background: '#007bff', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '8px', fontSize: '12px', fontWeight:'bold' }}>{showTable ? 'PARTIDOS' : 'TABLA'}</button>
            </div>

            <div style={{ padding: '15px' }}>
                {/* CUADRO PLAYOFFS */}
                {!showTable && tournamentInfo?.type === 'campeonato' && (
                    <div style={{ background: '#fff', padding: '15px', borderRadius: '15px', marginBottom: '30px', border: '1px solid #eee', boxShadow:'0 4px 10px rgba(0,0,0,0.05)' }}>
                        <h4 style={{ textAlign: 'center', margin: '0 0 10px 0', fontSize: '12px' }}>🏆 CUADRO DE PLAYOFFS</h4>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '5px' }}>
                            <div style={{ flex: 1.2 }}>
                                {[ {a:1, b:8}, {a:2, b:7}, {a:3, b:6}, {a:4, b:5} ].map((p, i) => {
                                    const dbM = qMatches[i];
                                    return (
                                        <div key={i} style={{ background: '#f8f9fa', marginBottom: '5px', padding: '5px', borderRadius: '5px', border: '1px solid #eee', fontSize: '10px' }}>
                                            <div style={{display:'flex', justifyContent:'space-between', color: dbM ? '#000' : '#007bff'}}>
                                                <span>{dbM ? dbM.team_a_name : getTeamByRank(p.a).name}</span><b>{dbM?.team_a_goals ?? '-'}</b>
                                            </div>
                                            <div style={{display:'flex', justifyContent:'space-between', color: dbM ? '#000' : '#007bff', borderTop:'1px solid #fff'}}>
                                                <span>{dbM ? dbM.team_b_name : getTeamByRank(p.b).name}</span><b>{dbM?.team_b_goals ?? '-'}</b>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div style={{ flex: 1, display:'flex', flexDirection:'column', justifyContent:'space-around', fontSize:8, textAlign:'center', color:'#999' }}>
                                <div style={{border:'1px dashed #ccc', padding:5, borderRadius:5}}>{sMatches[0] ? sMatches[0].team_a_name : 'Semi 1'}</div>
                                <div style={{border:'1px dashed #ccc', padding:5, borderRadius:5}}>{sMatches[1] ? sMatches[1].team_a_name : 'Semi 2'}</div>
                            </div>
                            <div style={{ flex: 0.8, display:'flex', alignItems:'center' }}><div style={{ height:'60px', width:'100%', background:'#fff3cd', border:'2px solid #ffeeba', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center' }}>🏆</div></div>
                        </div>
                    </div>
                )}

                {showTable ? (
                    <div style={{ background: 'white', padding: '15px', borderRadius: '15px' }}>
                        <h3>📊 Clasificación</h3>
                        <table width="100%" style={{ borderCollapse: 'collapse', fontSize: '13px' }}>
                            <thead><tr style={{ textAlign: 'left', color:'#888', borderBottom:'2px solid #eee' }}><th>POS</th><th>EQUIPO</th><th>PTS</th><th>GF</th></tr></thead>
                            <tbody>{standingsList.map((t, i) => (
                                <tr key={t.id} style={{ borderBottom: '1px solid #f8f9fa' }}>
                                    <td style={{ padding: '15px 0' }}>{i + 1}</td>
                                    <td style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '15px 0', fontWeight: 'bold' }}>
                                        <img src={t.logo || 'https://via.placeholder.com/25'} width="25" height="25" style={{ borderRadius: '50%' }} alt="logo" />
                                        {t.name}
                                    </td>
                                    <td style={{ fontWeight: 'bold', color:'#007bff' }}>{t.pts}</td><td>{t.gf}</td>
                                </tr>
                            ))}</tbody>
                        </table>
                    </div>
                ) : (
                    <div>
                        {/* REGISTRO EQUIPOS */}
                        {isAdmin && matches.length === 0 && (
                            <div style={{ background: '#fff', border: '1px solid #ddd', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
                                <h3>Registro ({teams.length}/{tournamentInfo?.type === 'liga' ? 6 : 8})</h3>
                                <div style={{display:'flex', gap:10, flexWrap:'wrap'}}>
                                    <input placeholder="Nombre" value={newTeam.name} onChange={e => setNewTeam({...newTeam, name: e.target.value})} style={{padding:8, flex:1}} />
                                    <input placeholder="Logo URL" value={newTeam.logo_url} onChange={e => setNewTeam({...newTeam, logo_url: e.target.value})} style={{padding:8, flex:1}} />
                                    {tournamentInfo?.type === 'campeonato' && (
                                        <select value={newTeam.group_num} onChange={e => setNewTeam({...newTeam, group_num: parseInt(e.target.value)})} style={{padding:8}}>
                                            <option value="1">Grupo 1</option><option value="2">Grupo 2</option>
                                        </select>
                                    )}
                                    <button onClick={handleAddTeam} style={{padding:10, background:'#000', color:'#fff', borderRadius:5, cursor:'pointer', width:'100%', fontWeight:'bold'}}>AÑADIR EQUIPO</button>
                                </div>
                                {((tournamentInfo?.type==='campeonato' && teams.length===8) || (tournamentInfo?.type==='liga' && teams.length===6)) && (
                                    <div style={{marginTop:20, borderTop:'1px solid #eee', paddingTop:15, textAlign:'center'}}>
                                        {tournamentInfo.type === 'campeonato' && <input type="datetime-local" onChange={e => setStartDate(e.target.value)} style={{padding:10, marginBottom:10}} />}
                                        <button onClick={handleGenerateSchedule} style={{background:'#28a745', color:'white', padding:15, border:'none', borderRadius:5, cursor:'pointer', width:'100%', fontWeight:'bold'}}>GENERAR CALENDARIO OFICIAL</button>
                                    </div>
                                )}
                            </div>
                        )}

                        {isAdmin && teams.length > 0 && (
                            <div style={{ background: '#e3f2fd', padding: '12px', borderRadius: '10px', marginBottom: '20px', fontSize: '12px', border:'1px solid #b2dbff' }}>
                                <b>Añadir Jugador: </b>
                                <input placeholder="Nombre" value={newPlayer.name} onChange={e => setNewPlayer({...newPlayer, name: e.target.value})} style={{width:'80px', padding:4}} />
                                <select value={newPlayer.team_id} onChange={e => setNewPlayer({...newPlayer, team_id: e.target.value})} style={{padding:4}}>
                                    <option value="">Equipo...</option>
                                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                                <button onClick={async () => { await axios.post(`${API_URL}/players`, newPlayer); loadData(); setNewPlayer({name:'', team_id:'', is_goalkeeper:false}); }}>OK</button>
                            </div>
                        )}

                        <div style={{ background: '#333', color: 'white', padding: '10px', borderRadius: '8px', fontSize: '12px', marginBottom: '15px', textAlign:'center', fontWeight:'bold' }}>{tournamentInfo?.type === 'liga' ? 'LIGA REGULAR' : '1. FASE DE GRUPOS'}</div>
                        {matches.filter(m => m.phase === 'grupo' || m.phase === 'liga').map(m => <MatchCard key={m.id} m={m} />)}

                        {tournamentInfo?.type === 'campeonato' && (
                            <>
                                <div style={{ background: '#007bff', color: 'white', padding: '10px', borderRadius: '8px', fontSize: '12px', marginBottom: '15px', marginTop:'40px', textAlign:'center', fontWeight:'bold' }}>2. CUARTOS DE FINAL</div>
                                {qMatches.length > 0 ? qMatches.map(m => <MatchCard key={m.id} m={m} />) : 
                                    isAdmin && allMainPlayed && <button onClick={() => activatePhase('cuartos', [{a: standingsList[0].id, b: standingsList[7].id, field: 1}, {a: standingsList[1].id, b: standingsList[6].id, field: 2}, {a: standingsList[2].id, b: standingsList[5].id, field: 1}, {a: standingsList[3].id, b: standingsList[4].id, field: 2}])} style={{display:'block', margin:'10px auto', background:'#28a745', color:'white', border:'none', padding:'10px 20px', borderRadius:5, fontWeight:'bold'}}>ACTIVAR CUARTOS</button>
                                }
                            </>
                        )}

                        <div style={{ background: '#198754', color: 'white', padding: '10px', borderRadius: '8px', fontSize: '12px', marginBottom: '15px', marginTop:'40px', textAlign:'center', fontWeight:'bold' }}>3. SEMIFINALES</div>
                        {sMatches.length > 0 ? sMatches.map(m => <MatchCard key={m.id} m={m} />) : 
                            isAdmin && sMatches.length === 0 && (tournamentInfo?.type === 'liga' ? (allMainPlayed && teams.length === 6) : (qMatches.length === 4 && qMatches.every(m => m.played))) && 
                            <button onClick={() => activatePhase('semi', [{a: getWinnerId(qMatches[0]) || standingsList[0].id, b: getWinnerId(qMatches[3]) || standingsList[3].id, field: 1}, {a: getWinnerId(qMatches[1]) || standingsList[1].id, b: getWinnerId(qMatches[2]) || standingsList[2].id, field: 2}])} style={{display:'block', margin:'10px auto', background:'#28a745', color:'white', border:'none', padding:'10px 20px', borderRadius:5, fontWeight:'bold'}}>ACTIVAR SEMIFINALES</button>
                        }

                        <div style={{ background: '#ffc107', color: 'black', padding: '10px', borderRadius: '8px', fontSize: '12px', marginBottom: '15px', marginTop:'40px', textAlign:'center', fontWeight:'bold' }}>4. GRAN FINAL</div>
                        {fMatches.length > 0 ? fMatches.map(m => <MatchCard key={m.id} m={m} />) : 
                            isAdmin && sMatches.length > 0 && sMatches.every(m => m.played) && 
                            <button onClick={() => activatePhase('final', [{a: getWinnerId(sMatches[0]), b: getWinnerId(sMatches[1]), field: 1}])} style={{display:'block', margin:'10px auto', background:'#28a745', color:'white', border:'none', padding:'10px 20px', borderRadius:5, fontWeight:'bold'}}>ACTIVAR FINAL</button>
                        }
                    </div>
                )}

                {/* ESTADÍSTICAS */}
                <div style={{ marginTop: '50px', background: 'white', padding: '20px', borderRadius: '20px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)' }}>
                    <h4 style={{ margin: '0 0 15px 0', borderLeft:'4px solid #ffc107', paddingLeft:10 }}>🏆 Pichichi</h4>
                    {(stats.goleadores || []).map((g, i) => (
                        <div key={i} style={{ fontSize: '13px', padding: '10px 0', borderBottom: '1px solid #f1f1f1', display: 'flex', justifyContent: 'space-between' }}>
                            <span><b>{i + 1}.</b> {g.name} <small style={{color:'#888'}}>({g.team_name})</small></span>
                            <b>{g.total_goals} ⚽</b>
                        </div>
                    ))}
                    <h4 style={{ margin: '30px 0 15px 0', borderLeft:'4px solid #0dcaf0', paddingLeft:10 }}>🧤 Zamora</h4>
                    {(stats.porteros || []).map((p, i) => (
                        <div key={i} style={{ fontSize: '13px', padding: '10px 0', borderBottom: '1px solid #f1f1f1', display: 'flex', justifyContent: 'space-between' }}>
                            <span><b>{i + 1}.</b> {p.name} <small style={{color:'#888'}}>({p.team_name})</small></span>
                            <b style={{ color: '#dc3545' }}>{p.goals_against} 🥅</b>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TournamentView;