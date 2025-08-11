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
			<p>Let's play</p>
		</div>
	`;

    document.body.className = 'home-page';
	document.getElementById('game-link')!.addEventListener('click', () => navigateTo('/game'));
	document.getElementById('profile-link')!.addEventListener('click', () => navigateTo('/profile'));
	document.getElementById('social-link')!.addEventListener('click', () => navigateTo('/social'));
	document.getElementById('home-link')!.addEventListener('click', () => navigateTo('/home'));
	document.getElementById('logout-link')!.addEventListener('click', () => logout());

	
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
			console.log('✅ Match ajouté :', data);
		}
		catch(err){
			console.error('Error during simulation', err);
		}
	});

}
