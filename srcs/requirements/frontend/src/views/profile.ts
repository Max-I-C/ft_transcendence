import { navigateTo } from '../main.js';
import { logout } from './auth.js';

function drawDonutChart(win: number, loss: number): void {
	const canvas = document.getElementById('donutChart') as HTMLCanvasElement;
	if (!canvas) return;

	const ctx = canvas.getContext('2d');
	if (!ctx) return;

	const total = win + loss;
	if (total === 0) return;

	const winAngle = (win / total) * 2 * Math.PI;
	const lossAngle = (loss / total) * 2 * Math.PI;

	ctx.clearRect(0, 0, canvas.width, canvas.height);

	const centerX = canvas.width / 2;
	const centerY = canvas.height / 2;
	const radius = Math.min(centerX, centerY) - 10;

	// Partie "win"
	ctx.beginPath();
	ctx.moveTo(centerX, centerY);
	ctx.fillStyle = "#4caf50";
	ctx.arc(centerX, centerY, radius, 0, winAngle);
	ctx.fill();

	// Partie "loss"
	ctx.beginPath();
	ctx.moveTo(centerX, centerY);
	ctx.fillStyle = "#f44336";
	ctx.arc(centerX, centerY, radius, winAngle, winAngle + lossAngle);
	ctx.fill();

	// Trou du donut (cercle blanc au centre)
	ctx.beginPath();
	ctx.fillStyle = "#fff";
	ctx.arc(centerX, centerY, radius * 0.5, 0, 2 * Math.PI);
	ctx.fill();

	// Ajouter le texte du pourcentage centré
	const winratePercent = total === 0 ? 0 : Math.round((win / total) * 100);
	const text = `${winratePercent}%`;

	ctx.fillStyle = "#000"; // Couleur du texte (noir)
	ctx.font = `${radius * 0.2}px Arial`; // Taille de la police proportionnelle au radius
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";

	ctx.fillText(text, centerX, centerY);
}


