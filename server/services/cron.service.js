const cron = require('node-cron');
const webpush = require('web-push');
const pool = require('../config/db');

// 🔑 Configuración única de llaves VAPID usando variables de entorno
// Asegúrate de tener estas variables creadas en el panel de Railway
webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@vora7.com',
    process.env.VAPID_PUBLIC_KEY || 'BMWP42qHrmoQLzPXdFl20H7BBVeBgwkqSvG5O9xUHI3rFggyEdOP4E6SZwepIDrR2UUmblEziduHdLJ3zUCal8M',
    process.env.VAPID_PRIVATE_KEY || 'OTRxih_AahU8GHN38h8GzCSBH2l6ll4vgsPPz_BHDF4'
);

const startMatchWatcher = () => {
    // Se ejecuta cada minuto para comprobar si hay partidos que han terminado
    cron.schedule('* * * * *', async () => {
        try {
            console.log("🔍 Vigilante: Comprobando partidos finalizados...");
            
            // 1. Buscamos partidos programados cuya hora ya haya pasado
            const [matches] = await pool.execute(`
                SELECT m.id, m.home_team_id, m.away_team_id, t1.name as home_name, t2.name as away_name
                FROM league_matches m
                JOIN league_teams t1 ON m.home_team_id = t1.id
                JOIN league_teams t2 ON m.away_team_id = t2.id
                WHERE m.status = 'scheduled' 
                AND m.notification_sent = 0
                AND (m.match_date < CURDATE() OR (m.match_date = CURDATE() AND m.match_time <= CURTIME()))
            `);

            for (const match of matches) {
                console.log(`⚽ ¡Match Finalizado! ${match.home_name} vs ${match.away_name}.`);

                // 2. Actualizamos el estado para que el portal del jugador sepa que hay acta abierta
                await pool.execute(
                    "UPDATE league_matches SET status = 'awaiting_score', notification_sent = 1 WHERE id = ?",
                    [match.id]
                );

                // 3. Buscamos a los capitanes que tengan una suscripción PWA activa
                const [captains] = await pool.execute(`
                    SELECT ups.subscription_json 
                    FROM user_push_subscriptions ups
                    JOIN league_players lp ON ups.user_id = lp.user_id
                    WHERE (lp.team_id = ? OR lp.team_id = ?) AND lp.is_captain = 1
                `, [match.home_team_id, match.away_team_id]);

                // 4. Preparamos el mensaje
                const payload = JSON.stringify({
                    title: '¡A pitar el final! ⚽',
                    body: `El partido ${match.home_name} vs ${match.away_name} ha terminado. Pulsa aquí para subir el acta.`,
                    url: '/player-home'
                });

                // 5. Enviamos la notificación a cada capitán encontrado
                captains.forEach(cap => {
                    try {
                        const sub = JSON.parse(cap.subscription_json);
                        webpush.sendNotification(sub, payload).catch(err => {
                            // Si la suscripción ha caducado (410) o no existe (404), podrías borrarla de la DB aquí
                            console.error(`🚨 Fallo en envío Push: ${err.statusCode}`);
                        });
                    } catch (parseErr) {
                        console.error("❌ Error parseando suscripción JSON:", parseErr.message);
                    }
                });
            }
        } catch (error) { 
            console.error('🚨 Error crítico en el Vigilante:', error.message); 
        }
    });
};

module.exports = { startMatchWatcher };