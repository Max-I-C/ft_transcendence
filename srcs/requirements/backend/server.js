/*
// -- server.js -- //
######################################################################################
# The server.js is the "main" file of the backend. This files is resposible of the   #
# overall configuration and initialization of the backend services, including        #
# database connections, middleware setup, and route registration.                    #
######################################################################################
*/

// -- Import of all the required modules -- //
import Fastify from 'fastify';
import fastifyJwt from '@fastify/jwt';
import websocket from '@fastify/websocket';
import { db } from './db.js';
import path from 'path';
import { fileURLToPath } from 'url';

const fastify = Fastify({ logger: true });
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// -- definition of the JWT authentication middleware and the websocket -- //
fastify.register(fastifyJwt, { secret: 'supersecretkey' });
fastify.register(websocket);

// -- function use in a lot of the function in the other files to authenticate users with a token -- //
fastify.decorate("authenticate", async function(request, reply) {
    try {
        await request.jwtVerify();
    } 
    catch (err) {
        reply.send(err);
    }
});

// -- Import of all the other files that contain all the functions, so if you want to add something register it here guys --//
import userRoutes from './routes/users.js';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import socialRoutes from './routes/social.js';
import messageRoutes from './routes/messages.js';
import notificationRoutes from './routes/notifications.js';
import websocketRoutes from './routes/websocket.js';
import gameRoutes from './routes/game.js';
import fastifyStatic from '@fastify/static';

// -- Here we are adding the prefix /api to the routes, like this you don't need to define all the function with /api/... --// 
fastify.register(userRoutes, { prefix: '/api' });
fastify.register(authRoutes, { prefix: '/api' });
fastify.register(profileRoutes, { prefix: '/api' });
fastify.register(socialRoutes, { prefix: '/api/social' });
fastify.register(gameRoutes, { prefix: '/api' });
fastify.register(messageRoutes, { prefix: '/api/messages' });
fastify.register(notificationRoutes, { prefix: '/api/notifications' });
fastify.register(websocketRoutes); // pas besoin de prefix pour ws
fastify.register(fastifyStatic, {
  root: path.join(__dirname, 'uploads'),
  prefix: '/uploads/',
});

// -- That is just for the websocket to know in wich port to listen -- //
fastify.listen({ port: 3000, host: '0.0.0.0' }, (err) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
});
