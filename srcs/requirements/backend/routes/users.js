/*
// -- users.js -- //
#######################################################################################
# The users.js file is just a file that provide utile functions for user management   #
#######################################################################################
*/

import { db } from '../db.js';

export default async function userRoutes(fastify) {
  // # This function is just a test # //
  fastify.get('/ping', async (request, reply) => {
    return { pong: 'it works! ' };
  });

  // GET /api/users
  // # This function is responsible for fetching all users # //
  fastify.get('/users', async (request, reply) => {
    const rows = db.prepare('SELECT * FROM users').all();
    return rows;
  });

  //GET /api/users/id?username=...
  // # This function is responsible for fetching a user's ID by their username # //
  fastify.get('/users/id', { preValidation: [fastify.authenticate] }, async (request, reply) => {
    const username = request.query.username;
    if (!username) {
      return reply.code(400).send({ message: 'Username missing' });
    }
    const user = db.prepare('SELECT id FROM users WHERE username = ? LIMIT 1').get(username);
    if (!user) {
      return reply.code(404).send({ message: 'User not found' });
    }
    return reply.send({ id: user.id });
  });
}