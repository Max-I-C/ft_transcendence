/*
// -- profile.js -- //
#######################################################################################
# The profile.js file is responsible for handling user profile information, including #
# fetching and updating user details. It defines the routes and logic for profile     #
# page related operations.                                                            #
#######################################################################################
*/

import bcrypt from 'bcrypt';
import { db } from '../db.js';
import { isUserOnline } from '../onlineUsers.js';

export default async function profileRoutes(fastify) {
  // GET /api/profile
  // # This function collects user information. # //
  fastify.get('/profile', { preValidation: [fastify.authenticate] }, async (request, reply) => {
    const user = request.user;
    const stmtProfile = db.prepare(`
      SELECT username, email, game_play, game_win, game_loss, score_total, level
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

    profile.is_online = isUserOnline(user.id);

    return { profile, match_logs };
  });

  // POST /api/profile/update
  // # This is the function that is linked to the edit button on the profile page # //
  fastify.post('/profile/update', { preValidation: [fastify.authenticate] }, async (request, reply) => {
    const user = request.user;
    const { username, email, twoaf, password } = request.body;

    const existingUser = db.prepare('SELECT * FROM users WHERE (username = ? OR email = ?) AND id != ?')
      .get(username, email, user.id);

    if (existingUser) {
      return reply.code(409).send({ message: 'Username or Email already used' });
    }

    try {
      let query = `UPDATE users SET username = ?, email = ?, twoaf = ?`;
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

  // POST /api/simulate-match
  // # This function is here to simulate a win match, this function will be removed in the moment that we make the game part # //
  fastify.post('/simulate-match', { preValidation: [fastify.authenticate] }, async (request, reply) => {
    const user = request.user;
    const { match_score, result, points_change } = request.body;

    if (!match_score || !result || !points_change)
      return reply.code(400).send({ message: 'Error, not enought info' });

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
      return { message: 'Simualtion complete' };
    } 
    catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ message: 'Server error' });
    }
  });

  // public profile by id (GET /api/users/profile/:id)
  // # This function collect the data when a user is looking for the profile of one of his friend # //
  fastify.get('/users/profile/:id', { preValidation: [fastify.authenticate] }, async (request, reply) => {
    const id = parseInt(request.params.id, 10);
    if (isNaN(id)) {
      return reply.code(400).send({ message: 'Invalid user id' });
    }

    const stmt = db.prepare(`
      SELECT username, game_play, game_win, game_loss, score_total, level
      FROM users
      WHERE id = ?
      LIMIT 1
    `);
    const profile = stmt.get(id);
    if (!profile) {
      return reply.code(404).send({ message: 'User not found' });
    }

    return reply.send(profile);
  });
}