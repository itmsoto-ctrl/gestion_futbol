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

    // --- CLASIFICACIÓN (ESTA FUNCIÓN CONTROLA EL CUADRO AHORA) ---
    const getStandings = () => {
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
    };

    const standingsList = getStandings();
    const getTeamByRank = (rank) => standingsList[rank - 1] || { name: `${rank}º...`, id: null };
    const getWinner = (m) => {
        if (!m || !m.played) return { name: '???' };
        return m.team_a_goals > m.team_b_goals ? { name: m.team_a_name } : { name: m.team_b_name };
    };

    // --- ACCIONES ---
    const addGoal = async (mId, pId, tId, side) => {
        if (!isAdmin) return;
        await axios.post(`${API_URL}/add-player-goal`, { match_id: mId, player_id: pId, team_id: tId, team_side: side });
        loadData(); 
    };

    const handleSaveMatch = async (m) => {
        await axios.put(`${API_URL}/matches/${m.id}`, m);
        setEditingMatch(null);
        loadData();
    };

    // --- RENDERIZADO ---
    const MatchCard = ({ m }) => {
        const isExpanded = expandedMatchId === m.id;
        return (
            <div onClick={() => isAdmin && setExpandedMatchId(isExpanded ? null : m.id)}
                 style={{ border: '1px solid #ddd', borderRadius: '15px', background: 'white', marginBottom: '15px', overflow:'hidden', boxShadow:'0 3px 6px rgba(0,0,0,0.05)' }}>
                <div style={{ background: '#f8f9fa', padding: '10px', fontSize: '10px', display:'flex', justifyContent:'space-between' }}>
                    <span>📅 {m.match_date ? m.match_date.split(' ')[0] : ''} | 🕒 {m.match_date ? m.match_date.split(' ')[1]?.slice(0,5) : ''}</span>
                    <span>🏟️ C{m.field} | 👤 {m.referee}</span>
                </div>
                <div style={{ display: 'flex', padding: '15px 5px', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{ flex: '1 1 35%', textAlign: 'center' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '12px' }}>{m.team_a_name}</div>
                        {isExpanded && isAdmin && players.filter(p => p.team_id === m.team_a_id).map(p => (
                            <button key={p.id} onClick={(e) => { e.stopPropagation(); addGoal(m.id, p.id, m.team_a_id, 'team_a_goals'); }} style={{padding:'12px 4px', width:'100%', fontSize:12, marginTop:5}}>⚽ {p.name}</button>
                        ))}
                    </div>
                    <div style={{ flex: '0 0 28%', textAlign: 'center', fontSize: 24, fontWeight: 'bold' }}>{m.team_a_goals} - {m.team_b_goals}</div>
                    <div style={{ flex: '1 1 35%', textAlign: 'center' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '12px' }}>{m.team_b_name}</div>
                        {isExpanded && isAdmin && players.filter(p => p.team_id === m.team_b_id).map(p => (
                            <button key={p.id} onClick={(e) => { e.stopPropagation(); addGoal(m.id, p.id, m.team_b_id, 'team_b_goals'); }} style={{padding:'14px 4px', width:'100%', fontSize:12, marginTop:5}}>{p.name} ⚽</button>
                        ))}
                    </div>
                </div>
                {isAdmin && isExpanded && <button onClick={(e) => { e.stopPropagation(); setEditingMatch({...m}); }} style={{fontSize:9, margin:10}}>✏️ EDITAR</button>}
            </div>
        );
    };

    if (loading) return <div>Cargando...</div>;

    // Filtros por nombre flexible
    const qMatches = matches.filter(m => m.phase.toLowerCase().includes('cuartos'));
    const sMatches = matches.filter(m => m.phase.toLowerCase().includes('semi'));
    const fMatches = matches.filter(m => m.phase.toLowerCase().includes('final'));

    return (
        <div style={{ padding: '0 0 50px 0', fontFamily: 'Arial', maxWidth: '600px', margin: 'auto', background: '#f8f9fa', minHeight: '100vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#000', padding: '15px 20px', color: 'white', position: 'sticky', top: 0, zIndex: 1000 }}>
                <button onClick={() => navigate('/dashboard')} style={{ background: 'none', color: 'white', border: 'none', fontSize:'20px' }}>←</button>
                <div style={{textAlign:'center'}}><div style={{fontSize:'14px', fontWeight:'bold'}}>{tournamentInfo?.name}</div></div>
                <button onClick={() => setShowTable(!showTable)} style={{ background: '#007bff', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '8px' }}>{showTable ? '⚽' : '📊'}</button>
            </div>

            <div style={{ padding: '15px' }}>
                {/* CUADRO DE ELIMINATORIAS (DINÁMICO REAL-TIME) */}
                {!showTable && tournamentInfo?.type === 'campeonato' && (
                    <div style={{ background: '#fff', padding: '15px', borderRadius: '15px', marginBottom: '30px', border: '1px solid #eee' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '5px' }}>
                            <div style={{ flex: 1.2 }}>
                                {[ [1,8], [2,7], [3,6], [4,5] ].map((pair, i) => (
                                    <div key={i} style={{ background: '#f8f9fa', marginBottom: '5px', padding: '5px', borderRadius: '5px', fontSize: '9px' }}>
                                        <div style={{display:'flex', justifyContent:'space-between'}}><span>{qMatches[i] ? qMatches[i].team_a_name : getTeamByRank(pair[0]).name}</span><b>{qMatches[i]?.team_a_goals ?? ''}</b></div>
                                        <div style={{display:'flex', justifyContent:'space-between', borderTop:'1px solid #fff'}}><span>{qMatches[i] ? qMatches[i].team_b_name : getTeamByRank(pair[1]).name}</span><b>{qMatches[i]?.team_b_goals ?? ''}</b></div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ flex: 1, display:'flex', flexDirection:'column', justifyContent:'space-around', fontSize:8, textAlign:'center' }}>
                                {[0,1].map(i => (
                                    <div key={i} style={{border:'1px dashed #ccc', padding:5, borderRadius:5}}>
                                        <div>{sMatches[i] ? sMatches[i].team_a_name : getWinner(qMatches[i*2]).name}</div>
                                        <div>{sMatches[i] ? sMatches[i].team_b_name : getWinner(qMatches[i*2+1]).name}</div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ flex: 0.8, display:'flex', alignItems:'center' }}><div style={{ height:'60px', width:'100%', background:'#fff3cd', border:'2px solid #ffeeba', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10 }}>🏆 {fMatches[0] ? getWinner(fMatches[0]).name : 'FINAL'}</div></div>
                        </div>
                    </div>
                )}

                {!showTable ? (
                    <div>
                        <div style={{ background: '#333', color: 'white', padding: '10px', borderRadius: '8px', fontSize: '12px', marginBottom: '15px', textAlign:'center' }}>FASE DE GRUPOS / LIGA</div>
                        {matches.filter(m => m.phase.includes('grupo') || m.phase.includes('liga')).map(m => <MatchCard key={m.id} m={m} />)}
                        
                        <div style={{ background: '#007bff', color: 'white', padding: '10px', borderRadius: '8px', fontSize: '12px', marginBottom: '15px', textAlign:'center', marginTop:30 }}>CUARTOS</div>
                        {qMatches.map(m => <MatchCard key={m.id} m={m} />)}

                        <div style={{ background: '#198754', color: 'white', padding: '10px', borderRadius: '8px', fontSize: '12px', marginBottom: '15px', textAlign:'center', marginTop:30 }}>SEMIFINALES</div>
                        {sMatches.map(m => <MatchCard key={m.id} m={m} />)}

                        <div style={{ background: '#ffc107', color: 'black', padding: '10px', borderRadius: '8px', fontSize: '12px', marginBottom: '15px', textAlign:'center', marginTop:30 }}>FINAL</div>
                        {fMatches.map(m => <MatchCard key={m.id} m={m} />)}
                    </div>
                ) : (
                    <div style={{ background: 'white', padding: '15px', borderRadius: '15px' }}>
                        <h3>📊 Clasificación</h3>
                        <table width="100%" style={{ fontSize: '13px' }}>
                            <thead><tr style={{textAlign:'left', color:'#888'}}><th>POS</th><th>EQUIPO</th><th>PTS</th></tr></thead>
                            <tbody>{standingsList.map((t, i) => (
                                <tr key={t.id} style={{ borderBottom: '1px solid #f8f9fa' }}><td style={{padding:'15px 0'}}>{i + 1}</td><td>{t.name}</td><td style={{fontWeight:'bold'}}>{t.pts}</td></tr>
                            ))}</tbody>
                        </table>
                    </div>
                )}
            </div>

            {editingMatch && (
                <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.85)', zIndex:2000, padding:20, display:'flex', alignItems:'center'}}>
                    <div style={{background:'#fff', width:'100%', padding:20, borderRadius:15}}>
                        <h4>Editar</h4>
                        <input type="datetime-local" value={editingMatch.match_date?.replace(' ', 'T').slice(0, 16)} onChange={e => setEditingMatch({...editingMatch, match_date: e.target.value})} style={{width:'100%', padding:12, marginBottom:15}} />
                        <button onClick={() => handleSaveMatch(editingMatch)} style={{width:'100%', padding:15, background:'green', color:'#fff'}}>GUARDAR</button>
                        <button onClick={() => setEditingMatch(null)} style={{width:'100%', marginTop:10}}>CERRAR</button>
                    </div>
                </div>
            )}
        </div>
    );
};
export default TournamentView;