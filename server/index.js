// ... (mismo inicio de conexión)

// --- RESET MAESTRO MODULAR ---
app.post('/reset-tournament/:id', (req, res) => {
    const tId = req.params.id;
    const { target } = req.body; 
    if (target === 'all') {
        db.query('DELETE FROM goals WHERE match_id IN (SELECT id FROM matches WHERE tournament_id = ?)', [tId], () => {
            db.query('DELETE FROM matches WHERE tournament_id = ? AND phase != "grupo"', [tId], () => {
                db.query('UPDATE matches SET played = 0, team_a_goals = 0, team_b_goals = 0 WHERE tournament_id = ? AND phase = "grupo"', [tId], () => res.send("OK"));
            });
        });
    } else {
        // Borra fase específica asegurando el nombre de la fase
        db.query('DELETE FROM matches WHERE tournament_id = ? AND phase = ?', [tId, target], (err) => {
            if (err) return res.status(500).send(err);
            res.send("OK");
        });
    }
});

// ... (resto de rutas sin cambios)
app.listen(process.env.PORT || 3001, '0.0.0.0', () => console.log("🚀 v3.7.1 ready"));