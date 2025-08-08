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
		<div class="profile-container">
			<div class="glass profile-card">
				<button id="edit-profile" class="edit-btn" title="Edit your profil">🔧</button>
				<div class="profile-header">
					<div class="profile-picture" id="profile-picture"></div>
					<h2>Profile</h2>
				</div>
				<p><strong>Userame :</strong> <span id="username-text">loading.....</span> <input id="username-input" type="text" style="display: none;"></p>
				<p><strong>Email :</strong> <span id="email-text">loading.....</span> <input id="email-input" type="email" style="display: none;"></p>
				<p><strong>2AF :</strong> <span id="twoaf-text">OFF</span> <input id="twoaf-input" type="checkbox" style="display: none;"></p>
				<p><strong>Status :</strong> Online 🟢</p>
				<button id="save-profile" class="save-btn" style="display: none;">💾 Save</button>
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
		</div>

		<div class="stat-card">
			<div class="stat-cards">
				<div class="game-stat">
					<h3>Games played</h3>
					<p id="games-played">loading...</p>
				</div>
				<div class="game-stat">
					<h3>Games won</h3>
					<p id="games-won">loading...</p>
				</div>
				<div class="game-stat">
					<h3>Games lost</h3>
					<p id="games-lost">loading...</p>
				</div>
			</div>
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

	(document.getElementById('username-text') as HTMLElement).innerText = profile.username || 'Unknow';
	(document.getElementById('email-text') as HTMLElement).innerText	= profile.email || 'Unknow';
	(document.getElementById('game_play') as HTMLElement).innerText = profile.game_play || 'Unknow';
	(document.getElementById('game_win') as HTMLElement).innerText	= profile.game_win || 'Unknow';
	(document.getElementById('game_loss') as HTMLElement).innerText = profile.game_loss || 'Unknow';
	(document.getElementById('score_total') as HTMLElement).innerText	= profile.score_total || 'Unknow';
	(document.getElementById('level') as HTMLElement).innerText = profile.level || 'Unknow';
	(document.getElementById('rank') as HTMLElement).innerText	= profile.rank || 'Unknow';

	document.getElementById('edit-profile')!.addEventListener('click', () => {
		const usernameText = document.getElementById('username-text')!;
		const usernameInput = document.getElementById('username-input') as HTMLInputElement;
		const emailText = document.getElementById('email-text')!;
		const emailInput = document.getElementById('email-input') as HTMLInputElement;
		const twoafText = document.getElementById('twoaf-text')!;
		const twoafInput = document.getElementById('twoaf-input') as HTMLInputElement;
		const saveBtn = document.getElementById('save-profile')!;

		usernameInput.value = usernameText.textContent || '';
		emailInput.value = emailText.textContent || '';
		twoafInput.checked = twoafText.textContent === 'ON';

		usernameText.style.display = 'none';
		usernameInput.style.display = 'inline';
		emailText.style.display = 'none';
		emailInput.style.display = 'inline';
		twoafText.style.display = 'none';
		twoafInput.style.display = 'inline';
		saveBtn.style.display = 'inline';
	});

	document.getElementById('save-profile')!.addEventListener('click', async () => {
		const token = localStorage.getItem('token');

		const updatedProfile = {
			username: (document.getElementById('username-input') as HTMLInputElement).value,
			email: (document.getElementById('email-input') as HTMLInputElement).value,
			twoaf: (document.getElementById('twoaf-input') as HTMLInputElement).value,
		};

		const response = await fetch('/api/profile/update', {
			method: 'POST',
			headers:{
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${token}`
			},
			body: JSON.stringify(updatedProfile)
		});
		if(response.ok){
			alert('Profil mis a jour !');
			showProfileView();
		}
		else{
			alert('Erreur lors de l update');
		}
	});

}

