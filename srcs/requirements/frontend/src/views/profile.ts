import { navigateTo } from '../main.js';

export async function showProfileView() {
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
			<p><strong>Nom :<span id="username">loading.....</span></p>
			<p><strong>Email :<span id="email">loading.....</span></p>
			<p><strong>Status :</strong> Online 🟢</p>
		</div>
	`;
    
    document.body.className = 'home-page';
	document.getElementById('game-link')!.addEventListener('click', () => navigateTo('/game'));
	document.getElementById('profile-link')!.addEventListener('click', () => navigateTo('/profile'));
	document.getElementById('home-link')!.addEventListener('click', () => navigateTo('/home'));
	
	
	try{
		const token = localStorage.getItem('token');
		if(!token)
			throw new Error('Token not found, please login');

		const response = await fetch('/api/profile', {
			headers:{
				'Authorization': `Bearer ${token}`
			}
		});
		if(!response)
			throw new Error('Failed to fecth the profile');
		const data = await response.json();
		const profile = data.profile;

		(document.getElementById('username') as HTMLElement).innerText = profile.username || 'Unknow';
		(document.getElementById('email') as HTMLElement).innerText	= profile.email || 'Unknow';
	}
	catch(error)
	{
		console.error(error);
		(document.getElementById('username') as HTMLElement).innerText = 'Error data';
		(document.getElementById('email') as HTMLElement).innerText	= 'Error data';
	}

}
