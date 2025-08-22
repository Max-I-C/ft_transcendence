import Fastify from 'fastify';
import bcrypt from 'bcrypt';
import fastifyJwt from '@fastify/jwt';
import { db } from './db.js';
import websocket from '@fastify/websocket';

const connectedUsers = new Map();

const fastify = Fastify({ logger: true });

fastify.register(fastifyJwt, {
	secret: 'supersecretkey'
});

fastify.register(websocket);

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
    const { username, email, twoaf, password } = request.body;

    const existingUser = db.prepare('SELECT * FROM users WHERE (username = ? OR email = ?) AND id != ?')
        .get(username, email, user.id);
    
        if(existingUser) {
        return reply.code(409).send({ message: 'Username or Email already used' });
    }

    try {
        let query = `
            UPDATE users
            SET username = ?, email = ?, twoaf = ?
        `;
        const params = [username, email, twoaf ? 1 : 0];

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            query += `, password = ?`;
            params.push(hashedPassword);
        }

        query += ` WHERE id = ?`;
        params.push(user.id);

        const stmt = db.prepare(query);
        stmt.run(...params);

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

fastify.post('/api/social/request', { preValidation: [fastify.authenticate] }, async (request, reply) => {
    const user = request.user;
    const { usernameFriend } = request.body; 
    try{
        const friend = db.prepare(
            'SELECT id FROM users WHERE username = ? LIMIT 1'
        ).get(usernameFriend);

        if(!friend){
            return reply.code(404).send({ message:'User not found' });
        }
        
        const existing = db.prepare(
            `SELECT * FROM friendships 
            WHERE (sender_id = ? AND receiver_id = ?) 
                OR (sender_id = ? AND receiver_id = ?)`
            ).get(user.id, friend.id, friend.id, user.id);

        if (existing){
            return reply.code(409).send({ message: 'Friend request already send'});
        }
        
        const friendshipRecord = db.prepare(
            `INSERT INTO friendships (sender_id, receiver_id, status, created)
            VALUES (?, ?, 'pending', CURRENT_TIMESTAMP)`
        ).run(user.id, friend.id);

        const idOfTheFriendshipRecord = friendshipRecord.lastInsertRowid;

        db.prepare(
            `INSERT INTO notifications (user_id, sender_id, type, reference_id, read) VALUES (?, ?, 'pending', ?, 0)`
        ).run(friend.id, user.id, idOfTheFriendshipRecord);

        return reply.code(201).send({message: 'Friend request sent'});        
    }
    catch (err){
        fastify.log.error(err);
        return reply.code(500).send({ message: 'Server error'});
    }
});

fastify.get('/api/notifications', { preValidation: [fastify.authenticate] }, async (request, reply) => {
    const user = request.user;
    const notifications = db.prepare(
        `SELECT n.*, u.username AS sender_username
        FROM notifications n
        LEFT JOIN users u ON n.sender_id = u.id
        WHERE n.user_id = ? AND n.read = 0
        ORDER BY n.created DESC`
    ).all(user.id);
    return(notifications);
});

fastify.post('/api/notifications/:id/read', { preValidation: [fastify.authenticate] }, async (request, reply) => {
    const user = request.user;
    const id = request.params.id;

    const notif = db.prepare('SELECT * FROM notifications WHERE id = ? AND user_id = ?').get(id, user.id);
    if(!notif)
        return(reply.code(404).send({ message: 'Notification not found'}));
    db.prepare('UPDATE notifications SET read = 1 WHERE id = ?').run(id);

    return(reply.send({message: 'Notification mark as read'}));
});

fastify.post('/api/social/respond', { preValidation: [fastify.authenticate] }, async (request, reply) => {
    const user = request.user;
    const { notificationId, action } = request.body;

    if(!notificationId ||!['accept', 'refuse'].includes(action)) {
        return reply.code(400).send({ message: 'Invalid data' });
    }

    try {
        const transaction = db.transaction(() => {
            const notif = db.prepare(`
                SELECT * FROM notifications WHERE id = ? AND user_id = ? AND type = 'pending'
            `).get(notificationId, user.id);
            
            if (!notif) {
                throw new Error('Notification not found, strange how did you got that error ?');
            }

            const friendshipId = notif.reference_id;
            console.log('friendshipId:', friendshipId);
            db.prepare(`DELETE FROM notifications WHERE id = ?`).run(notificationId);
            
            if(action === 'accept') {
                const update = db.prepare(`
                    UPDATE friendships SET status = 'accepted' WHERE id = ?
                `).run(friendshipId);
                
                if(update.changes === 0) {
                    throw new Error('No data found in the table friendships');
                }
            }
            // Entrain de coder la partie de refus 
            else if(action === 'refuse') {
                db.prepare(`DELETE FROM friendships WHERE id = ?`).run(friendshipId);
            }
        });
        transaction();
        return( { message: `Friend request successfuly managed`} );
    }
    catch(err){
        console.error(err);
        return reply.code(404).send({message: err.message});
    }
});

