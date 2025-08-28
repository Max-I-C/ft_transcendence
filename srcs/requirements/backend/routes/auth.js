/*
// -- auth.js -- //
#######################################################################################
# The auth.js file is responsible for handling user authentication, including login   #
# and registration. It defines the routes and logic for user authentication-related   #
# operations, such as validating credentials and issuing JWT tokens.                  #
#######################################################################################
*/

import bcrypt from 'bcrypt';
import { db } from '../db.js';

// -- Here is the definition of the button "login" and the "register" of the frontend -- //
// # it's just a basic implementation that will compare or store the data in the DB # //
export default async function authRoutes(fastify) {

    fastify.post('/login', async(request, reply) =>
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

    fastify.post('/register', async (request, reply) =>
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
}