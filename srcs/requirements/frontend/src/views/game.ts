import { navigateTo } from '../main.js';
import { logout } from './auth.js';

export function showGameView() {
    const app = document.getElementById('app')!;
    app.innerHTML = `
        <nav class="terminal-navbar">
            <ul class="terminal-nav-links">
                <li><a href="#" id="home-link">Home</a></li>
                <li><a href="#" id="game-link">Game</a></li>
                <li><a href="#" id="social-link">Social</a></li>
                <li><a href="#" id="profile-link">Profile</a></li>
                <li><a href="#" id="logout-link">⏻</a></li>
            </ul>
        </nav>
        <div class="game-choice-container">
            <div class="game-card" id="local-game-card">
                <h2>Local Game</h2>
                <p>Play in the same computer with your friends!</p>
                <div class="card-effect"></div>
            </div>
            <div class="game-card disabled" id="pvp-game-card">
                <h2>PvP</h2>
                <p>Play against another player (Coming soon)</p>
                <div class="card-effect"></div>
            </div>
        </div>
        <div id="local-game-area" style="display:none;">
            <div class="welcome-bubble">
                <button id="simulate-game" class="button" type="button">Simulate game result</button>
                <button id="play-game" class="button" type="button">Play game</button>
                <button id="restart-game" class="button" type="button">Restart game</button>
                <p id="game-number">Number: --</p>
                <p>Let's play</p>
                <p id="score">Score: 0 - 0</p>
                <p id="game-over" style="color:red; font-weight:bold;"></p>
                <div style="display: flex; justify-content: center; align-items: center; height: 400px;">
                    <canvas id="pong-canvas" width="400" height="300" style="background: #222; border-radius: 8px;"></canvas>
                </div>
            </div>
        </div>
    `;

    // Navigation
    document.body.className = 'home-page';
    document.getElementById('game-link')!.addEventListener('click', () => navigateTo('/game'));
    document.getElementById('profile-link')!.addEventListener('click', () => navigateTo('/profile'));
    document.getElementById('social-link')!.addEventListener('click', () => navigateTo('/social'));
    document.getElementById('home-link')!.addEventListener('click', () => navigateTo('/home'));
    document.getElementById('logout-link')!.addEventListener('click', () => logout());

    // Effet de carte
    const localCard = document.getElementById('local-game-card')!;
    const pvpCard = document.getElementById('pvp-game-card')!;

    localCard.addEventListener('mouseenter', () => {
        localCard.classList.add('active');
    });
    localCard.addEventListener('mouseleave', () => {
        localCard.classList.remove('active');
    });
    localCard.addEventListener('click', () => {
        (document.querySelector('.game-choice-container') as HTMLElement)!.style.display = 'none';
        document.getElementById('local-game-area')!.style.display = 'block';
        initLocalGame();
    });

    pvpCard.addEventListener('mouseenter', () => {
        pvpCard.classList.add('active');
    });
    pvpCard.addEventListener('mouseleave', () => {
        pvpCard.classList.remove('active');
    });
    pvpCard.addEventListener('click', () => {
        alert('PvP mode is coming soon!');
    });

    function initLocalGame() {
        const canvas = document.getElementById('pong-canvas') as HTMLCanvasElement;
        const ctx = canvas.getContext('2d')!;
        let gameInterval: number | null = null;

        document.addEventListener('keydown', async (e) => {
            if(!gameInterval) return;
            let direction = null;
            let paddle = null;

            if(e.key === 'ArrowUp' || e.key === 'w') {
                direction = 'up';
                paddle = 1;
            }
            if(e.key === 'ArrowDown' || e.key === 's') {
                direction = 'down';
                paddle = 1;
            }
            if(e.key === 'o') {
                direction = 'up';
                paddle = 2;
            }
            if(e.key === 'l') {
                direction = 'down';
                paddle = 2;
            } 
            if(!direction || !paddle) return;

            try{
                await fetch('/api/game/move-paddle', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ direction, paddle })
                })
            }
            catch(err){
                console.error('Error moving paddle', err);
            }
        });

        document.getElementById('restart-game')?.addEventListener('click', async () => {
            try {
                const res = await fetch("/api/game/restart", {method: "POST"});
                const data = await res.json();
                document.getElementById("game-over")!.textContent = "";
            } 
            catch (err) {
                console.error("Error restarting game", err);
            }
        });
        document.getElementById('play-game')?.addEventListener('click', async () => {
            if(gameInterval) return;
            gameInterval = window.setInterval(async () => { 
                try{
                    const res = await fetch('/api/game/init');
                    const data = await res.json();

                    document.getElementById('game-number')!.textContent = 
                        `Ball: (${data.ball.x.toFixed(0)}, ${data.ball.y.toFixed(0)})`;
                    document.getElementById('score')!.textContent = 
                        `Score: ${data.score1} - ${data.score2}`;

                    if(data.gameOver){
                        const winner = data.score1 >= 5 ? "Player 1" : "Player 2";
                        document.getElementById("game-over")!.textContent = `Game Over ! Winner: ${winner}`;
                        if (gameInterval) {
                            clearInterval(gameInterval);
                            gameInterval = null;
                        }
                    }
                    
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.fillStyle = '#222';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.fillStyle = 'white';
                    ctx.fillRect(data.paddle1.x, data.paddle1.y, data.paddle1.width, data.paddle1.height);
                    ctx.fillRect(data.paddle2.x, data.paddle2.y, data.paddle2.width, data.paddle2.height);
                    ctx.beginPath();
                    ctx.arc(data.ball.x, data.ball.y, data.ball.radius, 0, Math.PI * 2);
                    ctx.fill();
                }
                catch(err){
                    console.error('Error fetching game number', err);
                }
            }, 25);
        });
        document.getElementById('simulate-game')?.addEventListener('click', async() => {
            const token = localStorage.getItem('token');
            const matchData = {
                match_score: '2-3',
                result: 'win',
                points_change: +20
            };
            try{
                const res = await fetch('/api/simulate-match', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(matchData)
                });
                const data = await res.json();
                console.log('✅ Match added :', data);
            }
            catch(err){
                console.error('Error during simulation', err);
            }
        });
    }
}
