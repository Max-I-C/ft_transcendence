import { db } from '../db.js';
import { connectedUsers } from '../connectedUsers.js';

export default async function socialRoutes(fastify) {
  // POST /api/social/request
  fastify.post('/request', { preValidation: [fastify.authenticate] }, async (request, reply) => {
    const user = request.user;
    const { usernameFriend } = request.body;
    try {
      const friend = db.prepare('SELECT id FROM users WHERE username = ? LIMIT 1').get(usernameFriend);
      if (!friend) return reply.code(404).send({ message: 'User not found' });

      const blocked = db.prepare(`
        SELECT 1 FROM blocks 
        WHERE (blocker_id = ? AND blocked_id = ?)
           OR (blocker_id = ? AND blocked_id = ?)
      `).get(user.id, friend.id, friend.id, user.id);
      if (blocked) return reply.code(403).send({ message: 'Impossible, utilisateur bloqué' });

      const existing = db.prepare(`
        SELECT * FROM friendships 
        WHERE (sender_id = ? AND receiver_id = ?) 
           OR (sender_id = ? AND receiver_id = ?)
      `).get(user.id, friend.id, friend.id, user.id);
      if (existing) return reply.code(409).send({ message: 'Friend request already send' });

      const friendshipRecord = db.prepare(`
        INSERT INTO friendships (sender_id, receiver_id, status, created)
        VALUES (?, ?, 'pending', CURRENT_TIMESTAMP)
      `).run(user.id, friend.id);

      const idOfTheFriendshipRecord = friendshipRecord.lastInsertRowid;
      db.prepare(`INSERT INTO notifications (user_id, sender_id, type, reference_id, read) VALUES (?, ?, 'pending', ?, 0)`)
        .run(friend.id, user.id, idOfTheFriendshipRecord);

      return reply.code(201).send({ message: 'Friend request sent' });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ message: 'Server error' });
    }
  });

  // POST /api/social/respond
  fastify.post('/respond', { preValidation: [fastify.authenticate] }, async (request, reply) => {
    const user = request.user;
    const { notificationId, action } = request.body;
    if (!notificationId || !['accept', 'refuse'].includes(action)) {
      return reply.code(400).send({ message: 'Invalid data' });
    }

    try {
      const transaction = db.transaction(() => {
        const notif = db.prepare(`SELECT * FROM notifications WHERE id = ? AND user_id = ? AND type = 'pending'`)
          .get(notificationId, user.id);
        if (!notif) throw new Error('Notification not found, strange how did you got that error ?');

        const friendshipId = notif.reference_id;
        db.prepare(`DELETE FROM notifications WHERE id = ?`).run(notificationId);

        if (action === 'accept') {
          const update = db.prepare(`UPDATE friendships SET status = 'accepted' WHERE id = ?`).run(friendshipId);
          if (update.changes === 0) throw new Error('No data found in the table friendships');
        } else if (action === 'refuse') {
          db.prepare(`DELETE FROM friendships WHERE id = ?`).run(friendshipId);
        }
      });
      transaction();
      return { message: `Friend request successfuly managed` };
    } catch (err) {
      console.error(err);
      return reply.code(404).send({ message: err.message });
    }
  });

  // GET /api/social/friends
  fastify.get('/friends', { preValidation: [fastify.authenticate] }, async (request, reply) => {
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
    return friends;
  });

  // DELETE /api/social/remove?friendId=...
  fastify.delete('/remove', { preValidation: [fastify.authenticate] }, async (request, reply) => {
    const user = request.user;
    const friendId = parseInt(request.query.friendId, 10);
    if (isNaN(friendId)) return reply.code(400).send({ message: 'Invalid friend ID' });

    db.prepare(`
      DELETE FROM friendships 
      WHERE 
        (sender_id = ? AND receiver_id = ? AND status = 'accepted')
        OR (sender_id = ? AND receiver_id = ? AND status = 'accepted')
    `).run(user.id, friendId, friendId, user.id);

    return reply.send({ success: true });
  });

  // POST /api/social/block
  fastify.post('/block', { preValidation: [fastify.authenticate] }, async (request, reply) => {
    const user = request.user;
    const { blockedId } = request.body;
    if (!blockedId || isNaN(blockedId)) return reply.code(400).send({ message: 'Invalid user ID' });

    try {
      db.prepare(`INSERT OR IGNORE INTO blocks (blocker_id, blocked_id) VALUES (?, ?)`).run(user.id, blockedId);
      db.prepare(`
        DELETE FROM friendships
        WHERE (sender_id = ? AND receiver_id = ?)
          OR (sender_id = ? AND receiver_id = ?)
      `).run(user.id, blockedId, blockedId, user.id);
      return reply.send({ success: true, message: 'Utilisateur bloqué' });
    } catch (err) {
      return reply.code(500).send({ message: 'Erreur lors du blocage' });
    }
  });
}