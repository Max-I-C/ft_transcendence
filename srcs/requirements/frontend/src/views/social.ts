import { navigateTo } from '../main.js';
import { logout } from './auth.js';

export function showSocialView() {
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
		<div class="social-container">
    		<section class="friends-column glass" aria-label="Liste des amis">
				<h2>Mes amis</h2>
      			<ul class="friends-list" role="list">
        			<li tabindex="0">@Maxence</li>
					<li tabindex="0">@Alice</li>
					<li tabindex="0">@Bob</li>
					<li tabindex="0">@Charlie</li>
      			</ul>
				<form class="add-friend" onsubmit="event.preventDefault(); addFriend();">
        			<input id="friendUsername" type="text" placeholder="Ajouter un ami par username" aria-label="Nom d'utilisateur à ajouter" required />
        			<button id="addBtn" type="submit" disabled>Ajouter</button>
      			</form>
    		</section>
			<section class="chat-bubble glass-conversation" aria-label="Zone de conversation">
      			<h2>Conversation</h2>
      			<div class="chat-empty">
					Sélectionne un ami pour afficher la conversation ici.
      			</div>
    		</section>
  		</div>
	`;

    document.body.className = 'social-page';
	document.getElementById('game-link')!.addEventListener('click', () => navigateTo('/game'));
	document.getElementById('profile-link')!.addEventListener('click', () => navigateTo('/profile'));
	document.getElementById('home-link')!.addEventListener('click', () => navigateTo('/home'));
    document.getElementById('social-link')!.addEventListener('click', () => navigateTo('/social'));
	document.getElementById('logout-link')!.addEventListener('click', () => logout());
}
