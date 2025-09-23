import { connectedUsers } from '../connectedUsers.js';
import { db } from '../db.js';

// -- Definition of the variable we will use in the backend -- //
const lobbies = []; // Liste des lobbies PVP
const userGameStates = new Map();
const createLobby = (id, player) => ({
    id,
    players: [player],
    status: 'waiting',
    gameState: createInitialGameState()
});

function checkPaddleCollision(ball, paddle){
    const closestx = Math.max(paddle.x, Math.min(ball.x, paddle.x + paddle.width));
    const closesty = Math.max(paddle.y, Math.min(ball.y, paddle.y + paddle.height));
    const dx = ball.x - closestx;
    const dy = ball.y - closesty;

    return(dx * dx + dy * dy) <= (ball.radius * ball.radius);
}

function createInitialGameState() {
    return {
        paddle1: { x: 10, y: 120, width: 10, height:60}, 
        paddle2: { x: 380, y: 120, width: 10, height: 60},
        ball: {x: 200, y: 150, radius: 8, dx: 1, dy: 1, speed: 3},
        score1: 0,
        score2: 0,
        gameOver: false
    };
}

function updateGame(gameState) {
    const canvasWidth = 400;
    const canvasHeight = 300;

    if (gameState.gameOver) return;

    // Déplacement de la balle
    gameState.ball.x += gameState.ball.dx * gameState.ball.speed;
    gameState.ball.y += gameState.ball.dy * gameState.ball.speed;

    // Collision avec paddle gauche
    if (checkPaddleCollision(gameState.ball, gameState.paddle1)) {
        gameState.ball.dx *= -1;
        gameState.ball.speed = Math.min(gameState.ball.speed * 1.1, 12);
        gameState.ball.x = gameState.paddle1.x + gameState.paddle1.width + gameState.ball.radius;
    }

    // Collision avec paddle droit
    if (checkPaddleCollision(gameState.ball, gameState.paddle2)) {
        gameState.ball.dx *= -1;
        gameState.ball.speed = Math.min(gameState.ball.speed * 1.1, 12);
        gameState.ball.x = gameState.paddle2.x - gameState.ball.radius;
    }

    // Collision haut/bas
    if (gameState.ball.y <= 0 || gameState.ball.y >= canvasHeight) {
        gameState.ball.dy *= -1;
    }

    // Sortie à gauche
    if (gameState.ball.x <= 0) {
        gameState.score2 += 1;
        resetBall(gameState, 1);
    }

    // Sortie à droite
    if (gameState.ball.x >= canvasWidth) {
        gameState.score1 += 1;
        resetBall(gameState, -1);
    }

    // Fin de partie
    if (gameState.score1 >= 5 || gameState.score2 >= 5) {
        gameState.gameOver = true;
    }
}

function resetBall(gameState, direction) {
    gameState.ball.x = 200;
    gameState.ball.y = 150;
    gameState.ball.dx = direction * 2;
    gameState.ball.dy = 2;
    gameState.ball.speed = 2;
}


setInterval(() => {
    lobbies.forEach(lobby => {
        if (lobby.status === 'ready' && lobby.gameState) {
            updateGame(lobby.gameState);
            lobby.players.forEach(p => {
                const socket = connectedUsers.get(String(p.id));
                if (socket) {
                    socket.send(JSON.stringify({
                        type: 'game_update',
                        lobbyId: lobby.id,
                        state: lobby.gameState
                    }));
                }
            });
            if(lobby.gameState.gameOver) {
                console.log('Removing lobby');
                const index = lobbies.findIndex(l => l.id === lobby.id);
                if (index !== -1) lobbies.splice(index, 1);
            }
        }
    });
}, 1000 / 60); // 60 FPS serveur

