import { navigateTo } from '../main.js';
import { logout } from './auth.js';
import { initializeWebSocket } from '../utils/webSocketUtils.js';

function updateLobbyPlayers(players: { id: string, username: string }[] = []) {
    const player1 = players[0]?.username || 'Waiting...';
    const player2 = players[1]?.username || 'Waiting...';

    document.getElementById('player1')!.textContent = player1;
    document.getElementById('player2')!.textContent = player2;
}

function listenToGameWebSocket() {
    const socket = initializeWebSocket();

    socket.addEventListener('message', (event) => {
        try {
            const msg = JSON.parse(event.data);

            // Gestion des événements spécifiques au jeu
            if (msg.type === 'player_joined') {
                console.log(`Player joined lobby: ${msg.lobbyId}`);
                document.getElementById('player2')!.textContent = msg.player2;
                document.getElementById('lobby-status')!.innerHTML = `<span style="color:green;">Player 2 has joined! Ready to start.</span>`;
            }

            if (msg.type === 'game_start') {
                console.log(`Game started in lobby: ${msg.lobbyId}`);
                document.getElementById('lobby-status')!.innerHTML = `<span style="color:blue;">Game is starting...</span>`;
            }
        } 
        catch (err) {
            console.error('Failed to parse WebSocket message:', err);
        }
    });
}
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
            <div class="game-interface">
                <div class="game-header">
                    <h2>Local Game</h2>
                    <p id="game-over" class="game-over-message"></p>
                </div>
                <div class="game-canvas-container">
                    <canvas id="pong-canvas" width="400" height="300"></canvas>
                </div>
                <div class="game-controls">
                    <button id="play-game" class="game-button">▶️ Play Game</button>
                    <button id="restart-game" class="game-button">🔄 Restart Game</button>
                </div>
                <div class="game-score">
                    <p id="score">Score: 0 - 0</p>
                </div>
            </div>
        </div>
		<div id="pvp-game-area" style="display:none;">
            <div class="pvp-lobby">
                <button id="join-pvp" class="game-button">🔗 Join/Create PvP Lobby</button>
                <div id="lobby-status"></div>
                <div id="lobby-players">
                    <p><strong>Player 1:</strong> <span id="player1">Waiting...</span></p>
                    <p><strong>Player 2:</strong> <span id="player2">Waiting...</span></p>
                </div>
            </div>
			<button id="simulate-game" class="game-button">🎮 Simulate Game</button>
            <div id="lobby-status"></div>
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

    localCard.addEventListener('click', () => {
        (document.querySelector('.game-choice-container') as HTMLElement)!.style.display = 'none';
        document.getElementById('local-game-area')!.style.display = 'block';
        initLocalGame();
    });

    pvpCard.addEventListener('click', () => {
        (document.querySelector('.game-choice-container') as HTMLElement)!.style.display = 'none';
		document.getElementById('pvp-game-area')!.style.display = 'block';
		initPvpGame();
    });

	function initPvpGame() {
        listenToGameWebSocket();
		const app = document.getElementById('pvp-game-area')!;

		document.getElementById('join-pvp')!.addEventListener('click', async () => {
			const token = localStorage.getItem('token');
			const res = await fetch('/api/game/pvp/lobby', {
				method: 'POST',
				headers: { 'Authorization': `Bearer ${token}` }
			});
			const data = await res.json();
			if (data.joined) {
				document.getElementById('lobby-status')!.innerHTML = `<span style="color:green;">Lobby found! Waiting for game to start...</span>`;
			} else {
				document.getElementById('lobby-status')!.innerHTML = `<span style="color:orange;">Lobby created. Waiting for another player...</span>`;
			}
            updateLobbyPlayers(data.players);
		});

        document.getElementById('simulate-game')?.addEventListener('click', async () => {
            const token = localStorage.getItem('token');
            const matchData = {
                match_score: '2-3',
                result: 'win',
                points_change: +20
            };
            try {
                const res = await fetch('/api/simulate-match', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(matchData)
                });
                const data = await res.json();
                console.log('✅ Match added:', data);
            } catch (err) {
                console.error('Error during simulation', err);
            }
        });
	}

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

        document.getElementById('play-game')?.addEventListener('click', async () => {
            if (gameInterval) return;
            gameInterval = window.setInterval(async () => {
                try {
                    const res = await fetch('/api/game/init');
                    const data = await res.json();

                    document.getElementById('score')!.textContent = `Score: ${data.score1} - ${data.score2}`;

                    if (data.gameOver) {
                        const winner = data.score1 >= 5 ? "Player 1" : "Player 2";
                        document.getElementById("game-over")!.textContent = `Game Over! Winner: ${winner}`;
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
                } catch (err) {
                    console.error('Error fetching game data', err);
                }
            }, 25);
        });

        document.getElementById('restart-game')?.addEventListener('click', async () => {
            try {
                await fetch("/api/game/restart", { method: "POST" });
                document.getElementById("game-over")!.textContent = "";
            } catch (err) {
                console.error("Error restarting game", err);
            }
        });
    }
}
