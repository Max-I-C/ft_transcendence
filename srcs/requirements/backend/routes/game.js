import { connectedUsers } from '../connectedUsers.js';
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
}