fastify.get('/api/messages/:friendId', { preValidation: [fastify.authenticate] }, async (request, reply) => {
    const user = request.user;
    const friendId = parseInt(request.params.friendId,10);
    
    if(isNaN(friendId)) {
        return reply.code(400).send({message: 'Invalid friend ID'});
    }
    const stmt = db.prepare(`
        SELECT m.*, u.username AS sender_username
        FROM messages m 
        JOIN users u ON u.id = m.sender_id
        WHERE (m.sender_id = ? AND m.receiver_id = ?)
            OR (m.sender_id = ? AND m.receiver_id = ?)
        ORDER BY m.created_at ASC
    `)
    const messages = stmt.all(user.id, friendId, friendId, user.id);

    return messages;
});

fastify.post('/api/messages', { preValidation: [fastify.authenticate] }, async (request, reply) => {
    const { toUserId, content } = request.body;
    const fromUserId = request.user.id;
    const senderUsername = request.user.username; // récupère le username ici

    if (!toUserId || !content) {
        return reply.code(400).send({ message: 'Missing parameters' });
    }

    const result = db.prepare(`
        INSERT INTO messages (sender_id, receiver_id, content, created_at) VALUES (?, ?, ?, ?)
    `).run(fromUserId, toUserId, content, new Date().toISOString());

    const message = {
        id: result.lastInsertRowid,
        sender_id: fromUserId,
        sender_username: senderUsername,
        receiver_id: toUserId,
        content,
        created_at: new Date().toISOString()
    };

    // Récupérer username du destinataire
    const toUser = db.prepare('SELECT username FROM users WHERE id = ?').get(toUserId);
    if (toUser) {
        const targetSocket = connectedUsers.get(toUser.username);
        if (targetSocket) {
            targetSocket.send(JSON.stringify({ type: 'new_message', message }));
        }
    }

    return message;
});


fastify.get('/api/social/friends', { preValidation: [fastify.authenticate] }, async (request, reply) => {
    const user = request.user;
    const friends = db.prepare(`
        SELECT u.id, u.username
        FROM friendships f
        JOIN users u
            ON (
                (u.id = f.receiver_id AND f.sender_id = ?)
                OR (u.id = f.sender_id AND f.receiver_id = ?)
            )
        WHERE f.status = 'accepted'
    `).all(user.id, user.id);
    return(friends);
});

fastify.register(async function (fastify) {
  fastify.get('/ws', { websocket: true }, (socket, req) => {
    let currentUser = null;

    socket.on('message', async (raw) => {
      try {
        const msg = JSON.parse(raw.toString());

        if (msg.type === 'auth') {
          // Premier message du client pour s'identifier
          const payload = fastify.jwt.verify(msg.token);
          currentUser = payload.username;
          connectedUsers.set(currentUser, socket);
          console.log(`User connected: ${currentUser}`);
        }

        if (msg.type === 'friend_request') {
            const payload = fastify.jwt.verify(msg.token);
            console.log(`User ${payload.username} envoie une demande à ${msg.to}`);

            // Save en DB si nécessaire
            // await db.saveFriendRequest(payload.user_id, msg.to);

            // Ack pour l'envoyeur
            socket.send(JSON.stringify({
              type: 'friend_request_ack',
              to: msg.to,
              from: payload.username
            }));

            // Notifier le destinataire si connecté
            const targetSocket = connectedUsers.get(msg.to);
            if (targetSocket) {
                targetSocket.send(JSON.stringify({
                  type: 'new_friend_request',
                  from: payload.username
                }));
            }
        }
        if (msg.type === 'friend_request_accepted') {
            const payload = fastify.jwt.verify(msg.token);
            console.log(`User ${payload.username} demande d'amis accepter ${msg.to}`);

            // Save en DB si nécessaire
            // await db.saveFriendRequest(payload.user_id, msg.to);

            // Ack pour l'envoyeur
            socket.send(JSON.stringify({
              type: 'friend_request_accepted_ack',
              to: msg.to,
              from: payload.username
            }));

            // Notifier le destinataire si connecté
            const targetSocket = connectedUsers.get(msg.to);
            if (targetSocket) {
                targetSocket.send(JSON.stringify({
                  type: 'new_friend',
                  from: payload.username
                }));
            }
        }
      } 
      catch (err) {
        console.error('WS error:', err);
      }
    });

    socket.on('close', () => {
      if (currentUser) {
        connectedUsers.delete(currentUser);
        console.log(`User disconnected: ${currentUser}`);
      }
    });
  });
});
