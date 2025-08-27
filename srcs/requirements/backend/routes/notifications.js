/*
// -- notifications.js -- //
#######################################################################################
# The notifications.js file is responsible for handling user notifications, including #
# fetching and updating notification status. It defines the routes and logic for      #
# notification-related operations.                                                    #
#######################################################################################
*/

import { db } from '../db.js';

export default async function notificationRoutes(fastify) {
  // GET /api/notifications
  // # This function retrieves all notifications for the authenticated user. # //
  fastify.get('/', { preValidation: [fastify.authenticate] }, async (request, reply) => {
    const user = request.user;
    const notifications = db.prepare(
      `SELECT n.*, u.username AS sender_username
       FROM notifications n
       LEFT JOIN users u ON n.sender_id = u.id
       WHERE n.user_id = ? AND n.read = 0
       ORDER BY n.created DESC`
    ).all(user.id);
    return notifications;
  });

  // POST /api/notifications/:id/read
  // This function marks a notification as read for the authenticated user. # //
  fastify.post('/:id/read', { preValidation: [fastify.authenticate] }, async (request, reply) => {
    const user = request.user;
    const id = request.params.id;

    const notif = db.prepare('SELECT * FROM notifications WHERE id = ? AND user_id = ?').get(id, user.id);
    if (!notif) return reply.code(404).send({ message: 'Notification not found' });

    db.prepare('UPDATE notifications SET read = 1 WHERE id = ?').run(id);
    return reply.send({ message: 'Notification mark as read' });
  });
}