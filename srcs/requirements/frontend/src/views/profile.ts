import { navigateTo } from '../main.js';

export function showProfileView() {
	const app = document.getElementById('app')!;
	app.innerHTML = `
		<nav class="terminal-navbar">
			<ul class="terminal-nav-links">
				<li><a href="#" id="home-link">Home</a></li>
				<li><a href="#" id="game-link">Game</a></li>
				<li><a href="#" id="profile-link">Profile</a></li>
			</ul>
		</nav>
		<div class="glass">
			<h2>Profile</h2>
			<p><strong>Nom :</strong> Maxence</p>
			<p><strong>Niveau :</strong> 42</p>
			<p><strong>Status :</strong> En ligne 🟢</p>
		</div>
	`;
    
    document.body.className = 'home-page';
	document.getElementById('game-link')!.addEventListener('click', () => navigateTo('/game'));
	document.getElementById('profile-link')!.addEventListener('click', () => navigateTo('/profile'));
	document.getElementById('home-link')!.addEventListener('click', () => navigateTo('/home'));
}
