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
        if(gameState.ball.y <= 0 || gameState.ball.y >= canvasHeight){
            gameState.ball.dy *= -1;
        }

        if(gameState.ball.x <= 0 || gameState.ball.x >= canvasWidth) {
            gameState.ball.dx *= -1;
        }
        return gameState;
    });
}