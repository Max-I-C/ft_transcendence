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
		<div class="welcome-bubble">
            <button id="simulate-game" class="button" type="button">Simulate game result</button>
            <button id="play-game" class="button" type="button">Play game</button>
            <p id="game-number">Number: --</p>
            <p>Let's play</p>
            <div style="display: flex; justify-content: center; align-items: center; height: 400px;">
                <canvas id="pong-canvas" width="400" height="300" style="background: #222; border-radius: 8px;"></canvas>
            </div>
        </div>
	`;

	const canvas = document.getElementById('pong-canvas') as HTMLCanvasElement;
	const ctx = canvas.getContext('2d')!;

	let gameInterval: number | null = null;

    document.body.className = 'home-page';
	document.getElementById('game-link')!.addEventListener('click', () => navigateTo('/game'));
	document.getElementById('profile-link')!.addEventListener('click', () => navigateTo('/profile'));
	document.getElementById('social-link')!.addEventListener('click', () => navigateTo('/social'));
	document.getElementById('home-link')!.addEventListener('click', () => navigateTo('/home'));
	document.getElementById('logout-link')!.addEventListener('click', () => logout());
	
	// Je penses que la strat c'est d'avoir un websocket qui envois une requetes backend pour dire que l'utilisateur a bouger la P1. Et que ca change sa coter frontend. Par contre je sais pas comment gerer les colision alors //

	document.getElementById('play-game')?.addEventListener('click', async () => {
        if(gameInterval) return;

		gameInterval = window.setInterval(async () => { 

			try{
				const res = await fetch('/api/game/init');
				const data = await res.json();

				document.getElementById('game-number')!.textContent = 
					`Ball: (${data.ball.x.toFixed(0)}, ${data.ball.y.toFixed(0)})`;
				
				ctx.clearRect(0, 0, canvas.width, canvas.height);
				
				// Fond //
				ctx.fillStyle = '#222';
				ctx.fillRect(0, 0, canvas.width, canvas.height);
				
				// Padles // 
				ctx.fillStyle = 'white';
				ctx.fillRect(data.paddle1.x, data.paddle1.y, data.paddle1.width, data.paddle1.height);
				ctx.fillRect(data.paddle2.x, data.paddle2.y, data.paddle2.width, data.paddle2.height);

				// Ball // 
				ctx.beginPath();
				ctx.arc(data.ball.x, data.ball.y, data.ball.radius, 0, Math.PI * 2);
				ctx.fill();
			}
			catch(err){
				console.error('Error fetching game number', err);
			}
		}, 50);
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
