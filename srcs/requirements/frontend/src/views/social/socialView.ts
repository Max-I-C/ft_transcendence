/*
// -- socialView.ts -- //
#######################################################################################
# The socialView.ts file is like the main of the social page, basically               #
# this page is executing all the other functions/Api_Call/WebSocket_Request.          #
#######################################################################################
*/

// -- Defintion of all the path to other file and functions -- //
import { navigateTo } from '../../main.js';
import { logout } from '../auth.js';
import { setupSocket } from './socialSocket.js';
import { loadFriendList, setupAddFriendForm } from './socialFriends.js';
import { loadNotification } from './socialRequests.js';
import { setupContextMenu } from './socialContextMenu.js';
import { renderSocialUI } from './socialUI.js';

export function showSocialView() {
    const app = document.getElementById('app')!;
    // -- Loading the HTML -- //
    renderSocialUI(app);

    // -- WebSocket part -- //
    setupSocket((socket) => {
        setupAddFriendForm(socket);
        setupContextMenu(socket);
        loadNotification(socket);
        loadFriendList();
    });

    // -- NavBar -- //
    document.body.className = 'social-page';
    document.getElementById('game-link')?.addEventListener('click', () => navigateTo('/game'));
    document.getElementById('profile-link')?.addEventListener('click', () => navigateTo('/profile'));
    document.getElementById('home-link')?.addEventListener('click', () => navigateTo('/home'));
    document.getElementById('social-link')?.addEventListener('click', () => navigateTo('/social'));
    document.getElementById('logout-link')?.addEventListener('click', () => logout());
}