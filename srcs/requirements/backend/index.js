import Fastify from 'fastify';
import bcrypt from 'bcrypt';
import fastifyJwt from '@fastify/jwt';
import { db } from './db.js';

const fastify = Fastify({ logger: true });

fastify.register(fastifyJwt, {
	secret: 'supersecretkey'
});

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
    const stmt = db.prepare('SELECT username, email FROM users WHERE id = ?');
    const profile = stmt.get(user.id);
    return{profile};
});