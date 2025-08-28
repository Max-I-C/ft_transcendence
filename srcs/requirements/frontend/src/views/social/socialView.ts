/*
// -- socialView.ts -- //
#######################################################################################
# The socialView.ts file is responsible of the                   #
#######################################################################################
*/

import { navigateTo } from '../../main.js';
import { logout } from '../auth.js';
import { setupSocket } from './socialSocket.js';
import { loadFriendList, setupAddFriendForm } from './socialFriends.js';
import { loadNotification } from './socialRequests.js';
import { setupContextMenu } from './socialContextMenu.js';
import { renderSocialUI } from './socialUI.js';

export function showSocialView() {
    const app = document.getElementById('app')!;
    renderSocialUI(app);

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