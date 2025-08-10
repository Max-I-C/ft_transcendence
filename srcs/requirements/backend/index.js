import Fastify from 'fastify';
import bcrypt from 'bcrypt';
import fastifyJwt from '@fastify/jwt';
import { db } from './db.js';

const fastify = Fastify({ logger: true });

fastify.register(fastifyJwt, {
	secret: 'supersecretkey'
});

fastify.get('/api/ping', async (request, reply) => 
{
    return{ pong: 'it works! '};
});

fastify.get('/users', async(request, reply) =>
{
    const rows = db.prepare('SELECT * FROM users').all();
    return rows;
});

fastify.post('/api/login', async(request, reply) =>
{
    const { username, password } = request.body;

    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    const user = stmt.get(username);

    if(!user)
        return reply.code(401).send({ message: 'invalid user' });  
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
        return reply.code(402).send({ message: 'invalid password'});
    
    const token = fastify.jwt.sign({
        id: user.id, 
        username: user.username
    })

    return reply.send({
        message: 'Login successful',
        token
    });
});

fastify.listen({port: 3000, host: '0.0.0.0'}, (err) =>
{
    if(err)
    {
        fastify.log.error(err);
        process.exit(1);
    }
});

fastify.post('/api/register', async (request, reply) =>
{
    const { username, email, password } = request.body;

    if(!username || !email || !password) {
        return reply.code(400).send({ message: 'Tous les champs sont requis.' });
    }
    try{
        const existingUser = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(username, email);
        if(existingUser) {
            return reply.code(409).send({ message: 'Users or Email already used'});
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        db.prepare('INSERT INTO users (username, email, password) VALUES (?, ?, ?)').run(username, email, hashedPassword);
        reply.send({ message: 'Users correctly added' });
    }
    catch(err){
        fastify.log.error(err);
        reply.code(500).send({ message: 'Server error'});
    }
});

fastify.decorate("authenticate", async function(request, reply)
{
    try{
        await request.jwtVerify();
    }
    catch(err){
        reply.send(err);
    }
});

fastify.get('/api/profile', {preValidation:[fastify.authenticate]}, async (request, reply) => 
{
    const user = request.user;
    const stmtProfile = db.prepare(`
        SELECT 
            username, 
            email,
            game_play,
            game_win,
            game_loss,
            score_total,
            level
        FROM users 
        WHERE id = ?
        
    `);
    const profile = stmtProfile.get(user.id);
    if (!profile) {
        reply.code(404).send({ error: 'User not found' });
        return;
    }
    
    const stmtLogs = db.prepare(`
        SELECT match_date, result, points_change 
        FROM match_history 
        WHERE user_id = ? 
        ORDER BY match_date DESC 
        LIMIT 10
    `);
    const match_logs = stmtLogs.all(user.id);

    return{profile, match_logs};
});

fastify.post('/api/profile/update', { preValidation: [fastify.authenticate] }, async (request, reply) => {
    const user = request.user;
    const { username, email, twoaf } = request.body;

    const existingUser = db.prepare('SELECT * FROM users WHERE (username = ? OR email = ?) AND id != ?').get(username, email, user.id);
    if(existingUser) {
        return reply.code(409).send({ message: 'Users or Email already used'});
    }
    try{
        const stmt = db.prepare(`
			UPDATE users 
			SET username = ?, email = ?, twoaf = ?
			WHERE id = ?
		`);
		stmt.run(username, email, twoaf ? 1 : 0, user.id);
		return { message: 'Profil mis à jour' };
	} 
    catch (err) {
		fastify.log.error(err);
		reply.code(500).send({ message: 'Erreur serveur' });
	}
});

fastify.post('/api/simulate-match', { preValidation: [fastify.authenticate] }, async (request, reply) => {
    const user = request.user;
    const { match_score, result, points_change } = request.body;

    if(!match_score || !result || !points_change)
        return(reply.code(400).send({ message: 'Error, not enought info'}));
    try {
        const insertStmt = db.prepare(`
            INSERT INTO match_history (user_id, match_score, result, points_change)
            VALUES (?, ?, ?, ?)
        `);
        insertStmt.run(user.id, match_score, result, points_change);
        const updateStatsStmt = db.prepare(`
            UPDATE users
            SET
                game_play = game_play + 1,
                game_win = game_win + CASE WHEN ? = 'win' THEN 1 ELSE 0 END,
                game_loss = game_loss + CASE WHEN ? = 'loss' THEN 1 ELSE 0 END,
                score_total = score_total + ?
            WHERE id = ?
        `);
        updateStatsStmt.run(result, result, points_change, user.id);
        return {message: 'Simualtion complete'};
    }
    catch (err){
        fastify.log.error(err);
        return reply.code(500).send({ message: 'Server error'});
    }
})