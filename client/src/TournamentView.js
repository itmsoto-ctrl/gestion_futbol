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

    // --- CÁLCULO DE CLASIFICACIÓN REAL-TIME ---
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
    const getProjectedName = (rank) => standingsList[rank - 1]?.name || `${rank}º Clasif.`;

    // --- FORMATEO DE FECHA/HORA (EVITA ERRORES DE ZONA HORARIA) ---
    const formatTime = (str) => {
        if (!str) return "--:--";
        const timePart = str.includes('T') ? str.split('T')[1] : str.split(' ')[1];
        return timePart ? timePart.substring(0, 5) : "--:--";
    };

    const formatDate = (str) => {
        if (!str) return "S/F";
        const datePart = str.split('T')[0].split(' ')[0];
        const [y, m, d] = datePart.split('-');
        return `${d}/${m}`;
    };

    // --- ACCIONES ---
    const addGoal = async (mId, pId, tId, side) => {
        await axios.post(`${API_URL}/add-player-goal`, { match_id: mId, player_id: pId, team_id: tId, team_side: side });
        loadData(); 
    };

    const removeGoal = async (mId, pId, tId, side) => {
        try {
            await axios.post(`${API_URL}/remove-player-goal`, { match_id: mId, player_id: pId, team_id: tId, team_side: side });
            loadData();
        } catch (e) { alert("Error al quitar gol"); }
    };

    const toggleExpand = (mId) => {
        if (!isAdmin) return;
        setExpandedMatchId(expandedMatchId === mId ? null : mId);
    };

    // --- COMPONENTE PARTIDO ---
    const MatchCard = ({ m }) => {
        const isExpanded = expandedMatchId === m.id;
        return (
            <div 
                onClick={() => !isExpanded && toggleExpand(m.id)}
                style={{ border: '1px solid #ddd', borderRadius: '15px', background: 'white', marginBottom: '15px', overflow:'hidden', boxShadow:'0 3px 6px rgba(0,0,0,0.05)', cursor: isAdmin ? 'pointer' : 'default' }}
            >
                <div style={{ background: '#f8f9fa', padding: '8px 15px', fontSize: '10px', color: '#666', borderBottom: '1px solid #eee', display:'flex', justifyContent:'space-between' }}>
                    <span>📅 {formatDate(m.match_date)} | 🕒 {formatTime(m.match_date)}</span>
                    <span>🏟️ C{m.field} | 👤 {m.referee || 'S/A'}</span>
                </div>
                
                <div style={{ display: 'flex', padding: '15px 5px 10px 5px', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    {/* Equipo Local */}
                    <div style={{ flex: '1 1 35%', textAlign: 'center' }}>
                        <img src={m.team_a_logo || 'https://via.placeholder.com/40'} width="40" height="40" style={{borderRadius:'50%', objectFit:'cover'}} alt="logo" />
                        <div style={{ fontWeight: 'bold', fontSize: '12px', margin:'5px 0' }}>{m.team_a_name}</div>
                        {isExpanded && isAdmin && (
                            <div style={{ marginTop: '10px' }}>
                                {players.filter(p => p.team_id === m.team_a_id).map(p => (
                                    <div key={p.id} style={{marginBottom:10, display:'flex', alignItems:'center', justifyContent:'center'}}>
                                        <button onClick={(e) => { e.stopPropagation(); addGoal(m.id, p.id, m.team_a_id, 'team_a_goals'); }} style={{padding:'14px 5px', width:'85%', fontSize:13, fontWeight:'bold', borderRadius:10, background:'#f0f4ff', border:'1px solid #ccd'}}>⚽ {p.name}</button>
                                        <button onClick={(e) => { e.stopPropagation(); removeGoal(m.id, p.id, m.team_a_id, 'team_a_goals'); }} style={{color:'red', background:'none', border:'none', fontSize:25, marginLeft:8}}>×</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Marcador */}
                    <div style={{ flex: '0 0 28%', textAlign: 'center', paddingTop: '5px' }}>
                        <div style={{ fontSize: '28px', fontWeight: '900', whiteSpace: 'nowrap' }}>{m.team_a_goals} - {m.team_b_goals}</div>
                        {isExpanded && <button onClick={(e) => { e.stopPropagation(); setExpandedMatchId(null); }} style={{marginTop:15, fontSize:10, background:'#eee', border:'1px solid #ccc', padding:'6px 12px', borderRadius:5}}>CERRAR 🔼</button>}
                    </div>

                    {/* Equipo Visitante */}
                    <div style={{ flex: '1 1 35%', textAlign: 'center' }}>
                        <img src={m.team_b_logo || 'https://via.placeholder.com/40'} width="40" height="40" style={{borderRadius:'50%', objectFit:'cover'}} alt="logo" />
                        <div style={{ fontWeight: 'bold', fontSize: '12px', margin:'5px 0' }}>{m.team_b_name}</div>
                        {isExpanded && isAdmin && (
                            <div style={{ marginTop: '10px' }}>
                                {players.filter(p => p.team_id === m.team_b_id).map(p => (
                                    <div key={p.id} style={{marginBottom:10, display:'flex', alignItems:'center', justifyContent:'center'}}>
                                        <button onClick={(e) => { e.stopPropagation(); removeGoal(m.id, p.id, m.team_b_id, 'team_b_goals'); }} style={{color:'red', background:'none', border:'none', fontSize:25, marginRight:8}}>×</button>
                                        <button onClick={(e) => { e.stopPropagation(); addGoal(m.id, p.id, m.team_b_id, 'team_b_goals'); }} style={{padding:'14px 4px', width:'85%', fontSize:13, fontWeight:'bold', borderRadius:10, background:'#fff0f0', border:'1px solid #dcc'}}>{p.name} ⚽</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    if (loading) return <div style={{ padding: '100px 0', textAlign: 'center' }}>Cargando Torneo...</div>;

    const qMatches = matches.filter(m => m.phase === 'cuartos');
    const sMatches = matches.filter(m => m.phase === 'semi');
    const fMatches = matches.filter(m => m.phase === 'final');

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
                
                {/* 1. CUADRO DE PLAYOFFS DINÁMICO */}
                {!showTable && tournamentInfo?.type === 'campeonato' && teams.length === 8 && (
                    <div style={{ background: '#fff', padding: '15px', borderRadius: '15px', marginBottom: '30px', border: '1px solid #eee', boxShadow:'0 4px 10px rgba(0,0,0,0.05)' }}>
                        <h4 style={{ textAlign: 'center', margin: '0 0 10px 0', fontSize: '12px', color: '#666' }}>🏆 CUADRO PROYECTADO (1º vs 8º...)</h4>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '5px' }}>
                            <div style={{ flex: 1.2 }}>
                                {[ {a:1, b:8}, {a:2, b:7}, {a:3, b:6}, {a:4, b:5} ].map((pair, i) => {
                                    const dbM = qMatches[i];
                                    return (
                                        <div key={i} style={{ background: '#f8f9fa', marginBottom: '5px', padding: '5px', borderRadius: '5px', border: '1px solid #eee', fontSize: '9px' }}>
                                            <div style={{display:'flex', justifyContent:'space-between', color: dbM ? '#000' : '#007bff'}}>
                                                <span style={{overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'65px'}}>{dbM ? dbM.team_a_name : getProjectedName(pair.a)}</span>
                                                <b>{dbM?.team_a_goals ?? '-'}</b>
                                            </div>
                                            <div style={{display:'flex', justifyContent:'space-between', color: dbM ? '#000' : '#007bff', borderTop:'1px solid #fff'}}>
                                                <span style={{overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'65px'}}>{dbM ? dbM.team_b_name : getProjectedName(pair.b)}</span>
                                                <b>{dbM?.team_b_goals ?? '-'}</b>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div style={{ flex: 1, display:'flex', flexDirection:'column', justifyContent:'space-around', fontSize:8, textAlign:'center', color:'#999' }}>
                                {[0, 1].map(i => (
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
                    <div style={{ background: 'white', padding: '15px', borderRadius: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                        <h3 style={{marginTop:0, fontSize:18}}>📊 Clasificación</h3>
                        <table width="100%" style={{ borderCollapse: 'collapse', fontSize: '13px' }}>
                            <thead><tr style={{ textAlign: 'left', color:'#888', borderBottom:'2px solid #eee' }}><th>POS</th><th>EQUIPO</th><th>PTS</th><th>GF</th></tr></thead>
                            <tbody>{standingsList.map((t, i) => (
                                <tr key={t.id} style={{ borderBottom: '1px solid #f8f9fa' }}>
                                    <td style={{ padding: '15px 0' }}>{i + 1}</td>
                                    <td style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '15px 0', fontWeight: 'bold' }}>
                                        {t.logo && <img src={t.logo} width="25" height="25" style={{ borderRadius: '50%', objectFit:'cover' }} />}
                                        {t.name}
                                    </td>
                                    <td style={{ fontWeight: 'bold', color:'#007bff' }}>{t.pts}</td><td>{t.gf}</td>
                                </tr>
                            ))}</tbody>
                        </table>
                    </div>
                ) : (
                    <div>
                        <div style={{ background: '#333', color: 'white', padding: '10px', borderRadius: '8px', fontSize: '12px', marginBottom: '15px', textAlign:'center', fontWeight:'bold' }}>PARTIDOS</div>
                        {matches.map(m => <MatchCard key={m.id} m={m} />)}
                    </div>
                )}

                {/* ESTADÍSTICAS */}
                <div style={{ marginTop: '50px', background: 'white', padding: '20px', borderRadius: '20px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)' }}>
                    <h4 style={{ margin: '0 0 15px 0', borderLeft:'4px solid #ffc107', paddingLeft:10, fontSize:15 }}>🏆 Pichichi</h4>
                    {(stats.goleadores || []).map((g, i) => (
                        <div key={i} style={{ fontSize: '13px', padding: '10px 0', borderBottom: '1px solid #f1f1f1', display: 'flex', justifyContent: 'space-between' }}>
                            <span><b>{i + 1}.</b> {g.name} <small style={{color:'#888'}}>({g.team_name})</small></span>
                            <b style={{background:'#fff3cd', padding:'2px 8px', borderRadius:10}}>{g.total_goals}</b>
                        </div>
                    ))}
                    <h4 style={{ margin: '30px 0 15px 0', borderLeft:'4px solid #0dcaf0', paddingLeft:10, fontSize:15 }}>🧤 Zamora</h4>
                    {(stats.porteros || []).map((p, i) => (
                        <div key={i} style={{ fontSize: '13px', padding: '10px 0', borderBottom: '1px solid #f1f1f1', display: 'flex', justifyContent: 'space-between' }}>
                            <span><b>{i + 1}.</b> {p.name} <small style={{color:'#888'}}>({p.team_name})</small></span>
                            <b style={{ color: '#dc3545' }}>{p.goals_against}</b>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TournamentView;