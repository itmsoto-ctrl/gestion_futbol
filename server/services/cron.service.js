const cron = require('node-cron');
const pool = require('../config/db');

const startMatchWatcher = () => {
    // Corre cada minuto
    cron.schedule('* * * * *', async () => {
        console.log('🔍 Vigilante: Comprobando partidos finalizados...');

        try {
            // 1. Buscamos partidos que sigan en 'scheduled'
            // Quitamos el m.match_date = CURDATE() estricto por si hay desfase de horas entre servidor y cliente
            const [matches] = await pool.execute(`
                SELECT m.id, m.match_date, m.match_time, l.match_minutes, t1.name as home, t2.name as away
                FROM league_matches m
                JOIN leagues l ON m.league_id = l.id
                JOIN league_teams t1 ON m.home_team_id = t1.id
                JOIN league_teams t2 ON m.away_team_id = t2.id
                WHERE m.status = 'scheduled' 
                AND m.notification_sent = 0
            `);

            // Obtenemos la hora actual en minutos totales del día (Ajustado a España si Railway está en UTC)
            // Si Railway está en UTC, sumamos 60 minutos para tener hora de España (CET)
            const now = new Date();
            const currentMinutes = (now.getUTCHours() + 1) * 60 + now.getUTCMinutes(); 
            
            // Fecha de hoy en formato YYYY-MM-DD
            const todayStr = now.toISOString().split('T')[0];

            for (const match of matches) {
                const matchDateStr = new Date(match.match_date).toISOString().split('T')[0];
                
                // Calculamos cuándo termina el partido
                const [h, min] = match.match_time.split(':').map(Number);
                const startTimeMinutes = h * 60 + min;
                const endTimeMinutes = startTimeMinutes + (match.match_minutes || 60);

                // 2. ¿Ha terminado ya? (Es de hoy y ya pasó la hora, o es de un día pasado)
                if (matchDateStr < todayStr || (matchDateStr === todayStr && currentMinutes >= endTimeMinutes)) {
                    
                    console.log(`⚽ ¡FINAL! ${match.home} vs ${match.away}. Cambiando estado...`);

                    // 🔥 EL CAMBIO CLAVE: Actualizamos notification_sent Y el status
                    // Usamos 'scheduled' porque tu PlayerHome busca ese estado, 
                    // pero al haber pasado la hora, el modal saltará.
                    await pool.execute(
                        `UPDATE league_matches 
                         SET notification_sent = 1, 
                             status = 'scheduled' 
                         WHERE id = ?`,
                        [match.id]
                    );

                    console.log(`✅ Partido ${match.id} marcado para acta.`);
                }
            }
        } catch (error) {
            console.error('🚨 Error en el Vigilante:', error.message);
        }
    });
};

module.exports = { startMatchWatcher };