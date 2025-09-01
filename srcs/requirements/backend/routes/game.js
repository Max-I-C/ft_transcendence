

function checkPaddleCollision(ball, paddle){
    const closestx = Math.max(paddle.x, Math.min(ball.x, paddle.x + paddle.width));
    const closesty = Math.max(paddle.y, Math.min(ball.y, paddle.y + paddle.height));
    const dx = ball.x - closestx;
    const dy = ball.y - closesty;

    return(dx * dx + dy * dy) <= (ball.radius * ball.radius);
}

export default async function gameRoutes(fastify, opts) {
    const canvasWidth = 400;
    const canvasHeight = 300;
    
    
    const gameState = {
        paddle1: { x: 10, y: 120, width: 10, height:60}, 
        paddle2: { x: 380, y: 120, width: 10, height: 60},
        ball: {x: 200, y: 150, radius: 8, dx: 2, dy:2}
    }
    fastify.get('/game/init', async (request, reply) => {
        gameState.ball.x += gameState.ball.dx;
        gameState.ball.y += gameState.ball.dy;
        
        if(checkPaddleCollision(gameState.ball, gameState.paddle1)) {
            gameState.ball.dx *= -1;
            gameState.ball.x = gameState.paddle1.x + gameState.paddle1.width + gameState.ball.radius;
        }

        if(checkPaddleCollision(gameState.ball, gameState.paddle2)) {
            gameState.ball.dx *= -1;
            gameState.ball.x = gameState.paddle2.x - gameState.ball.radius;
        }

        if(gameState.ball.y <= 0 || gameState.ball.y >= canvasHeight){
            gameState.ball.dy *= -1;
        }

        if(gameState.ball.x <= 0 || gameState.ball.x >= canvasWidth) {
            gameState.ball.dx *= -1;
        }
        return gameState;
    });
}