/*
// -- messages.js -- //
#######################################################################################
# The messages.js file is responsible for handling user messages, including sending   #
# and retrieving messages between users. It defines the routes and logic for message  #
# operations, such as fetching message history and sending new messages.              #
#######################################################################################
*/

import { db } from '../db.js';
import { connectedUsers } from '../connectedUsers.js';

export default async function messagesRoutes(fastify) {
  // GET /api/messages/:friendId
  // # This function collects all the messages between the user and his friend # //
  fastify.get('/:friendId', { preValidation: [fastify.authenticate] }, async (request, reply) => {
    const user = request.user;
    const friendId = parseInt(request.params.friendId, 10);

    if (isNaN(friendId)) {
      return reply.code(400).send({ message: 'Invalid friend ID' });
    }
    const stmt = db.prepare(`
      SELECT m.*, u.username AS sender_username
      FROM messages m 
      JOIN users u ON u.id = m.sender_id
      WHERE (m.sender_id = ? AND m.receiver_id = ?)
        OR (m.sender_id = ? AND m.receiver_id = ?)
      ORDER BY m.created_at ASC
    `);
    const messages = stmt.all(user.id, friendId, friendId, user.id);

    return messages;
  });

  // POST /api/messages
  // # This function handles sending new messages between users, storing them in the appropriate table # //
  fastify.post('/', { preValidation: [fastify.authenticate] }, async (request, reply) => {
    const { toUserId, content } = request.body;
    const fromUserId = request.user.id;
    const senderUsername = request.user.username;

    if (!toUserId || !content) {
      return reply.code(400).send({ message: 'Missing parameters' });
    }

    const blockExists = db.prepare(`
      SELECT 1 FROM blocks 
      WHERE (blocker_id = ? AND blocked_id = ?)
         OR (blocker_id = ? AND blocked_id = ?)
      LIMIT 1
    `).get(toUserId, fromUserId, fromUserId, toUserId);
    if (blockExists) {
      return reply.code(403).send({ message: 'Message blocked due to block relationship' });
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

    const targetSocket = connectedUsers.get(String(toUserId));
    if (targetSocket) {
      targetSocket.send(JSON.stringify({ type: 'new_message', message }));
    }

    return message;
  });
}