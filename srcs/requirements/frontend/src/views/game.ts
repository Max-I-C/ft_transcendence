import { navigateTo } from '../main.js';
import { logout } from './auth.js';
import { initializeWebSocket } from '../utils/webSocketUtils.js';

let pvpSocket: WebSocket | null = null;
let currentLobbyId: string | null = null;
let IsPlayer1: boolean = false;
let lastMoveTime = 0; // Pour throttling des mouvements PvP

// Tournament data structure
const tournament = {
    players: ['Player 1', 'Player 2', 'Player 3', 'Player 4'],
    matches: [
        { id: 1, player1: 'Player 1', player2: 'Player 2', winner: null },
        { id: 2, player1: 'Player 3', player2: 'Player 4', winner: null },
        { id: 3, player1: '', player2: '', winner: null } // Final match
    ],
    currentMatchIndex: 0
};

function updateLobbyPlayers(players: { id: string, username: string }[] = []) {
    const player1 = players[0]?.username || 'Waiting...';
    const player2 = players[1]?.username || 'Waiting...';

    document.getElementById('player1')!.textContent = player1;
    document.getElementById('player2')!.textContent = player2;
}

function listenToGameWebSocket(lobbyId: string) {
    if (pvpSocket) {
        pvpSocket.close();
    }
    const socket = initializeWebSocket();
    pvpSocket = socket;
    const canvas = document.getElementById('pong-canvas-pvp') as HTMLCanvasElement;
    const ctx = canvas?.getContext('2d');

    socket.addEventListener('message', async (event) => {
        try {
            const msg = JSON.parse(event.data);

            if (msg.lobbyId && msg.lobbyId !== lobbyId) return;
            
            if (msg.type === 'player_joined') {
                document.getElementById('player2')!.textContent = msg.player2;
                document.getElementById('lobby-status')!.innerHTML =
                    `<span style="color:green;">Player 2 has joined! Ready to start.</span>`;
            }

            if (msg.type === 'game_start') {
                document.getElementById('lobby-status')!.innerHTML =
                    `<span style="color:blue;">Game is starting...</span>`;
                document.getElementById('pvp-game-area')!.style.display = 'block';
            }

            if (msg.type === 'game_update' && ctx) {
                const state = msg.state;

                document.getElementById('score-pvp')!.textContent =
                    `Score: ${state.score1} - ${state.score2}`;

                if (state.gameOver) {
                    if(IsPlayer1)
                    {
                        const player1Username = document.getElementById('player1')?.textContent || 'Player 1';
                        const player2Username = document.getElementById('player2')?.textContent || 'Player 2';

                        const winnerTxt = state.score1 >= 5 ? "Player 1" : "Player 2";
                        document.getElementById("game-over-pvp")!.textContent =
                            `Game Over! Winner: ${winnerTxt}`;

                        async function getPlayerId(username: string) {
                            const token = localStorage.getItem('token');
                            try{
                                const res = await fetch(`/api/users/id?username=${username}`, {
                                    method: 'GET',
                                    headers: {
                                        'Authorization': `Bearer ${token}`
                                    }
                                });
                                const data = await res.json();
                                return(data.id);
                            }
                            catch(err){
                                console.error('Failed to find the username of the user',  err);
                                return null;
                            }
                        }
                        console.log('username', player1Username);
                        console.log('username', player2Username);
                        const player1Id = await getPlayerId(player1Username);
                        const player2Id = await getPlayerId(player2Username);

                        if(player1Id && player2Id) {
                            const player1 = { id: player1Id, score: state.score1 };
                            const player2 = { id: player2Id, score: state.score2 };


                            const winner = player1.score > player2.score ? player1 : player2;
                            const loser = winner === player1 ? player2 : player1;

                            const payload = {
                                player1: {
                                    id: player1Id,
                                    score: player1.score,
                                    result: player1 === winner ? "win" : "loss",
                                    points_change: player1 === winner ? 1 : -1
                                },
                                player2 : {
                                    id: player2Id,
                                    score: player2.score,
                                    result: player2 === winner ? "win" : "loss",
                                    points_change: player2 === winner ? 1 : -1
                                },
                                match_score: `${player1.score}-${player2.score}`
                            };
                            const token = localStorage.getItem('token');
                            try{
                                const res = await fetch('/api/register-match', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${token}`
                                    },
                                    body: JSON.stringify(payload)
                                });
                                const data = await res.json();
                                console.log('All data stored');
                            }
                            catch(err) {
                                console.error('Fail to register data', err);
                            }
                        }
                    }
                }

                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = '#222';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = 'white';
                ctx.fillRect(state.paddle1.x, state.paddle1.y, state.paddle1.width, state.paddle1.height);
                ctx.fillRect(state.paddle2.x, state.paddle2.y, state.paddle2.width, state.paddle2.height);
                ctx.beginPath();
                ctx.arc(state.ball.x, state.ball.y, state.ball.radius, 0, Math.PI * 2);
                ctx.fill();
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
                <p>Play against another player</p>
                <div class="card-effect"></div>
            </div>
            <div class="game-card disabled" id="tournament-game-card">
                <h2>Tournament !</h2>
                <p>Tournament in local game</p>
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
            <div class="game-interface">
                <div class="pvp-lobby">
                    <button id="join-pvp" class="game-button">🔗 Join/Create PvP Lobby</button>
                    <div id="lobby-status"></div>
                    <div id="lobby-players">
                        <p><strong>Player 1:</strong> <span id="player1">Waiting...</span></p>
                        <p><strong>Player 2:</strong> <span id="player2">Waiting...</span></p>
                    </div>
                </div>
                <div class="game-canvas-container">
                    <canvas id="pong-canvas-pvp" width="400" height="300"></canvas> 
                </div>
                <div class="game-score">
                    <p id="score-pvp">Score: 0 - 0</p>
                </div>
                <p id="game-over-pvp" class="game-over-message"></p>
                <button id="simulate-game" class="game-button">🎮 Simulate Game</button>
            </div>
        </div>
        <div id="tournament-area" style="display:none;">
            <h2>Tournament</h2>
            <div id="tournament-bracket">
                <p>Match 1: <span id="match1">Player 1 vs Player 2</span></p>
                <p>Match 2: <span id="match2">Player 3 vs Player 4</span></p>
            </div>
            <div id="tournament-bracket">
                <p>Winner match 1: <span id="match1Win"></span></p>
                <p>Winner match 2: <span id="match2Win"></span></p>
            </div>
            <div id="tournament-bracket">
                <p>WINNER 🏆: <span id="matchFinal"></span></p>
            </div>
            <div class="game-canvas-container">
                <canvas id="pong-canvas-tournament" width="400" height="300"></canvas>
            </div>
            <div class="game-score">
                <p id="score-tournament">Score: 0 - 0</p>
            </div>
            <div id="tournament-controls">
                <button id="start-tournament" class="game-button">Start Tournament</button>
            </div>
        </div>
    `;

    document.body.className = 'home-page';
    document.getElementById('game-link')!.addEventListener('click', () => navigateTo('/game'));
    document.getElementById('profile-link')!.addEventListener('click', () => navigateTo('/profile'));
    document.getElementById('social-link')!.addEventListener('click', () => navigateTo('/social'));
    document.getElementById('home-link')!.addEventListener('click', () => navigateTo('/home'));
    document.getElementById('logout-link')!.addEventListener('click', () => logout());

    const localCard = document.getElementById('local-game-card')!;
    const pvpCard = document.getElementById('pvp-game-card')!;
    const tournamentCard = document.getElementById('tournament-game-card')!;

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

    tournamentCard.addEventListener('click', () => {
        (document.querySelector('.game-choice-container') as HTMLElement)!.style.display = 'none';
        document.getElementById('tournament-area')!.style.display = 'block';
        startTournament();
    });

	function initPvpGame() {
		const app = document.getElementById('pvp-game-area')!;

		document.getElementById('join-pvp')!.addEventListener('click', async () => {
			const token = localStorage.getItem('token');
			const res = await fetch('/api/game/pvp/lobby', {
				method: 'POST',
				headers: { 'Authorization': `Bearer ${token}` }
			});
			const data = await res.json();
            currentLobbyId = data.lobbyId;
            
            IsPlayer1 = !data.joined;

            if(currentLobbyId)
                listenToGameWebSocket(currentLobbyId);
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
        document.addEventListener('keydown', async (e) => {
            const now = Date.now();
            if (now - lastMoveTime < 50) return;
            
            let direction = null;

            if (e.key === 'w') direction = 'up';
            if (e.key === 's') direction = 'down';

            if (!direction) return;
            
            lastMoveTime = now;

            try {
                const token = localStorage.getItem('token');
                await fetch('/api/game/pvp/move-paddle', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ direction })
                });
            }   
            catch (err) {
                console.error('Error moving paddle in PvP', err);
            }
        });
	}

    function initLocalGame() {
        const token = localStorage.getItem('token');
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
                const token = localStorage.getItem('token');
                await fetch('/api/game/move-paddle', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
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
                    const token = localStorage.getItem('token');
                    const res = await fetch('/api/game/init', {                    
                        headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                        },
                    });
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
                const token = localStorage.getItem('token');
                await fetch('/api/game/restart', { 
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                });
                if (gameInterval) {
                    clearInterval(gameInterval);
                    gameInterval = null;
                }
                document.getElementById("game-over")!.textContent = "";
                document.getElementById("score")!.textContent = "Score: 0 - 0";
                document.getElementById("play-game")?.click();
            } catch (err) {
                console.error("Error restarting game", err);
            }
        });
    }

    function startTournament() {
        const tournamentArea = document.getElementById('tournament-area');
        const match1 = document.getElementById('match1');
        const match1Win = document.getElementById('match1Win');
        const match2 = document.getElementById('match2');
        const match2Win = document.getElementById('match2Win');
        const finalMatch = document.getElementById('matchFinal');
        const startButton = document.getElementById('start-tournament');
        if (startButton) {
            const newButton = startButton.cloneNode(true);
            startButton.replaceWith(newButton);

            newButton.addEventListener('click', () => {
                runTournament();
            });
        }

        if (!tournamentArea || !match1Win || !match2Win || !match1 || !match2 || !finalMatch || !startButton) return;

        // Reset tournament state
        tournament.matches.forEach(match => {
            match.winner = null;
            match.player1 = match.player1 || '';
            match.player2 = match.player2 || '';
        });
        match1.textContent = 'Player 1 vs Player 2';
        match2.textContent = 'Player 3 vs Player 4';

        tournamentArea.style.display = 'block';
        document.addEventListener('keydown', async (e) => {
            let direction = null;
            let paddle = null;

            if (e.key === 'w') {
                direction = 'up';
                paddle = 1;
            }
            if (e.key === 's') {
                direction = 'down';
                paddle = 1;
            }
            if (e.key === 'o') {
                direction = 'up';
                paddle = 2;
            }
            if (e.key === 'l') {
                direction = 'down';
                paddle = 2;
            }

            if (!direction || !paddle) return;

            try {
                const token = localStorage.getItem('token');
                await fetch('/api/game/move-paddle', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ direction, paddle })
                });
            } catch (err) {
                console.error('Error moving paddle:', err);
            }
        });
        const playMatch = (match: { player1: string; player2: string; winner: string | null }) => {
            return new Promise<string>((resolve) => {
                const canvas = document.getElementById('pong-canvas-tournament') as HTMLCanvasElement | null;
                if (!canvas) {
                    console.error('Canvas element not found');
                    return;
                }

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    console.error('Canvas context is null');
                    return;
                }

                let gameInterval: number | null = null;

                const resetGameState = async () => {
                    try {
                        const token = localStorage.getItem('token');
                        const res = await fetch('/api/game/restart', {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });
                        if (!res.ok) {
                            throw new Error('Failed to reset game state');
                        }
                        const data = await res.json();
                        console.log('Game state reset:', data);
                    } catch (err) {
                        console.error('Error resetting game state:', err);
                    }
                };

                const updateGame = async () => {
                    try {
                        const token = localStorage.getItem('token');
                        const res = await fetch('/api/game/init', {
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            }
                        });
                        const data = await res.json();

                        // Update the canvas with the game state
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        ctx.fillStyle = '#222';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                        ctx.fillStyle = 'white';
                        ctx.fillRect(data.paddle1.x, data.paddle1.y, data.paddle1.width, data.paddle1.height);
                        ctx.fillRect(data.paddle2.x, data.paddle2.y, data.paddle2.width, data.paddle2.height);
                        ctx.beginPath();
                        ctx.arc(data.ball.x, data.ball.y, data.ball.radius, 0, Math.PI * 2);
                        ctx.fill();

                        // Check for game over
                        if (data.gameOver) {
                            if (gameInterval !== null) {
                                clearInterval(gameInterval);
                            }
                            resolve(data.score1 > data.score2 ? match.player1 : match.player2);
                        }
                        document.getElementById('score-tournament')!.textContent = `Score: ${data.score1} - ${data.score2}`;
                    } catch (err) {
                        console.error('Error updating game state:', err);
                    }
                };

                const startGame = async () => {
                    await resetGameState();
                    gameInterval = window.setInterval(updateGame, 1000 / 60);
                };

                startGame();
            });
        };

        const runTournament = async () => {
            try {
                match1Win.textContent = '';
                match2Win.textContent = '';
                finalMatch.textContent = '';
                const winner1 = await playMatch(tournament.matches[0]);
                match1Win.textContent = `${winner1}`;
                match1Win.style.color = "green";
                tournament.matches[2].player1 = winner1;
                console.log('Finish_1');
                await startCountdown("Match 2 starting in...");
                const winner2 = await playMatch(tournament.matches[1]);
                match2Win.textContent = `${winner2}`;
                match2Win.style.color = "green";
                tournament.matches[2].player2 = winner2;
                console.log('Finish_2');
                await startCountdown("Final starting in...");
                const finalWinner = await playMatch(tournament.matches[2]);
                finalMatch.textContent = `${finalWinner}`;
                finalMatch.style.color = "green";
                console.log('Finish_final');
            } catch (error) {
                console.error('Error during tournament execution:', error);
            }
        };

        startButton.addEventListener('click', () => {
            runTournament();
        });
    }

    document.getElementById('start-tournament')?.addEventListener('click', startTournament);
}

function startCountdown(message: string): Promise<void> {
    return new Promise<void>((resolve) => {
        const countdownElement = document.createElement('div');
        countdownElement.id = 'countdown-overlay';
        countdownElement.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            color: white;
            font-size: 3em;
            font-family: monospace;
        `;

        const messageElement = document.createElement('div');
        messageElement.textContent = message;
        messageElement.style.marginBottom = '20px';
        messageElement.style.fontSize = '0.5em';

        const timerElement = document.createElement('div');
        timerElement.id = 'countdown-timer';
        timerElement.style.fontSize = '2em';
        timerElement.style.color = '#00ff00';

        countdownElement.appendChild(messageElement);
        countdownElement.appendChild(timerElement);
        document.body.appendChild(countdownElement);

        let count = 5;
        timerElement.textContent = count.toString();

        const countdownInterval = setInterval(() => {
            count--;
            timerElement.textContent = count.toString();

            if (count <= 0) {
                clearInterval(countdownInterval);
                document.body.removeChild(countdownElement);
                resolve();
            }
        }, 1000);
    });
}


