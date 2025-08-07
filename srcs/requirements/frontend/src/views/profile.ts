import { navigateTo } from '../main.js';
import { logout } from './auth.js';

export async function showProfileView() {
	const app = document.getElementById('app')!;
	app.innerHTML = `
		<nav class="terminal-navbar">
			<ul class="terminal-nav-links">
				<li><a href="#" id="home-link">Home</a></li>
				<li><a href="#" id="game-link">Game</a></li>
				<li><a href="#" id="profile-link">Profile</a></li>
				<li><a href="#" id="logout-link">⏻</a></li>
			</ul>
		</nav>
		<div class="glass">
			<h2>Profile</h2>
			<p><strong>Nom :<span id="username">loading.....</span></p>
			<p><strong>Email :<span id="email">loading.....</span></p>
			<p><strong>Status :</strong> Online 🟢</p>
		</div>
		<div class="glass">
			<h2>Game data</h2>
			<p><strong>Game played :<span id="game_play">loading.....</span></p>
			<p><strong>Game win :<span id="game_win">loading.....</span></p>
			<p><strong>Game loss :<span id="game_loss">loading.....</span></p>
			<p><strong>Score total :<span id="score_total">loading.....</span></p>
			<p><strong>Level :<span id="level">loading.....</span></p>
			<p><strong>Rank :<span id="rank">loading.....</span></p>
		</div>
	`;
    
    document.body.className = 'home-page';
	document.getElementById('game-link')!.addEventListener('click', () => navigateTo('/game'));
	document.getElementById('profile-link')!.addEventListener('click', () => navigateTo('/profile'));
	document.getElementById('home-link')!.addEventListener('click', () => navigateTo('/home'));
	document.getElementById('logout-link')!.addEventListener('click', () => logout());
	

	const token = localStorage.getItem('token');
	const response = await fetch('/api/profile', {
		headers:{
			'Authorization': `Bearer ${token}`
		}
	});
	const data = await response.json();
	const profile = data.profile;

	(document.getElementById('username') as HTMLElement).innerText = profile.username || 'Unknow';
	(document.getElementById('email') as HTMLElement).innerText	= profile.email || 'Unknow';
	(document.getElementById('game_play') as HTMLElement).innerText = profile.game_play || 'Unknow';
	(document.getElementById('game_win') as HTMLElement).innerText	= profile.game_win || 'Unknow';
	(document.getElementById('game_loss') as HTMLElement).innerText = profile.game_loss || 'Unknow';
	(document.getElementById('score_total') as HTMLElement).innerText	= profile.score_total || 'Unknow';
	(document.getElementById('level') as HTMLElement).innerText = profile.level || 'Unknow';
	(document.getElementById('rank') as HTMLElement).innerText	= profile.rank || 'Unknow';
}
