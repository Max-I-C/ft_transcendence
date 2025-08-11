import { navigateTo } from '../main.js';
import { logout } from './auth.js';

export function showHomeView() {
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
			<p>Welcome 👋</p>
		</div>
	`;

    document.body.className = 'home-page';
	document.getElementById('game-link')!.addEventListener('click', () => navigateTo('/game'));
	document.getElementById('profile-link')!.addEventListener('click', () => navigateTo('/profile'));
	document.getElementById('social-link')!.addEventListener('click', () => navigateTo('/social'));
	document.getElementById('home-link')!.addEventListener('click', () => navigateTo('/home'));
	document.getElementById('logout-link')!.addEventListener('click', () => logout());
}