export async function showProfileView() {
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
				<p><strong>New password :</strong> <input id="password-input" type="password" style="display: none;"></p>
				<p><strong>Confirm password :</strong> <input id="password-confirm-input" type="password" style="display: none;"></p>
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
			<div class="match-logs">
				<h3>Last Match Logs</h3>
				<ul id="logs-list">
					<li>Loading match data...</li>
				</ul>
			</div>

			<div class="chart-container">
				<h3>Game Win/Loss Ratio</h3>
				<canvas id="donutChart" width="300" height="300"></canvas>
				<div class="legend" style="text-align:center; margin-top:10px;">
					<span style="color: #4caf50; font-weight:bold;">&#9632; Win</span>
					<span style="color: #f44336; font-weight:bold; margin-left: 20px;">&#9632; Loss</span>
				</div>
			</div>
			<div class="rank-section">
				<!-- Rang actuel -->
				<div class="current-rank">
					<div class="rank-title">Actual Rank</div>
					<img id="currentRankImg" src="" alt="Current Rank">
					<div id="currentRankLabel" class="rank-label"></div>
				</div>

				<!-- Boîte score + rang suivant -->
				<div class="score-next">
					<div class="score">
						<span class="score-value" id="score"></span>
						<span class="score-label">Points</span>
					</div>
					<div class="separator"></div>
					<div class="next-rank">
						<div class="rank-title">Next Rank</div>
						<img id="nextRankImg" src="" alt="Next Rank">
						<div id="nextRankLabel" class="next-label"></div>
					</div>
				</div>
			</div>
		</div>
	`;
    
    document.body.className = 'home-page';
	document.getElementById('game-link')!.addEventListener('click', () => navigateTo('/game'));
	document.getElementById('profile-link')!.addEventListener('click', () => navigateTo('/profile'));
	document.getElementById('social-link')!.addEventListener('click', () => navigateTo('/social'));	
	document.getElementById('home-link')!.addEventListener('click', () => navigateTo('/home'));
	document.getElementById('logout-link')!.addEventListener('click', () => logout());

	const token = localStorage.getItem('token');
	const response = await fetch('/api/profile', {
		headers:{
			'Authorization': `Bearer ${token}`
		}
	});
	
	interface MatchLog {
		match_date: string;
		result: string;
		points_change: number;
	}	  
	const data = await response.json();
	const profile = data.profile;
	const matchLogs: MatchLog[] = data.match_logs;

	(document.getElementById('username-text') as HTMLElement).innerText = profile.username ?? 'Unknow';
	(document.getElementById('email-text') as HTMLElement).innerText	= profile.email ?? 'Unknow';
	(document.getElementById('game_play') as HTMLElement).innerText = profile.game_play ?? 'Unknow';
	(document.getElementById('game_win') as HTMLElement).innerText	= profile.game_win ?? 'Unknow';
	(document.getElementById('game_loss') as HTMLElement).innerText = profile.game_loss ?? 'Unknow';
	(document.getElementById('score_total') as HTMLElement).innerText	= profile.score_total ?? 'Unknow';
	(document.getElementById('level') as HTMLElement).innerText = profile.level ?? 'Unknow';

	(document.getElementById('games-played') as HTMLElement).innerText = profile.game_play ?? 'Unknow';
	(document.getElementById('games-won') as HTMLElement).innerText = profile.game_win ?? 'Unknow';
	(document.getElementById('games-lost') as HTMLElement).innerText = profile.game_loss ?? 'Unknow';
	(document.getElementById('score') as HTMLElement).innerText = profile.score_total ?? 'Unknow';
	
	const currentRankImg = document.getElementById('currentRankImg') as HTMLImageElement;
	const currentRankLabel = document.getElementById('currentRankLabel') as HTMLDivElement;

	const nextRankImg = document.getElementById('nextRankImg') as HTMLImageElement;
	const nextRankLabel = document.getElementById('nextRankLabel') as HTMLDivElement;
	
	const score = profile.score_total;

	const ranks = [
  		{ name: 'Bronze', min: 0, max: 99, img: '/views/images/bronze.png', next: 'Silver', nextPoints: 100, nextImg: '/views/images/silver.png' },
		{ name: 'Silver', min: 100, max: 199, img: '/views/images/silver.png', next: 'Gold', nextPoints: 200, nextImg: '/views/images/gold.png' },
		{ name: 'Gold', min: 200, max: 299, img: '/views/images/gold.png', next: 'Amethiste', nextPoints: 300, nextImg: '/views/images/amethiste.png' },
		{ name: 'Amethiste', min: 300, max: Infinity, img: '/views/images/amethiste.png', next: null, nextPoints: null, nextImg: null }
	];

	const currentRank = ranks.find(r => score >= r.min && score <= r.max);

	if (currentRank) {
  		// Mettre à jour le rang actuel
  		if (currentRankImg) currentRankImg.src = currentRank.img;
  		if (currentRankLabel) currentRankLabel.textContent = currentRank.name;
		(document.getElementById('rank') as HTMLElement).innerText	= currentRank.name ?? 'Unknow';
  		// Mettre à jour le rang suivant
		if (currentRank.next) {
			if (nextRankImg) nextRankImg.src = currentRank.nextImg!;
    		if (nextRankLabel) nextRankLabel.textContent = `${currentRank.next} - ${currentRank.nextPoints} pts`;
  		} 
  		else {
    		if (nextRankImg) nextRankImg.style.display = 'none';
			if (nextRankLabel) nextRankLabel.textContent = 'Max Rank';
  		}
	}

	const logsList = (document.getElementById('logs-list'))!;
	logsList.innerHTML = '';

	if(matchLogs && matchLogs.length > 0) {
		matchLogs.forEach((log: MatchLog) => {
			const li = document.createElement('li');
			li.textContent = `Date: ${new Date(log.match_date).toLocaleString()} - Result: ${log.result} - Score: ${log.points_change}`;
			logsList.appendChild(li);
		});
	}
	else {
		logsList.innerHTML = '<li>No match logs found.</li>'
	}

	if (typeof profile.game_win === 'number' && typeof profile.game_loss === 'number') {
		drawDonutChart(profile.game_win, profile.game_loss);
	}

	document.getElementById('edit-profile')!.addEventListener('click', () => {
		const usernameText = document.getElementById('username-text')!;
		const usernameInput = document.getElementById('username-input') as HTMLInputElement;
		const emailText = document.getElementById('email-text')!;
		const emailInput = document.getElementById('email-input') as HTMLInputElement;
		const twoafText = document.getElementById('twoaf-text')!;
		const twoafInput = document.getElementById('twoaf-input') as HTMLInputElement;
		const saveBtn = document.getElementById('save-profile')!;

    	const passwordInput = document.getElementById('password-input') as HTMLInputElement;
    	const passwordConfirmInput = document.getElementById('password-confirm-input') as HTMLInputElement;

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
		passwordInput.style.display = 'inline';
    	passwordConfirmInput.style.display = 'inline';
	});

	document.getElementById('save-profile')!.addEventListener('click', async () => {
		const token = localStorage.getItem('token');
    	const password = (document.getElementById('password-input') as HTMLInputElement).value;
    	const confirmPassword = (document.getElementById('password-confirm-input') as HTMLInputElement).value;

		if (password && password !== confirmPassword) {
			alert('Passwords do not match!');
			return;
		}

		const updatedProfile : any = {
			username: (document.getElementById('username-input') as HTMLInputElement).value,
			email: (document.getElementById('email-input') as HTMLInputElement).value,
			twoaf: (document.getElementById('twoaf-input') as HTMLInputElement).checked,
		};
		
		if (password) {
        	updatedProfile.password = password;
    	}

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

