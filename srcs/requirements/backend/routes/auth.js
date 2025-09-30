// routes/auth.js (FINAL - Usando speakeasy, qrcode, y node-fetch)

import bcrypt from 'bcrypt';
import { db } from '../db.js';
import speakeasy from 'speakeasy'; 
import qrcode from 'qrcode';       
import fetch from 'node-fetch'; // Utilizamos node-fetch

// Configuración de Google desde .env
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
// Asegúrate de que esta URL coincida con lo que tienes en tu .env y en la Consola de Google
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback';
const frontendBase = 'http://localhost:4443'; 

// Función auxiliar para emitir JWT
function createJwt(fastify, user) {
    return fastify.jwt.sign({
        id: user.id,
        username: user.username,
        twofa_verified: true, 
        twofa_active: user.twoaf === 1
    });
}

// Función auxiliar para buscar/crear usuario de Google
async function handleGoogleUser(profile) {
    const googleId = profile.id;
    const email = profile.emails?.[0].value;
    const username = profile.displayName;

    if (!email) throw new Error('Email no proporcionado por Google');

    let user = db.prepare('SELECT * FROM users WHERE google_id = ?').get(googleId);

    if (user) return user; 

    user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (user) { 
        db.prepare('UPDATE users SET google_id = ? WHERE id = ?').run(googleId, user.id);
        return db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
    }

    const placeholderHash = await bcrypt.hash('GOOGLE_AUTH_USER_PLACEHOLDER', 10);
    const result = db.prepare(
        'INSERT INTO users (username, email, google_id, password) VALUES (?, ?, ?, ?)'
    ).run(username, email, googleId, placeholderHash);
    
    return db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
}


export default async function authRoutes(fastify) {

    // -------------------------------------------------------------------
    // A) LOGIN LOCAL (Con chequeo 2FA)
    // -------------------------------------------------------------------
    fastify.post('/login', async(request, reply) =>
    {
        const { username, password } = request.body;

        const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
        const user = stmt.get(username);
        
        if(!user) return reply.code(401).send({ message: 'invalid user' });  
        
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return reply.code(402).send({ message: 'invalid password'});
        
        // **LÓGICA 2FA:** Si está activo, NO emitas el JWT.
        if (user.twoaf === 1) {
            return reply.send({
                message: '2FA_REQUIRED', 
                userId: user.id 
            });
        }
        
        const token = createJwt(fastify, user);
        return reply.send({ message: 'Login successful', token });
    });


    // -------------------------------------------------------------------
    // B) GOOGLE OAUTH
    // -------------------------------------------------------------------

    // 1.- El cliente redirige aquí
    fastify.get('/auth/google', async (request, reply) => {
        const url = `https://accounts.google.com/o/oauth2/v2/auth?` + 
            `client_id=${GOOGLE_CLIENT_ID}&` + 
            `redirect_uri=${GOOGLE_CALLBACK_URL}&` + 
            `response_type=code&` + 
            `scope=email%20profile&` + 
            `access_type=offline`;
        
        reply.redirect(url);
    });

    // 2. Callback de Google (Fastify recibe el código)
    fastify.get('/auth/google/callback', async (request, reply) => {
        const { code } = request.query;

        if (!code) {
            return reply.code(401).send({ message: 'Google authentication failed: no code received' });
        }
        
        try {
            // Intercambio el código por tokens de acceso
            const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    code: code,
                    client_id: GOOGLE_CLIENT_ID,
                    client_secret: GOOGLE_CLIENT_SECRET,
                    redirect_uri: GOOGLE_CALLBACK_URL,
                    grant_type: 'authorization_code',
                })
            });
            const tokenData = await tokenResponse.json();
            const accessToken = tokenData.access_token;

            // Paso 2: Obtener el perfil del usuario
            const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            const profile = await profileResponse.json();
            
            // Adaptar el perfil para la función interna
            const adaptedProfile = {
                id: profile.id,
                displayName: profile.name,
                emails: [{ value: profile.email }],
            };

            const user = await handleGoogleUser(adaptedProfile);
            
            // LÓGICA DE REDIRECCIÓN AÑADIDA AQUÍ:
            if (user.twoaf === 1) {
                // Redirige al frontend con el userId para la verificación 2FA
                return reply.redirect(`${frontendBase}/oauth-callback?userId=${user.id}`); 
            }

            const jwt = createJwt(fastify, user);
            // Redirige al frontend con el token JWT
            return reply.redirect(`${frontendBase}/oauth-callback?token=${jwt}`); 

        } catch (error) {
            fastify.log.error('Google Auth Error:', error);
            // Redirige al login del frontend si hay un fallo
            return reply.redirect(`${frontendBase}/login?error=google_failed`);
        }
    });


    // -------------------------------------------------------------------
    // C) 2FA TOTP (RUTAS)
    // -------------------------------------------------------------------
    
    // 3. Generar Secreto y QR (Protegida por JWT)
    fastify.get('/2fa/setup', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        // request.user viene del token JWT
        const userId = request.user.id; 
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

        if (user.twoaf === 1) return reply.send({ message: '2FA ya está activo.' });

        const secret = speakeasy.generateSecret({
            name: `TuApp:${user.email}`,
            length: 20
        });

        const otpauthUrl = secret.otpauth_url;
        const qrDataUrl = await qrcode.toDataURL(otpauthUrl);

        return reply.send({
            qrDataUrl: qrDataUrl,
            tempSecret: secret.base32,
            message: 'Escanea este QR y usa el código para activar 2FA.'
        });
    });

    // 4. Activar 2FA (Protegida por JWT)
    fastify.post('/2fa/enable', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const userId = request.user.id;
        const { token, tempSecret } = request.body; 

        if (!tempSecret) return reply.code(400).send({ error: 'Falta el secreto temporal.' });

        const verified = speakeasy.totp.verify({
            secret: tempSecret,
            encoding: 'base32',
            token: token,
            window: 1 
        });

        if (verified) {
            db.prepare('UPDATE users SET totp_secret = ?, twoaf = 1 WHERE id = ?').run(tempSecret, userId);
            
            const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
            const newToken = createJwt(fastify, user);

            return reply.send({ success: true, message: '2FA activado exitosamente.', token: newToken });
        } else {
            return reply.code(401).send({ error: 'Código TOTP incorrecto o expirado.' });
        }
    });

    // 5. Verificar 2FA (Usado después de Login Local o Google)
    fastify.post('/verify-2fa', async (request, reply) => {
        const { userId, token } = request.body; 
        
        if (!userId || !token) return reply.code(400).send({ error: 'Faltan credenciales.' });

        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

        if (user.twoaf !== 1 || !user.totp_secret) {
            return reply.code(400).send({ error: '2FA no está activo para este usuario.' });
        }

        const verified = speakeasy.totp.verify({
            secret: user.totp_secret,
            encoding: 'base32',
            token: token,
            window: 1 
        });

        if (verified) {
            const jwt = createJwt(fastify, user);
            return reply.send({ success: true, message: 'Verificación 2FA exitosa', token: jwt });
        } else {
            return reply.code(401).send({ error: 'Código TOTP incorrecto.' });
        }
    });

    // 6. Registro de usuarios (Se mantiene igual)
    fastify.post('/register', async (request, reply) => {
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