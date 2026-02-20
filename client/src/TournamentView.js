import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const TournamentView = ({ user }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    // ESTADOS DE DATOS
    const [matches, setMatches] = useState([]);
    const [teams, setTeams] = useState([]);
    const [players, setPlayers] = useState([]);
    const [stats, setStats] = useState({ goleadores: [], porteros: [] });
    const [tournamentInfo, setTournamentInfo] = useState(null);

    // ESTADOS DE INTERFAZ
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

    // --- LOGICA DE CLASIFICACIÓN DINÁMICA ---
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
                    if (m.team_a_goals > m.team_b_goals) { tA.pts += 2; }
                    else if (m.team_a_goals < m.team_b_goals) { tB.pts += 2; }
                    else { tA.pts += 1; tB.pts += 1; }
                }
            }
        });

        // ORDEN: Puntos > Diferencia de Goles > Goles a Favor
        return Object.values(table).sort((a, b) => {
            if (b.pts !== a.pts) return b.pts - a.pts;
            const diffA = a.gf - a.gc;
            const diffB = b.gf - b.gc;
            if (diffB !== diffA) return diffB - diffA;
            return b.gf - a.gf;
        });
    };

    const standingsList = getStandings();
    
    // Ayudante para el cuadro de Playoff
    const getProjectedTeam = (rank) => {
        const team = standingsList[rank - 1];
        return team ? { name: team.name, logo: team.logo } : { name: `${rank}º Clasif.`, logo: null };
    };

    // --- FORMATO DE HORA ---
    const formatDisplayTime = (dateStr) => {
        if (!dateStr) return "--:--";
        const parts = dateStr.split(' ');
        if (parts.length < 2) return dateStr.includes('T') ? dateStr.split('T')[1].slice(0, 5) : "--:--";
        return parts[1].slice(0, 5);
    };

    const formatDisplayDate = (dateStr) => {
        if (!dateStr) return "S/F";
        const datePart = dateStr.split('T')[0].split(' ')[0];
        const [y, m, d] = datePart.split('-');
        return `${d}/${m}/${y}`;
    };

    // --- ACCIONES ---
    const addGoal = async (mId, pId, tId, side) => {
        if (!isAdmin) return;
        await axios.post(`${API_URL}/add-player-goal`, { match_id: mId, player_id: pId, team_id: tId, team_side: side });
        loadData(); // RECARGA TODO
    };

    const removeGoal = async (mId, pId, tId, side) => {
        if (!isAdmin) return;
        try {
            await axios.post(`${API_URL}/remove-player-goal`, { match_id: mId, player_id: pId, team_id: tId, team_side: side });
            loadData();
        } catch (e) { alert("Sin goles registrados."); }
    };

    const handleSaveMatch = async (m) => {
        try {
            await axios.put(`${API_URL}/matches/${m.id}`, m);
            setEditingMatch(null);
            loadData();
        } catch (e) { alert("Error al guardar"); }
    };

    const activatePhase = async (phase, pairings) => {
        await axios.post(`${API_URL}/generate-playoffs-custom/${id}`, { phase, pairings });
        loadData();
    };

    const getWinnerId = (m) => (m?.team_a_goals > m?.team_b_goals ? m.team_a_id : m?.team_b_id);

    // --- COMPONENTE PARTIDO ---
    const MatchCard = ({ m }) => (
        <div style={{ border: '1px solid #ddd', borderRadius: '15px', background: 'white', marginBottom: '20px', overflow:'hidden', boxShadow:'0 3px 6px rgba(0,0,0,0.05)' }}>
            <div style={{ background: '#f1f3f5', padding: '10px 15px', fontSize: '10px', color: '#666', borderBottom: '1px solid #eee', display:'flex', justifyContent:'space-between' }}>
                <span>📅 {formatDisplayDate(m.match_date)} | 🕒 {formatDisplayTime(m.match_date)}</span>
                <span>🏟️ C{m.field} | 👤 {m.referee || 'S/A'}</span>
            </div>
            <div style={{ display: 'flex', padding: '15px 5px', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ flex: '1 1 35%', textAlign: 'center' }}>
                    <img src={m.team_a_logo || 'https://via.placeholder.com/40'} width="40" height="40" style={{borderRadius:'50%', objectFit:'cover'}} alt="logo" />
                    <div style={{ fontWeight: 'bold', fontSize: '12px', margin:'5px 0', minHeight:'30px' }}>{m.team_a_name}</div>
                    {isAdmin && players.filter(p => p.team_id === m.team_a_id).map(p => (
                        <div key={p.id} style={{marginBottom:8, display:'flex', alignItems:'center', justifyContent:'center'}}>
                            <button onClick={() => addGoal(m.id, p.id, m.team_a_id, 'team_a_goals')} style={{padding:'12px 4px', width:'85%', fontSize:12, fontWeight:'bold', borderRadius:8, border:'1px solid #ccd', background:'#f0f4ff'}}>⚽ {p.name}</button>
                            <button onClick={() => removeGoal(m.id, p.id, m.team_a_id, 'team_a_goals')} style={{color:'red', background:'none', border:'none', fontSize:20, marginLeft:5}}>-</button>
                        </div>
                    ))}
                </div>
                <div style={{ flex: '0 0 28%', textAlign: 'center', paddingTop: '10px' }}>
                    <div style={{ fontSize: '22px', fontWeight: '900', whiteSpace: 'nowrap' }}>{m.team_a_goals} - {m.team_b_goals}</div>
                    {isAdmin && <button onClick={() => setEditingMatch({...m})} style={{fontSize:9, marginTop:10, background:'#eee', border:'none', padding:'4px 8px', borderRadius:4}}>✏️ EDITAR</button>}
                </div>
                <div style={{ flex: '1 1 35%', textAlign: 'center' }}>
                    <img src={m.team_b_logo || 'https://via.placeholder.com/40'} width="40" height="40" style={{borderRadius:'50%', objectFit:'cover'}} alt="logo" />
                    <div style={{ fontWeight: 'bold', fontSize: '12px', margin:'5px 0', minHeight:'30px' }}>{m.team_b_name}</div>
                    {isAdmin && players.filter(p => p.team_id === m.team_b_id).map(p => (
                        <div key={p.id} style={{marginBottom:8, display:'flex', alignItems:'center', justifyContent:'center'}}>
                            <button onClick={() => removeGoal(m.id, p.id, m.team_b_id, 'team_b_goals')} style={{color:'red', background:'none', border:'none', fontSize:20, marginRight:5}}>-</button>
                            <button onClick={() => addGoal(m.id, p.id, m.team_b_id, 'team_b_goals')} style={{padding:'12px 4px', width:'80%', fontSize:12, fontWeight:'bold', borderRadius:8, border:'1px solid #dcc', background:'#fff0f0'}}>{p.name} ⚽</button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

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
                
                {/* 1. CUADRO ELIMINATORIAS (DINÁMICO SEGÚN TABLA) */}
                {!showTable && tournamentInfo?.type === 'campeonato' && teams.length === 8 && (
                    <div style={{ background: '#fff', padding: '15px', borderRadius: '15px', marginBottom: '30px', border: '1px solid #eee', boxShadow:'0 4px 10px rgba(0,0,0,0.05)' }}>
                        <h4 style={{ textAlign: 'center', margin: '0 0 10px 0', fontSize: '12px', color: '#666' }}>🏆 CUADRO PROYECTADO (1º vs 8º...)</h4>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '5px' }}>
                            <div style={{ flex: 1.2 }}>
                                {[ {a:1, b:8}, {a:2, b:7}, {a:3, b:6}, {a:4, b:5} ].map((p, i) => {
                                    const dbM = qMatches[i];
                                    const teamA = dbM ? {name: dbM.team_a_name, logo: dbM.team_a_logo} : getProjectedTeam(p.a);
                                    const teamB = dbM ? {name: dbM.team_b_name, logo: dbM.team_b_logo} : getProjectedTeam(p.b);
                                    return (
                                        <div key={i} style={{ background: '#f8f9fa', marginBottom: '5px', padding: '5px', borderRadius: '5px', border: '1px solid #eee', fontSize: '9px' }}>
                                            <div style={{display:'flex', justifyContent:'space-between', color: dbM ? '#000' : '#007bff'}}>
                                                <span style={{overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'65px'}}>{teamA.name}</span>
                                                <b>{dbM?.team_a_goals ?? '-'}</b>
                                            </div>
                                            <div style={{display:'flex', justifyContent:'space-between', color: dbM ? '#000' : '#007bff', borderTop:'1px solid #fff'}}>
                                                <span style={{overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'65px'}}>{teamB.name}</span>
                                                <b>{dbM?.team_b_goals ?? '-'}</b>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div style={{ flex: 1, display:'flex', flexDirection:'column', justifyContent:'space-around', fontSize:8, textAlign:'center', color:'#999' }}>
                                {[0,1].map(i => (
                                    <div key={i} style={{border:'1px dashed #ccc', padding:5, borderRadius:5}}>
                                        <div>{sMatches[i] ? sMatches[i].team_a_name : 'Ganador...'} {sMatches[i]?.team_a_goals ?? ''}</div>
                                        <div style={{borderTop:'1px solid #fff'}}>{sMatches[i] ? sMatches[i].team_b_name : 'Ganador...'} {sMatches[i]?.team_b_goals ?? ''}</div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ flex: 0.8, display:'flex', alignItems:'center' }}><div style={{ height:'60px', width:'100%', background:'#fff3cd', border:'2px solid #ffeeba', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px' }}>🏆</div></div>
                        </div>
                    </div>
                )}

                {showTable ? (
                    /* TABLA CLASIFICACIÓN */
                    <div style={{ background: 'white', padding: '15px', borderRadius: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                        <h3 style={{marginTop:0, fontSize:18}}>📊 Clasificación</h3>
                        <table width="100%" style={{ borderCollapse: 'collapse', fontSize: '13px' }}>
                            <thead><tr style={{ textAlign: 'left', color:'#888', borderBottom:'2px solid #eee' }}><th>POS</th><th>EQUIPO</th><th>PTS</th><th>GF</th></tr></thead>
                            <tbody>{standingsList.map((t, i) => (
                                <tr key={t.id} style={{ borderBottom: '1px solid #f8f9fa' }}>
                                    <td style={{ padding: '12px 0' }}>{i + 1}</td>
                                    <td style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 0', fontWeight: 'bold' }}>
                                        {t.logo && <img src={t.logo} width="25" height="25" style={{ borderRadius: '50%', objectFit:'cover' }} />}
                                        {t.name}
                                    </td>
                                    <td style={{ fontWeight: 'bold', color:'#007bff' }}>{t.pts}</td><td>{t.gf}</td>
                                </tr>
                            ))}</tbody>
                        </table>
                    </div>
                ) : (
                    /* LISTA PARTIDOS */
                    <div>
                        {/* REGISTRO EQUIPOS */}
                        {isAdmin && matches.length === 0 && (
                            <div style={{ background: '#fff', padding: 20, borderRadius: 15, marginBottom: 20 }}>
                                <h3>Registro Equipos</h3>
                                <input placeholder="Nombre" value={newTeam.name} onChange={e => setNewTeam({...newTeam, name: e.target.value})} style={{width:'100%', padding:12, marginBottom:10, borderRadius:8, border:'1px solid #ddd'}} />
                                <input placeholder="Logo URL" value={newTeam.logo_url} onChange={e => setNewTeam({...newTeam, logo_url: e.target.value})} style={{width:'100%', padding:12, marginBottom:10, borderRadius:8, border:'1px solid #ddd'}} />
                                {tournamentInfo?.type === 'campeonato' && (
                                    <select value={newTeam.group_num} onChange={e => setNewTeam({...newTeam, group_num: parseInt(e.target.value)})} style={{width:'100%', padding:12, marginBottom:10}}>
                                        <option value="1">Grupo 1</option><option value="2">Grupo 2</option>
                                    </select>
                                )}
                                <button onClick={handleAddTeam} style={{width:'100%', padding:12, background:'#000', color:'#fff', border:'none', borderRadius:8, fontWeight:'bold'}}>AÑADIR EQUIPO</button>
                                {((tournamentInfo?.type==='campeonato' && teams.length===8) || (tournamentInfo?.type==='liga' && teams.length===6)) && 
                                    <button onClick={handleGenerateSchedule} style={{width:'100%', padding:15, background:'green', color:'#fff', marginTop:15, borderRadius:8, fontWeight:'bold'}}>GENERAR CALENDARIO</button>
                                }
                            </div>
                        )}

                        {isAdmin && teams.length > 0 && (
                            <div style={{ background: '#e3f2fd', padding: '12px', borderRadius: '10px', marginBottom: '20px', fontSize: '12px', border:'1px solid #b2dbff' }}>
                                <b>Añadir Jugador: </b>
                                <input placeholder="Nombre" value={newPlayer.name} onChange={e => setNewPlayer({...newPlayer, name: e.target.value})} style={{width:'80px', padding:6, borderRadius:4, border:'1px solid #ccc'}} />
                                <select value={newPlayer.team_id} onChange={e => setNewPlayer({...newPlayer, team_id: e.target.value})} style={{padding:6, borderRadius:4, border:'1px solid #ccc'}}>
                                    <option value="">Equipo...</option>
                                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                                <button onClick={async () => { await axios.post(`${API_URL}/players`, newPlayer); loadData(); setNewPlayer({name:'', team_id:'', is_goalkeeper:false}); }} style={{padding:'6px 12px'}}>OK</button>
                            </div>
                        )}

                        <div style={{ background: '#333', color: 'white', padding: '10px', borderRadius: '8px', fontSize: '12px', marginBottom: '15px', textAlign:'center', fontWeight:'bold' }}>{tournamentInfo?.type === 'liga' ? 'LIGA REGULAR' : '1. FASE DE GRUPOS'}</div>
                        {matches.filter(m => m.phase === 'grupo' || m.phase === 'liga').map(m => <MatchCard key={m.id} m={m} />)}

                        {tournamentInfo?.type === 'campeonato' && (
                            <>
                                <div style={{ background: '#007bff', color: 'white', padding: '10px', borderRadius: '8px', fontSize: '12px', marginBottom: '15px', marginTop:'40px', textAlign:'center', fontWeight:'bold' }}>2. CUARTOS DE FINAL</div>
                                {qMatches.length > 0 ? qMatches.map(m => <MatchCard key={m.id} m={m} />) : 
                                    isAdmin && standingsList.length === 8 && <button onClick={() => activatePhase('cuartos', [{a: standingsList[0].id, b: standingsList[7].id, field: 1}, {a: standingsList[1].id, b: standingsList[6].id, field: 2}, {a: standingsList[2].id, b: standingsList[5].id, field: 1}, {a: standingsList[3].id, b: standingsList[4].id, field: 2}])} style={{width:'100%', padding:15, background:'#28a745', color:'#fff', borderRadius:8, fontWeight:'bold', border:'none'}}>ACTIVAR CUARTOS</button>
                                }
                            </>
                        )}

                        <div style={{ background: '#198754', color: 'white', padding: '10px', borderRadius: '8px', fontSize: '12px', marginBottom: '15px', marginTop:'40px', textAlign:'center', fontWeight:'bold' }}>3. SEMIFINALES</div>
                        {sMatches.length > 0 ? sMatches.map(m => <MatchCard key={m.id} m={m} />) : 
                            isAdmin && qMatches.length === 4 && qMatches.every(m => m.played) && <button onClick={() => activatePhase('semi', [{a: getWinnerId(qMatches[0]), b: getWinnerId(qMatches[3]), field: 1}, {a: getWinnerId(qMatches[1]), b: getWinnerId(qMatches[2]), field: 2}])} style={{width:'100%', padding:15, background:'#28a745', color:'#fff', borderRadius:8, fontWeight:'bold', border:'none'}}>ACTIVAR SEMIFINALES</button>
                        }

                        <div style={{ background: '#ffc107', color: 'black', padding: '10px', borderRadius: '8px', fontSize: '12px', marginBottom: '15px', marginTop:'40px', textAlign:'center', fontWeight:'bold' }}>4. GRAN FINAL</div>
                        {fMatches.length > 0 ? fMatches.map(m => <MatchCard key={m.id} m={m} />) : 
                            isAdmin && sMatches.length === 2 && sMatches.every(m => m.played) && <button onClick={() => activatePhase('final', [{a: getWinnerId(sMatches[0]), b: getWinnerId(sMatches[1]), field: 1}])} style={{width:'100%', padding:15, background:'#28a745', color:'#fff', borderRadius:8, fontWeight:'bold', border:'none'}}>ACTIVAR FINAL</button>
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

            {/* MODAL DE EDICIÓN */}
            {editingMatch && (
                <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.85)', zIndex:2000, padding:20, display:'flex', alignItems:'center'}}>
                    <div style={{background:'#fff', width:'100%', padding:20, borderRadius:15}}>
                        <h4 style={{marginTop:0}}>Editar Partido</h4>
                        <label style={{fontSize:12}}>Fecha y Hora:</label>
                        <input type="datetime-local" value={editingMatch.match_date?.replace(' ', 'T').slice(0, 16)} onChange={e => setEditingMatch({...editingMatch, match_date: e.target.value})} style={{width:'100%', padding:12, marginBottom:15, borderRadius:8, border:'1px solid #ccc'}} />
                        <label style={{fontSize:12}}>Árbitro:</label>
                        <input placeholder="Nombre Árbitro" value={editingMatch.referee} onChange={e => setEditingMatch({...editingMatch, referee: e.target.value})} style={{width:'100%', padding:12, marginBottom:15, borderRadius:8, border:'1px solid #ccc'}} />
                        <button onClick={() => handleSaveMatch(editingMatch)} style={{width:'100%', padding:15, background:'#198754', color:'#fff', marginBottom:10, borderRadius:8, border:'none', fontWeight:'bold'}}>GUARDAR CAMBIOS</button>
                        <button onClick={() => setEditingMatch(null)} style={{width:'100%', padding:12, background:'#eee', border:'none', borderRadius:8}}>CERRAR</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TournamentView;