// server.js
import Fastify from 'fastify';
import fastifyJwt from '@fastify/jwt';
import websocket from '@fastify/websocket';
import { db } from './db.js';

const fastify = Fastify({ logger: true });

// Plugins globaux
fastify.register(fastifyJwt, { secret: 'supersecretkey' });
fastify.register(websocket);

// Décorateur d’auth
fastify.decorate("authenticate", async function(request, reply) {
    try {
        await request.jwtVerify();
    } 
    catch (err) {
        reply.send(err);
    }
});

// Import de routes séparées
import userRoutes from './routes/users.js';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import socialRoutes from './routes/social.js';
import messageRoutes from './routes/messages.js';
import notificationRoutes from './routes/notifications.js';
import websocketRoutes from './routes/websocket.js';

// Enregistrement
fastify.register(userRoutes, { prefix: '/api' });
fastify.register(authRoutes, { prefix: '/api' });
fastify.register(profileRoutes, { prefix: '/api' });
fastify.register(socialRoutes, { prefix: '/api/social' });
fastify.register(messageRoutes, { prefix: '/api/messages' });
fastify.register(notificationRoutes, { prefix: '/api/notifications' });
fastify.register(websocketRoutes); // pas besoin de prefix pour ws

// Lancement
fastify.listen({ port: 3000, host: '0.0.0.0' }, (err) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
});
