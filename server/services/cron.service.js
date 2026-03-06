const cron = require('node-cron');
const pool = require('../config/db');

const startMatchWatcher = () => {
    cron.schedule('* * * * *', async () => {
        console.log('🔍 Vigilante: Comprobando partidos finalizados...');

        try {
            // 1. Buscamos partidos que YA DEBERÍAN HABER TERMINADO
            // Usamos DATE_ADD para sumar los minutos de duración a la hora de inicio
            // Comparamos con la hora actual de España (ajustando el desfase de Railway si es necesario)
            const [matches] = await pool.execute(`
                SELECT m.id, t1.name as home, t2.name as away
                FROM league_matches m
                JOIN leagues l ON m.league_id = l.id
                JOIN league_teams t1 ON m.home_team_id = t1.id
                JOIN league_teams t2 ON m.away_team_id = t2.id
                WHERE m.status = 'scheduled' 
                AND m.notification_sent = 0
                AND (
                    m.match_date < CURDATE() 
                    OR (m.match_date = CURDATE() AND m.match_time <= TIME(DATE_ADD(NOW(), INTERVAL 1 HOUR)))
                )
            `);

            for (const match of matches) {
                console.log(`⚽ ¡FINAL DETECTADO! ${match.home} vs ${match.away}. Abriendo acta...`);

                // 2. Marcamos como notificado para que el vigilante no lo procese más
                await pool.execute(
                    'UPDATE league_matches SET notification_sent = 1 WHERE id = ?',
                    [match.id]
                );
                
                console.log(`✅ Partido ${match.id} listo para recibir el resultado.`);
            }
        } catch (error) {
            console.error('🚨 Error en el Vigilante:', error.message);
        }
    });
};

module.exports = { startMatchWatcher };