// -- All functions -- //
export default async function gameRoutes(fastify, opts) {
    const canvasWidth = 400;
    const canvasHeight = 300;
    
    
    const gameState = {
        paddle1: { x: 10, y: 120, width: 10, height:60}, 
        paddle2: { x: 380, y: 120, width: 10, height: 60},
        ball: {x: 200, y: 150, radius: 8, dx: 1, dy: 1, speed: 3},
        score1: 0,
        score2: 0,
        gameOver: false
    }

    fastify.post('/game/restart', { preValidation: [fastify.authenticate] }, async (request, reply) => {
        console.log("request.user:", request.user);
        const userId = request.user.id;
        const newGameState = createInitialGameState();
        userGameStates.set(userId, newGameState);
        reply.send(newGameState);
    });

    fastify.get('/game/init', { preValidation: [fastify.authenticate] }, async (request, reply) => {
        const userId = request.user.id;

        if(!userGameStates.has(userId)) {
            userGameStates.set(userId, createInitialGameState());
        }

        const gameState = userGameStates.get(userId);
        
        if(gameState.gameOver){
            return gameState;
        }
        gameState.ball.x += gameState.ball.dx * gameState.ball.speed;
        gameState.ball.y += gameState.ball.dy * gameState.ball.speed;
        
        if(checkPaddleCollision(gameState.ball, gameState.paddle1)) {
            gameState.ball.dx *= -1;
            gameState.ball.speed *= 1.1;
            gameState.ball.speed = Math.min(gameState.ball.speed, 12);
            gameState.ball.x = gameState.paddle1.x + gameState.paddle1.width + gameState.ball.radius;
        }

        if(checkPaddleCollision(gameState.ball, gameState.paddle2)) {
            gameState.ball.dx *= -1;
            gameState.ball.speed *= 1.1;
            gameState.ball.speed = Math.min(gameState.ball.speed, 12);
            gameState.ball.x = gameState.paddle2.x - gameState.ball.radius;
        }

        if(gameState.ball.y <= 0 || gameState.ball.y >= canvasHeight){
            gameState.ball.dy *= -1;
        }

        if(gameState.ball.x <= 0) {
            gameState.score2 += 1;
            gameState.ball.x = canvasWidth / 2;
            gameState.ball.y = canvasHeight / 2;
            gameState.ball.dx = 2;
            gameState.ball.dy = 2;
            gameState.ball.speed = 2;
        }
        if(gameState.ball.x >= canvasWidth){
            gameState.score1 += 1;
            gameState.ball.x = canvasWidth / 2;
            gameState.ball.y = canvasHeight / 2;
            gameState.ball.dx = -2;
            gameState.ball.dy = 2;
            gameState.ball.speed = 2;
        }

        if(gameState.score1 >= 5 || gameState.score2 >= 5) {
            gameState.gameOver = true;
        }
        return gameState;
    });

    fastify.post('/game/move-paddle', { preValidation: [fastify.authenticate] }, async (request, reply) => {
        const { direction, paddle } = request.body;
        const speed = 10;
        const userId = request.user.id;

        const gameState = userGameStates.get(userId);
        if(!gameState) return reply.code(404).send({ error: 'Game not found'});

        if (paddle === 1){
            if (direction === 'up') {
                gameState.paddle1.y = Math.max(0, gameState.paddle1.y - speed);
            }
            if (direction === 'down') {
                gameState.paddle1.y = Math.min(canvasHeight - gameState.paddle1.height, gameState.paddle1.y + speed);
            }
        }
        if (paddle === 2){
            if (direction === 'up') {
                gameState.paddle2.y = Math.max(0, gameState.paddle2.y - speed);
            }
            if (direction === 'down') {
                gameState.paddle2.y = Math.min(canvasHeight - gameState.paddle2.height, gameState.paddle2.y + speed);
            }        
        }
        reply.send({ status: true });
    });

    fastify.post('/game/pvp/lobby', { preValidation: [fastify.authenticate] }, async (req, reply) => {
        const userId = req.user.id;
        const username = req.user.username;

        let lobby = lobbies.find(l => l.players.length === 1 && l.status === 'waiting');
        if (lobby) {
            lobby.players.push({ id: userId, username });
            lobby.status = 'ready';
            lobby.gameState = createInitialGameState();

            const player1Socket = connectedUsers.get(String(lobby.players[0].id));
            if (player1Socket) {
                console.log(`Notifying Player 1 (${lobby.players[0].username}) that Player 2 (${username}) joined.`);
                player1Socket.send(JSON.stringify({
                    type: 'player_joined',
                    lobbyId: lobby.id,
                    player2: username
                }));
            }
            lobby.players.forEach(p => {
                const socket = connectedUsers.get(String(p.id));
                if(socket) {
                    socket.send(JSON.stringify({
                        type: 'game_start',
                        lobbyId: lobby.id,
                        state: lobby.gameState
                    }));
                }
            });
            reply.send({ lobbyId: lobby.id, joined: true, players: lobby.players});
        }
        else {
            const newLobby = {
                id: Date.now().toString(),
                players: [{ id: userId, username }],
                status: 'waiting'
            };
            lobbies.push(newLobby);
            reply.send({ lobbyId: newLobby.id, joined: false, players: newLobby.players });
        }
    });

    fastify.post('/game/pvp/move-paddle', {preValidation: [fastify.authenticate]}, async (req, reply) => {
        const { direction } = req.body;
        const userId = req.user.id;

        const lobby = lobbies.find(l => l.players.some(p => p.id === userId) && l.status === 'ready');
        if(!lobby || !lobby.gameState) return reply.code(404).send({ error: 'Lobby not found or game not ready' });

        const isPlayer1 = lobby.players[0].id === userId;
        const paddle = isPlayer1 ? lobby.gameState.paddle1 : lobby.gameState.paddle2;
        const speed = 10;

        if (direction === 'up') paddle.y = Math.max(0, paddle.y - speed);
        if (direction === 'down') paddle.y = Math.min(300 - paddle.height, paddle.y + speed);

        reply.send({ ok: true });
    });

    fastify.get('/game/pvp/lobby/:id', { preValidation: [fastify.authenticate] }, async (req, reply) => {
        const lobby = lobbies.find(l => l.id === req.params.id);
        if (!lobby) return reply.code(404).send({ error: 'Lobby not found' });
        reply.send({ id: lobby.id, players: lobby.players, status: lobby.status });
    });

    fastify.post('/register-match', { preValidation: [fastify.authenticate] }, async (req, reply) => {
        const { player1, player2, match_score } = req.body;

        if (!player1 || !player2 || !match_score) {
            return reply.status(400).send({ message: "Invalid match data" });
        }

        try {
            const transaction = db.transaction(() => {
                const insertMatch = db.prepare(`
                    INSERT INTO match_history (user_id, match_score, result, points_change)
                    VALUES (?, ?, ?, ?)
                `);
                
                const updateUserStats = db.prepare(`
                    UPDATE users
                    SET
                        game_play = game_play + 1,
                        game_win = game_win + CASE WHEN ? = 'win' THEN 1 ELSE 0 END,
                        game_loss = game_loss + CASE WHEN ? = 'loss' THEN 1 ELSE 0 END,
                        score_total = score_total + ?
                    WHERE id = ?
                `);

                // for P1 //
                insertMatch.run(player1.id, match_score, player1.result, player1.points_change);
                updateUserStats.run(player1.result, player1.result, player1.points_change, player1.id);

                // for P2 //
                insertMatch.run(player2.id, match_score, player2.result, player2.points_change);
                updateUserStats.run(player2.result, player2.result, player2.points_change, player2.id);
            });
            transaction();

            return reply.status(201).send({ message: 'Match registered successfully' });
        }
        catch(error) {
            console.error('[SERVER] Database error:', error);
            return reply.status(500).send({ message: 'Database error: ' + error.message });
        }
    });

    // - /game/private/lobby - // 
    fastify.post('/game/private/lobby', { preValidation: [fastify.authenticate] }, async (req, reply) => {
        const userId = req.user.id;
        const username = req.user.username;
        const { invitedId } = req.body; // l'ID de l'ami invité doit être passé depuis le front

        if (!invitedId) {
            return reply.code(400).send({ error: 'Missing invitedId' });
        }

        // Création d’un lobby privé
        const newLobby = {
            id: Date.now().toString(),
            players: [{ id: userId, username }],
            invitedId,               // On stocke l’ami autorisé à rejoindre
            status: 'waiting'
        };

        lobbies.push(newLobby);

        // Notifier l’ami invité (si connecté via websocket)
        const invitedSocket = connectedUsers.get(String(invitedId));
        if (invitedSocket) {
            invitedSocket.send(JSON.stringify({
                type: 'invited_to_game',
                lobbyId: newLobby.id,
                inviter: username
            }));
        }

        reply.send({ lobbyId: newLobby.id, joined: false, players: newLobby.players });
    });

    fastify.get('/game/private/lobby/:id', { preValidation: [fastify.authenticate] }, async (req, reply) => {
        const userId = req.user.id;
        const lobby = lobbies.find(l => l.id === req.params.id);

        if (!lobby) {
            return reply.code(404).send({ error: 'Lobby not found' });
        }

        // Vérifier que l'utilisateur est bien l'host ou l'invité
        const isPlayer = lobby.players.some(p => p.id === userId);
        if (!isPlayer) {
            return reply.code(403).send({ error: 'You are not a member of this private lobby' });
        }

        reply.send({
            id: lobby.id,
            players: lobby.players,
            status: lobby.status
        });
    });

    fastify.post('/game/private/join/:id', { preValidation: [fastify.authenticate] }, async (req, reply) => {
        const userId = req.user.id;
        const lobbyId = req.params.id;

        const lobby = lobbies.find(l => l.id === lobbyId);
        if (!lobby) return reply.code(404).send({ error: 'Lobby not found' });

        const isAlreadyInLobby = lobby.players.some(p => p.id === userId);
        
        if (!isAlreadyInLobby) {
            lobby.players.push({ id: userId, username: req.user.username });
            
            lobby.players.forEach(p => {
                if (p.id !== userId) {
                    const socket = connectedUsers.get(String(p.id));
                    if (socket) {
                        socket.send(JSON.stringify({
                            type: 'player_joined_private',
                            lobbyId: lobby.id,
                            players: lobby.players,
                            newPlayer: { id: userId, username: req.user.username }
                        }));
                    }
                }
            });
            
            const newPlayerSocket = connectedUsers.get(String(userId));
            if (newPlayerSocket) {
                newPlayerSocket.send(JSON.stringify({
                    type: 'joined_private_lobby',
                    lobbyId: lobby.id,
                    players: lobby.players,
                    status: 'success'
                }));
            }
            
            if (lobby.players.length === 2) {
                lobby.status = 'ready';
                lobby.gameState = createInitialGameState(); // Initialiser l'état du jeu
                
                // Notifier TOUS les joueurs que le jeu commence
                lobby.players.forEach(p => {
                    const socket = connectedUsers.get(String(p.id));
                    if (socket) {
                        socket.send(JSON.stringify({
                            type: 'game_start',
                            lobbyId: lobby.id,
                            state: lobby.gameState,
                            players: lobby.players
                        }));
                    }
                });
                
                console.log(`Private game started in lobby ${lobbyId}`);
            }
        }

        reply.send({ players: lobby.players, status: lobby.status });
    });
    
    fastify.post('/game/private/join/refused/:id', { preValidation: [fastify.authenticate] }, async (req, reply) => {
        const userId = req.user.id;          // Celui qui refuse
        const userName = req.user.username;  // Son username
        const lobbyId = req.params.lobbyId;

        const lobby = lobbies.find(l => l.id === lobbyId);
        if (!lobby) return reply.code(404).send({ error: 'Lobby not found' });

        lobby.players.forEach(p => {
            if (p.id !== userId) {
                const socket = connectedUsers.get(String(p.id));
                if (socket) {
                    socket.send(JSON.stringify({
                        type: 'invitation_refused',
                        lobbyId,
                        by: { id: userId, username: userName }
                    }));
                }
            }
        });
        lobby.players = lobby.players.filter(p => p.id !== userId);
        reply.send({ status: 'refused' });
    });
}