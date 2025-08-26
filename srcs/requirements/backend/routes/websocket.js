import { connectedUsers } from '../connectedUsers.js';

export default async function websocketRoutes(fastify) {
  fastify.get('/ws', { websocket: true }, (socket, req) => {
    let currentUser = null;

    socket.on('message', async (raw) => {
      try {
        const msg = JSON.parse(raw.toString());

        if (msg.type === 'auth') {
          const payload = fastify.jwt.verify(msg.token);
          currentUser = String(payload.id);
          connectedUsers.set(currentUser, socket);
          console.log(`User connected: ${currentUser}`);
        }

        if (msg.type === 'friend_request') {
          const payload = fastify.jwt.verify(msg.token);
          socket.send(JSON.stringify({
            type: 'friend_request_ack',
            to: msg.to,
            from: payload.username,
            from_id: payload.id
          }));

          const targetSocket = connectedUsers.get(String(msg.to));
          if (targetSocket) {
            targetSocket.send(JSON.stringify({
              type: 'new_friend_request',
              from: payload.username,
              from_id: payload.id
            }));
          }
        }

        if (msg.type === 'friend_request_accepted') {
          const payload = fastify.jwt.verify(msg.token);
          socket.send(JSON.stringify({
            type: 'friend_request_accepted_ack',
            to: msg.to,
            from: payload.username,
            from_id: payload.id
          }));

          const targetSocket = connectedUsers.get(String(msg.to));
          if (targetSocket) {
            targetSocket.send(JSON.stringify({
              type: 'new_friend',
              from: payload.username,
              from_id: payload.id
            }));
          }
        }

        if (msg.type === 'friend_remove_blocked') {
          const payload = fastify.jwt.verify(msg.token);
          socket.send(JSON.stringify({
            type: 'friend_blocked_ack',
            to: msg.to,
            from: payload.username,
            from_id: payload.id
          }));

          const targetSocket = connectedUsers.get(String(msg.to));
          if (targetSocket) {
            targetSocket.send(JSON.stringify({
              type: 'new_blockage',
              from: payload.username,
              from_id: payload.id
            }));
          }
        }
      } catch (err) {
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
}