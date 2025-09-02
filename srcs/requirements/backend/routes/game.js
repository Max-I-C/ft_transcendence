import { connectedUsers } from '../connectedUsers.js';
// -- Definition of the variable we will use in the backend -- //
function checkPaddleCollision(ball, paddle){
    const closestx = Math.max(paddle.x, Math.min(ball.x, paddle.x + paddle.width));
    const closesty = Math.max(paddle.y, Math.min(ball.y, paddle.y + paddle.height));
    const dx = ball.x - closestx;
    const dy = ball.y - closesty;

    return(dx * dx + dy * dy) <= (ball.radius * ball.radius);
}

const lobbies = []; // Liste des lobbies PVP

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

    fastify.post('/game/restart', async (request, reply) => {
        gameState.paddle1 = { x: 10, y: 120, width: 10, height: 60 }; 
        gameState.paddle2 = { x: 380, y: 120, width: 10, height: 60 };
        gameState.ball = { x: 200, y: 150, radius: 8, dx: 1, dy: 1, speed: 3 };
        gameState.score1 = 0;
        gameState.score2 = 0;
        gameState.gameOver = false;
        reply.send(gameState);
    });

    fastify.get('/game/init', async (request, reply) => {
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

    fastify.post('/game/move-paddle', async (request, reply) => {
        const { direction, paddle } = request.body;
        const speed = 10;

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

        const player1Socket = connectedUsers.get(String(lobby.players[0].id));
        if (player1Socket) {
            console.log(`Notifying Player 1 (${lobby.players[0].username}) that Player 2 (${username}) joined.`);
            player1Socket.send(JSON.stringify({
                type: 'player_joined',
                lobbyId: lobby.id,
                player2: username
            }));
        } 
        else {
        console.error(`Player 1 socket not found for user ID: ${lobby.players[0].id}`);
        }

            reply.send({ lobbyId: lobby.id, joined: true, players: lobby.players });
        } else {
            const newLobby = {
                id: Date.now().toString(),
                players: [{ id: userId, username }],
                status: 'waiting'
            };
            lobbies.push(newLobby);
            reply.send({ lobbyId: newLobby.id, joined: false, players: newLobby.players });
        }
    });

    fastify.get('/game/pvp/lobby/:id', { preValidation: [fastify.authenticate] }, async (req, reply) => {
        const lobby = lobbies.find(l => l.id === req.params.id);
        if (!lobby) return reply.code(404).send({ error: 'Lobby not found' });
        reply.send({ id: lobby.id, players: lobby.players, status: lobby.status });
    });
}