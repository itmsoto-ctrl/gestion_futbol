import React, { useState, useEffect } from 'react';
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

    // --- CORRECCIÓN HORARIA TIPO TEXTO (SIN OFFSET) ---
    const formatDisplayTime = (dateStr) => {
        if (!dateStr) return "--:--";
        // Extraemos HH:mm directamente del string de la DB (formato YYYY-MM-DD HH:mm:ss)
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
        return Object.values(table).sort((a, b) => b.pts - a.pts || (b.gf - b.gc) - (a.gf - a.gc));
    };

    const standingsList = getStandings();
    const getTeamByRank = (rank) => standingsList[rank - 1] || { name: `${rank}º Clasif.` };
    const getWinnerId = (m) => (m?.team_a_goals > m?.team_b_goals ? m.team_a_id : m?.team_b_id);

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
        } catch (e) { alert("Error al quitar gol"); }
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

    // --- TARJETA PARTIDO ---
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
                            <button onClick={() => addGoal(m.id, p.id, m.team_a_id, 'team_a_goals')} style={{padding:'12px 4px', width:'80%', fontSize:12, fontWeight:'bold', borderRadius:8, border:'1px solid #ccd', background:'#f0f4ff'}}>⚽ {p.name}</button>
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

    const qMatches = matches.filter(m => m.phase === 'cuartos');
    const sMatches = matches.filter(m => m.phase === 'semi');
    const fMatches = matches.filter(m => m.phase === 'final');
    const allGroupsPlayed = matches.filter(m => m.phase === 'grupo').length > 0 && matches.filter(m => m.phase === 'grupo').every(m => m.played);

    if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>Cargando Torneo...</div>;

    return (
        <div style={{ padding: '0 0 50px 0', fontFamily: 'Arial', maxWidth: '600px', margin: 'auto', background: '#f8f9fa', minHeight: '100vh' }}>
            
            {/* CABECERA FIJA */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#000', padding: '15px 20px', color: 'white', position: 'sticky', top: 0, zIndex: 1000 }}>
                <button onClick={() => navigate('/dashboard')} style={{ background: 'none', color: 'white', border: 'none', fontSize:'20px' }}>←</button>
                <div style={{textAlign:'center'}}>
                    <div style={{fontSize:'14px', fontWeight:'bold'}}>{tournamentInfo?.name}</div>
                    <div style={{fontSize:'9px', color:isAdmin?'#2ecc71':'#f1c40f'}}>{isAdmin?'ADMINISTRADOR':'LECTURA'}</div>
                </div>
                <button onClick={() => setShowTable(!showTable)} style={{ background: '#007bff', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '8px', fontSize: '12px', fontWeight:'bold' }}>{showTable ? '⚽' : '📊'}</button>
            </div>

            <div style={{ padding: '15px' }}>
                
                {/* CUADRO ELIMINATORIAS (CUARTOS, SEMIS Y FINAL) */}
                {!showTable && tournamentInfo?.type === 'campeonato' && teams.length === 8 && (
                    <div style={{ background: '#fff', padding: '15px', borderRadius: '15px', marginBottom: '30px', border: '1px solid #eee', boxShadow:'0 4px 10px rgba(0,0,0,0.05)' }}>
                        <h4 style={{ textAlign: 'center', margin: '0 0 10px 0', fontSize: '12px' }}>🏆 CUADRO DE PLAYOFFS</h4>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '5px' }}>
                            {/* COLUMNA CUARTOS */}
                            <div style={{ flex: 1.2 }}>
                                {[0,1,2,3].map(i => (
                                    <div key={i} style={{ background: '#f8f9fa', marginBottom: '5px', padding: '5px', borderRadius: '5px', border: '1px solid #eee', fontSize: '9px' }}>
                                        <div>{qMatches[i] ? qMatches[i].team_a_name : standings[i]?.name || '1º...'} <b>{qMatches[i]?.team_a_goals ?? ''}</b></div>
                                        <div style={{borderTop:'1px solid #fff'}}>{qMatches[i] ? qMatches[i].team_b_name : standings[7-i]?.name || '8º...'} <b>{qMatches[i]?.team_b_goals ?? ''}</b></div>
                                    </div>
                                ))}
                            </div>
                            {/* COLUMNA SEMIFINALES */}
                            <div style={{ flex: 1, display:'flex', flexDirection:'column', justifyContent:'space-around' }}>
                                {[0, 1].map(i => (
                                    <div key={i} style={{ background: '#f0f7ff', padding: '5px', borderRadius: '5px', border: '1px solid #c2dbff', fontSize: '9px' }}>
                                        <div>{sMatches[i] ? sMatches[i].team_a_name : 'Ganador...'} {sMatches[i]?.team_a_goals ?? ''}</div>
                                        <div style={{borderTop:'1px solid #fff'}}>{sMatches[i] ? sMatches[i].team_b_name : 'Ganador...'} {sMatches[i]?.team_b_goals ?? ''}</div>
                                    </div>
                                ))}
                            </div>
                            {/* COLUMNA FINAL */}
                            <div style={{ flex: 0.8, display:'flex', alignItems:'center' }}>
                                <div style={{ height:'60px', width:'100%', background:'#fff3cd', border:'2px solid #ffeeba', borderRadius:'8px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontSize:'8px', textAlign:'center' }}>
                                    <b>{fMatches[0] ? fMatches[0].team_a_name : 'Finalista 1'}</b>
                                    <span style={{fontSize:12, fontWeight:900}}>{fMatches[0] ? `${fMatches[0].team_a_goals}-${fMatches[0].team_b_goals}` : 'vs'}</span>
                                    <b>{fMatches[0] ? fMatches[0].team_b_name : 'Finalista 2'}</b>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {!showTable ? (
                    <div>
                        {/* BOTONES DE ACTIVACIÓN DE FASES */}
                        {isAdmin && (
                            <div style={{marginBottom:20}}>
                                {allGroupsPlayed && qMatches.length === 0 && <button onClick={() => activatePhase('cuartos', [{a: standings[0].id, b: standings[7].id, field: 1}, {a: standings[1].id, b: standings[6].id, field: 2}, {a: standings[2].id, b: standings[5].id, field: 1}, {a: standings[3].id, b: standings[4].id, field: 2}])} style={{width:'100%', padding:15, background:'#28a745', color:'#fff', border:'none', borderRadius:10, fontWeight:'bold'}}>⚡ ACTIVAR CUARTOS DE FINAL</button>}
                                {qMatches.length === 4 && qMatches.every(m => m.played) && sMatches.length === 0 && <button onClick={() => activatePhase('semi', [{a: getWinnerId(qMatches[0]), b: getWinnerId(qMatches[3]), field: 1}, {a: getWinnerId(qMatches[1]), b: getWinnerId(qMatches[2]), field: 2}])} style={{width:'100%', padding:15, background:'#28a745', color:'#fff', border:'none', borderRadius:10, fontWeight:'bold'}}>⚡ ACTIVAR SEMIFINALES</button>}
                                {sMatches.length === 2 && sMatches.every(m => m.played) && fMatches.length === 0 && <button onClick={() => activatePhase('final', [{a: getWinnerId(sMatches[0]), b: getWinnerId(sMatches[1]), field: 1}])} style={{width:'100%', padding:15, background:'#28a745', color:'#fff', border:'none', borderRadius:10, fontWeight:'bold'}}>⚡ ACTIVAR GRAN FINAL</button>}
                            </div>
                        )}

                        <div style={{ background: '#333', color: 'white', padding: '10px', borderRadius: '8px', fontSize: '12px', marginBottom: '15px', textAlign:'center', fontWeight:'bold' }}>PARTIDOS</div>
                        
                        {/* LISTADO DE PARTIDOS EN ORDEN */}
                        {matches.filter(m => m.phase === 'grupo' || m.phase === 'liga').map(m => <MatchCard key={m.id} m={m} />)}
                        {qMatches.length > 0 && <div style={{ background: '#007bff', color: 'white', padding: '10px', borderRadius: '8px', fontSize: '12px', marginBottom: '15px', textAlign:'center', fontWeight:'bold' }}>CUARTOS DE FINAL</div>}
                        {qMatches.map(m => <MatchCard key={m.id} m={m} />)}
                        {sMatches.length > 0 && <div style={{ background: '#198754', color: 'white', padding: '10px', borderRadius: '8px', fontSize: '12px', marginBottom: '15px', textAlign:'center', fontWeight:'bold' }}>SEMIFINALES</div>}
                        {sMatches.map(m => <MatchCard key={m.id} m={m} />)}
                        {fMatches.length > 0 && <div style={{ background: '#ffc107', color: 'black', padding: '10px', borderRadius: '8px', fontSize: '12px', marginBottom: '15px', textAlign:'center', fontWeight:'bold' }}>GRAN FINAL</div>}
                        {fMatches.map(m => <MatchCard key={m.id} m={m} />)}
                    </div>
                ) : (
                    /* CLASIFICACIÓN */
                    <div style={{ background: 'white', padding: '15px', borderRadius: '15px' }}>
                        <h3>📊 Clasificación</h3>
                        <table width="100%" style={{ fontSize: '13px' }}>
                            <thead><tr style={{textAlign:'left', color:'#888'}}><th>POS</th><th>EQUIPO</th><th>PTS</th><th>GF</th></tr></thead>
                            <tbody>{standings.map((t, i) => (
                                <tr key={t.id} style={{ borderBottom: '1px solid #f8f9fa' }}><td style={{padding:'15px 0'}}>{i + 1}</td><td>{t.name}</td><td style={{fontWeight:'bold', color:'#007bff'}}>{t.pts}</td><td>{t.gf}</td></tr>
                            ))}</tbody>
                        </table>
                    </div>
                )}
                
                {/* ESTADÍSTICAS */}
                <div style={{ marginTop: '50px', background: 'white', padding: '20px', borderRadius: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                    <h4 style={{margin: '0 0 15px 0'}}>🏆 Goleadores (Pichichi)</h4>
                    {stats.goleadores.map((g, i) => <div key={i} style={{fontSize:13, padding:'10px 0', borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between'}}><span>{i+1}. {g.name} ({g.team_name})</span><b>{g.total_goals} ⚽</b></div>)}
                    <h4 style={{margin: '30px 0 15px 0'}}>🧤 Porteros (Zamora)</h4>
                    {stats.porteros.map((p, i) => <div key={i} style={{fontSize:13, padding:'10px 0', borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between'}}><span>{i+1}. {p.name} ({p.team_name})</span><b style={{color:'red'}}>{p.goals_against} 🥅</b></div>)}
                </div>
            </div>

            {/* MODAL DE EDICIÓN */}
            {editingMatch && (
                <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.85)', zIndex:2000, padding:20, display:'flex', alignItems:'center'}}>
                    <div style={{background:'#fff', width:'100%', padding:20, borderRadius:15}}>
                        <h4 style={{marginTop:0}}>Editar Partido</h4>
                        <label style={{fontSize:12}}>Fecha y Hora (Tal cual se verá):</label>
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