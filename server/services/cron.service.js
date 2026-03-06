const cron = require('node-cron');
const pool = require('../config/db');

const startMatchWatcher = () => {
    cron.schedule('* * * * *', async () => {
        const now = new Date();
        // Ajustamos a Madrid (UTC+1) manualmente para comparar
        const madridHour = now.getUTCHours() + 1;
        const madridMinutes = now.getUTCMinutes();
        const currentTimeInMinutes = (madridHour * 60) + madridMinutes;
        
        console.log(`🔍 Vigilante: Comprobando... (Hora Madrid: ${madridHour}:${madridMinutes})`);

        try {
            // 1. Traemos TODOS los partidos programados que no se han avisado
            const [matches] = await pool.execute(`
                SELECT m.id, m.match_time, m.match_date, t1.name as home, t2.name as away
                FROM league_matches m
                JOIN league_teams t1 ON m.home_team_id = t1.id
                JOIN league_teams t2 ON m.away_team_id = t2.id
                WHERE m.status = 'scheduled' 
                AND m.notification_sent = 0
                AND m.match_date <= CURDATE() 
            `);

            for (const match of matches) {
                // Convertimos la hora del partido (HH:mm) a minutos totales
                const [h, m] = match.match_time.split(':').map(Number);
                const matchTimeInMinutes = (h * 60) + m;

                // 2. ¿Es hoy (o antes) y ya ha pasado la hora?
                // Comparamos solo la hora por ahora para forzar el positivo
                if (currentTimeInMinutes >= matchTimeInMinutes) {
                    console.log(`⚽ ¡MATCH! ${match.home} vs ${match.away}. Abriendo acta...`);

                    // El Vigilante hace el trabajo sucio en la sombra
                    await pool.execute(
                        `UPDATE league_matches 
                        SET notification_sent = 1, 
                            status = 'awaiting_score' -- 👈 ESTO ES LO QUE EL PLAYERHOME VA A LEER
                        WHERE id = ?`,
                        [match.id]
                    );
                    console.log(`✅ Partido ${match.id} actualizado en la tabla.`);
                }
            }
        } catch (error) {
            console.error('🚨 Error Vigilante:', error.message);
        }
    });
};

module.exports = { startMatchWatcher };