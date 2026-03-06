const cron = require('node-cron');
const pool = require('../config/db');

// Esta función corre CADA MINUTO (* * * * *)
const startMatchWatcher = () => {
    cron.schedule('* * * * *', async () => {
        console.log('🔍 Vigilante: Comprobando partidos finalizados...');

        try {
            // 1. Buscamos partidos de hoy que no han sido notificados y siguen programados
            const [matches] = await pool.execute(`
                SELECT m.id, m.match_time, l.match_minutes, t1.name as home, t2.name as away
                FROM league_matches m
                JOIN leagues l ON m.league_id = l.id
                JOIN league_teams t1 ON m.home_team_id = t1.id
                JOIN league_teams t2 ON m.away_team_id = t2.id
                WHERE m.status = 'scheduled' 
                AND m.match_date = CURDATE()
                AND m.notification_sent = 0
            `);

            const now = new Date();
            const currentMinutes = now.getHours() * 60 + now.getMinutes();

            for (const match of matches) {
                const [h, m] = match.match_time.split(':').map(Number);
                const startTimeMinutes = h * 60 + m;
                const endTimeMinutes = startTimeMinutes + match.match_minutes;

                // 2. Si ya ha pasado la hora de fin
                if (currentMinutes >= endTimeMinutes) {
                    console.log(`⚽ ¡FINAL! ${match.home} vs ${match.away}. Enviando aviso...`);

                    // 3. AQUÍ dispararías la notificación real (Firebase/WebPush)
                    // Por ahora, simulamos el éxito y marcamos como enviado
                    await pool.execute(
                        'UPDATE league_matches SET notification_sent = 1 WHERE id = ?',
                        [match.id]
                    );

                    // TODO: Llamar a tu función de Notificaciones Push aquí
                }
            }
        } catch (error) {
            console.error('🚨 Error en el Vigilante:', error.message);
        }
    });
};

module.exports = { startMatchWatcher };