import { navigateTo } from '../../main.js';
import { logout } from '../auth.js';
import { setupSocket } from './socialSocket.js';
import { loadFriendList, setupAddFriendForm } from './socialFriends.js';
import { loadNotification } from './socialRequests.js';
import { setupContextMenu } from './socialContextMenu.js';
import { renderSocialUI } from './socialUI.js'; // crée / complète socialUI.js si nécessaire

export function showSocialView() {
    const app = document.getElementById('app')!;
    // si renderSocialUI existe, utilise-le ; sinon injecte un HTML minimaliste
    if (typeof renderSocialUI === 'function') {
        renderSocialUI(app);
    } else {
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
                    <div id="pending-requests" class="pending-requests glass">
                        <h3>Friends requests</h3>
                        <ul class="friends-list" role="list" id="pending-list"></ul>
                    </div>
                    <h2>Mes amis</h2>
                    <ul class="friends-list" role="list" id="friends-list"></ul>
                    <form class="add-friend" id="add-friend-form">
                        <input id="friendUsername" type="text" placeholder="Ajouter un ami par username" required />
                        <button id="addBtn" type="submit" disabled>Ajouter</button>
                    </form>
                </section>
                <section class="chat-bubble glass-conversation" aria-label="Zone de conversation">
                    <h2>Conversation</h2>
                    <div class="chat-empty">Sélectionne un ami pour afficher la conversation ici.</div>
                </section>
            </div>
            <div id="profile-popup" class="profile-popup hidden" role="dialog" aria-hidden="true"></div>
            <div id="context-menu" class="context-menu hidden">
                <ul>
                    <li id="profile-action">👤 See profile</li>
                    <li id="invite-action">🎮 Invite to play</li>
                    <li id="block-action">🚫 Block</li>
                    <li id="remove-action">❌ Delete</li>
                </ul>
            </div>
        `;
    }

    setupSocket((socket) => {
        setupAddFriendForm(socket);
        setupContextMenu(socket);
        loadNotification(socket);
        loadFriendList();
    });

    document.body.className = 'social-page';
    document.getElementById('game-link')?.addEventListener('click', () => navigateTo('/game'));
    document.getElementById('profile-link')?.addEventListener('click', () => navigateTo('/profile'));
    document.getElementById('home-link')?.addEventListener('click', () => navigateTo('/home'));
    document.getElementById('social-link')?.addEventListener('click', () => navigateTo('/social'));
    document.getElementById('logout-link')?.addEventListener('click', () => logout());
}