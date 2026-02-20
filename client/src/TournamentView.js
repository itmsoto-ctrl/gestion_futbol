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

    useEffect(() => { loadData(); }, [id]);

    const loadData = async () => {
        try {
            const [resM, resT, resP, resS, resTourneys] = await Promise.all([
                axios.get(`https://gestionfutbol-production.up.railway.app/matches/${id}`),
                axios.get(`https://gestionfutbol-production.up.railway.app/teams/${id}`),
                axios.get(`https://gestionfutbol-production.up.railway.app/players/${id}`),
                axios.get(`https://gestionfutbol-production.up.railway.app/stats/${id}`),
                axios.get(`https://gestionfutbol-production.up.railway.app/tournaments`)
            ]);
            setMatches(resM.data || []);
            setTeams(resT.data || []);
            setPlayers(resP.data || []);
            setStats(resS.data || { goleadores: [], porteros: [] });
            setTournamentInfo(resTourneys.data.find(t => t.id === parseInt(id)));
            setLoading(false);
        } catch (error) { console.error(error); setLoading(false); }
    };

    // --- ACCIONES ---
    const handleAddTeam = async () => {
        const limit = tournamentInfo?.type === 'liga' ? 6 : 8;
        if (teams.length >= limit) return alert(`Límite de ${limit} equipos alcanzado`);
        if (!newTeam.name) return alert("Escribe el nombre del equipo");
        await axios.post('https://gestionfutbol-production.up.railway.app/teams', { ...newTeam, tournament_id: id });
        setNewTeam({ name: '', group_num: 1, logo_url: '' });
        loadData();
    };

    const handleDeleteTeam = async (teamId) => {
        if (!window.confirm("¿Borrar este equipo?")) return;
        await axios.delete(`https://gestionfutbol-production.up.railway.app/teams/${teamId}`);
        loadData();
    };

    const handleGenerateSchedule = async () => {
        if (tournamentInfo.type === 'campeonato') {
            const g1 = teams.filter(t => t.group_num === 1);
            const g2 = teams.filter(t => t.group_num === 2);
            if (g1.length !== 4 || g2.length !== 4) {
                return alert(`Error: Debes tener 4 equipos en el Grupo 1 (tienes ${g1.length}) y 4 en el Grupo 2 (tienes ${g2.length})`);
            }
            if (!startDate) return alert("Selecciona fecha y hora de inicio");
        }
        
        const route = tournamentInfo.type === 'liga' ? 'generate-league' : 'generate-schedule';
        try {
            await axios.post(`https://gestionfutbol-production.up.railway.app/${route}/${id}`, { startTime: startDate });
            loadData();
        } catch (e) { alert("Error al generar calendario. Revisa los grupos."); }
    };

    const addGoal = async (mId, pId, tId, side) => {
        if (!isAdmin) return;
        await axios.post('https://gestionfutbol-production.up.railway.app/add-player-goal', { match_id: mId, player_id: pId, team_id: tId, team_side: side });
        loadData();
    };

    const removeGoal = async (mId, pId, tId, side) => {
        if (!isAdmin) return;
        await axios.post('https://gestionfutbol-production.up.railway.app/remove-player-goal', { match_id: mId, player_id: pId, team_id: tId, team_side: side });
        loadData();
    };

    const handleSaveMatch = async (m) => {
        await axios.put(`https://gestionfutbol-production.up.railway.app/matches/${m.id}`, m);
        setEditingMatch(null);
        loadData();
    };

    // --- RENDER PARTIDO ---
    const MatchCard = ({ m }) => (
        <div style={{ border: '1px solid #ddd', borderRadius: '15px', background: 'white', marginBottom: '15px', overflow:'hidden' }}>
            <div style={{ background: '#f8f9fa', padding: '8px', fontSize: '10px', display:'flex', justifyContent:'space-between', borderBottom:'1px solid #eee' }}>
                <span>📅 {m.match_date ? new Date(m.match_date).toLocaleString([], {day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'}) : 'S/F'}</span>
                <span>🏟️ C{m.field} | 👤 {m.referee || 'S/A'}</span>
            </div>
            <div style={{ display: 'flex', padding: '15px 10px', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, textAlign: 'center' }}>
                    <img src={m.team_a_logo || 'https://via.placeholder.com/40'} width="40" height="40" style={{borderRadius:'50%'}} />
                    <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{m.team_a_name}</div>
                    {isAdmin && players.filter(p => p.team_id === m.team_a_id).map(p => (
                        <div key={p.id} style={{marginTop:5}}><button onClick={() => addGoal(m.id, p.id, m.team_a_id, 'team_a_goals')} style={{padding:'8px 4px', width:'80%', fontSize:11}}>⚽ {p.name}</button></div>
                    ))}
                </div>
                <div style={{ flex: 0.4, textAlign: 'center', fontSize: 24, fontWeight: 'bold' }}>{m.team_a_goals} - {m.team_b_goals}</div>
                <div style={{ flex: 1, textAlign: 'center' }}>
                    <img src={m.team_b_logo || 'https://via.placeholder.com/40'} width="40" height="40" style={{borderRadius:'50%'}} />
                    <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{m.team_b_name}</div>
                    {isAdmin && players.filter(p => p.team_id === m.team_b_id).map(p => (
                        <div key={p.id} style={{marginTop:5}}><button onClick={() => addGoal(m.id, p.id, m.team_b_id, 'team_b_goals')} style={{padding:'8px 4px', width:'80%', fontSize:11}}>{p.name} ⚽</button></div>
                    ))}
                </div>
            </div>
            {isAdmin && <div style={{textAlign:'center', paddingBottom:10}}><button onClick={() => setEditingMatch({...m})} style={{fontSize:10}}>✏️ Editar detalles</button></div>}
        </div>
    );

    if (loading) return <div style={{padding:50, textAlign:'center'}}>Cargando...</div>;

    const qMatches = matches.filter(m => m.phase === 'cuartos');
    const sMatches = matches.filter(m => m.phase === 'semi');
    const fMatches = matches.filter(m => m.phase === 'final');

    return (
        <div style={{ padding: '10px', fontFamily: 'Arial', maxWidth: '500px', margin: 'auto', background: '#f4f4f4', minHeight:'100vh' }}>
            
            {/* CABECERA */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', background:'#000', color:'#fff', padding:15, borderRadius:10, marginBottom:20 }}>
                <button onClick={() => navigate('/dashboard')} style={{background:'#333', color:'#fff', border:'none', padding:8, borderRadius:5}}>⬅</button>
                <div style={{textAlign:'center'}}><div style={{fontSize:14, fontWeight:'bold'}}>{tournamentInfo?.name}</div><div style={{fontSize:9, color:'#2ecc71'}}>ADMIN</div></div>
                <button onClick={() => setShowTable(!showTable)} style={{background:'#007bff', color:'#fff', border:'none', padding:8, borderRadius:5}}>{showTable ? '⚽' : '📊'}</button>
            </div>

            {/* CONFIGURACIÓN DE EQUIPOS (Antes de generar calendario) */}
            {isAdmin && matches.length === 0 && (
                <div style={{ background: '#fff', padding: 15, borderRadius: 15, marginBottom: 20, boxShadow:'0 2px 5px rgba(0,0,0,0.1)' }}>
                    <h3 style={{marginTop:0, fontSize:16}}>1. Registro de Equipos ({teams.length}/{tournamentInfo?.type === 'liga' ? 6 : 8})</h3>
                    <div style={{display:'flex', flexDirection:'column', gap:10}}>
                        <input placeholder="Nombre Equipo" value={newTeam.name} onChange={e => setNewTeam({...newTeam, name: e.target.value})} style={{padding:10}} />
                        <input placeholder="URL Logo" value={newTeam.logo_url} onChange={e => setNewTeam({...newTeam, logo_url: e.target.value})} style={{padding:10}} />
                        
                        {tournamentInfo?.type === 'campeonato' && (
                            <select value={newTeam.group_num} onChange={e => setNewTeam({...newTeam, group_num: parseInt(e.target.value)})} style={{padding:10}}>
                                <option value="1">Grupo 1</option>
                                <option value="2">Grupo 2</option>
                            </select>
                        )}
                        <button onClick={handleAddTeam} style={{padding:12, background:'#000', color:'#fff', fontWeight:'bold', borderRadius:8}}>AÑADIR EQUIPO</button>
                    </div>

                    <div style={{marginTop:20}}>
                        <h4 style={{fontSize:12, color:'#666'}}>Equipos actuales:</h4>
                        {teams.map(t => (
                            <div key={t.id} style={{display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid #eee', fontSize:13}}>
                                <span>{t.name} (G{t.group_num})</span>
                                <button onClick={() => handleDeleteTeam(t.id)} style={{color:'red', border:'none', background:'none'}}>Eliminar</button>
                            </div>
                        ))}
                    </div>

                    {((tournamentInfo?.type==='campeonato' && teams.length===8) || (tournamentInfo?.type==='liga' && teams.length===6)) && (
                        <div style={{marginTop:20, paddingTop:15, borderTop:'2px solid #f4f4f4'}}>
                            {tournamentInfo.type === 'campeonato' && <><label style={{fontSize:11}}>INICIO PRIMER PARTIDO:</label><br/><input type="datetime-local" onChange={e => setStartDate(e.target.value)} style={{width:'100%', padding:10, marginBottom:10}} /></>}
                            <button onClick={handleGenerateSchedule} style={{width:'100%', padding:15, background:'#28a745', color:'#fff', fontWeight:'bold', border:'none', borderRadius:8}}>GENERAR CALENDARIO OFICIAL</button>
                        </div>
                    )}
                </div>
            )}

            {/* RESTO DE LA APP (PARTIDOS, TABLA, ETC.) */}
            {!showTable ? (
                <div>
                    {matches.length > 0 && <div style={{textAlign:'center', fontWeight:'bold', padding:10, background:'#333', color:'#fff', borderRadius:8, marginBottom:15}}>PARTIDOS</div>}
                    {matches.map(m => <MatchCard key={m.id} m={m} />)}
                    {/* Editor Inline */}
                    {editingMatch && (
                        <div style={{position:'fixed', bottom:0, left:0, width:'100%', background:'#fff', padding:20, boxShadow:'0 -5px 20px rgba(0,0,0,0.2)', zIndex:2000}}>
                            <h4>Editar Partido</h4>
                            <input type="datetime-local" value={editingMatch.match_date?.slice(0,16)} onChange={e => setEditingMatch({...editingMatch, match_date: e.target.value})} style={{width:'100%', padding:10, marginBottom:10}} />
                            <input placeholder="Árbitro" value={editingMatch.referee} onChange={e => setEditingMatch({...editingMatch, referee: e.target.value})} style={{width:'100%', padding:10, marginBottom:10}} />
                            <div style={{display:'flex', gap:10}}><button onClick={() => handleSaveMatch(editingMatch)} style={{flex:1, padding:10, background:'green', color:'#fff'}}>Guardar</button><button onClick={() => setEditingMatch(null)} style={{flex:1, padding:10}}>Cerrar</button></div>
                        </div>
                    )}
                </div>
            ) : (
                /* TABLA DE CLASIFICACIÓN (La que ya tenías) */
                <div style={{background:'#fff', padding:15, borderRadius:15}}>
                    <h3>Clasificación</h3>
                    <table width="100%">
                        <thead><tr style={{textAlign:'left', fontSize:11, color:'#888'}}><th>POS</th><th>EQUIPO</th><th>PTS</th></tr></thead>
                        <tbody>{getStandings().map((t, i) => (
                            <tr key={t.id} style={{borderBottom:'1px solid #eee'}}><td style={{padding:'10px 0'}}>{i+1}</td><td>{t.name}</td><td style={{fontWeight:'bold'}}>{t.pts}</td></tr>
                        ))}</tbody>
                    </table>
                </div>
            )}

            {/* ESTADÍSTICAS */}
            <div style={{marginTop:30, padding:15, background:'#fff', borderRadius:15}}>
                <h4>🏆 Máximos Goleadores</h4>
                {stats.goleadores.map((g,i) => <div key={i} style={{fontSize:13, padding:'5px 0', borderBottom:'1px solid #f9f9f9'}}>{i+1}. {g.name} ({g.team_name}) - <b>{g.total_goals}</b></div>)}
            </div>
        </div>
    );
};

export default TournamentView;