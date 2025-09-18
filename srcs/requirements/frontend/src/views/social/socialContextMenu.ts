/*
// -- socialContextMenu.ts -- //
#######################################################################################
# The socialContextMenu.ts file is responsible of the page when the user              #
# do a right click on one of his friend in his friend list.                           #
# This page also manage the logic for the remove and block button.                    #
#######################################################################################
*/

import { info_message } from './socialChat.js';
import { loadFriendList } from './socialFriends.js';
import { showProfilePopup } from './socialProfile.js';
import { initializeWebSocket } from '../../utils/webSocketUtils.js';

let currentFriendId: string | null = null;
let lastContextClickPos: { x: number; y: number } | null = null;
let currentLobbyId: string | null = null;

function updateLobbyPlayers(players: { id: string, username: string }[] = []) {
    const player1 = players[0]?.username || 'Waiting...';
    const player2 = players[1]?.username || 'Waiting...';

    document.getElementById('player1')!.textContent = player1;
    document.getElementById('player2')!.textContent = player2;
}

function listenToGameWebSocket(lobbyId: string) {
    const socket = initializeWebSocket();
    const canvas = document.getElementById('pong-canvas-pvp') as HTMLCanvasElement;
    
}

// -- Definition of the display for the right click menu -- //
export function openContextMenuFor(friendId: string, x: number, y: number) {
    const contextMenu = document.getElementById('context-menu') as HTMLDivElement | null;
    if (!contextMenu) return;
    currentFriendId = friendId;
    lastContextClickPos = { x, y };
    contextMenu.dataset.currentId = friendId;

    const offset = 5;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const menuW = contextMenu.offsetWidth || 200;
    const menuH = contextMenu.offsetHeight || 140;
    let left = x + offset;
    let top = y + offset;
    if (left + menuW > vw) left = Math.max(8, vw - menuW - 8);
    if (top + menuH > vh) top = Math.max(8, vh - menuH - 8);
    contextMenu.style.left = `${left}px`;
    contextMenu.style.top = `${top}px`;
    contextMenu.classList.remove('hidden');

    document.querySelectorAll<HTMLLIElement>('#friends-list li').forEach(el =>
        el.classList.toggle('selected', el.dataset.id === friendId)
    );
}

document.addEventListener('friend-contextmenu', (e: Event) => {
    const detail = (e as CustomEvent).detail;
    if (!detail) return;
    openContextMenuFor(detail.id, detail.x, detail.y);
});

export function setupContextMenu(socket: WebSocket) {
    const contextMenu = document.getElementById('context-menu') as HTMLDivElement;
    document.addEventListener('click', () => contextMenu.classList.add('hidden'));
    // -- Part for the button "see profile" -- //
    document.getElementById('profile-action')?.addEventListener('click', async () => {
        if (!currentFriendId) return;
        const tokenLocal = localStorage.getItem('token') ?? undefined;
        if (!tokenLocal) return;
        try {
            const res = await fetch(`/api/users/profile/${currentFriendId}`, {
                headers: { 'Authorization': `Bearer ${tokenLocal}` }
            });
            if (!res.ok) throw new Error('Unable to fetch profile');
            const profile = await res.json();
            showProfilePopup(profile, lastContextClickPos ?? undefined);
        } 
        catch (err) {
            console.error(err);
            alert('Error during the recuperation of the data profile');
        }
        contextMenu.classList.add('hidden');
    });
    // -- Part for the button "block" -- //
    document.getElementById('block-action')?.addEventListener('click', async () => {
        if (!currentFriendId) return;
        const tokenLocal = localStorage.getItem('token') ?? undefined;
        if (!tokenLocal) return;
        const res = await fetch(`/api/social/block`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokenLocal}`
            },
            body: JSON.stringify({ blockedId: currentFriendId })
        });
        if (res.ok) {
            await loadFriendList();
            alert('User blocked');
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({
                    type: 'friend_remove_blocked',
                    to: currentFriendId,
                    token: tokenLocal
                }));
            }
            info_message('User correctly blocked !');
        } else {
            alert('Error blocking friend');
        }
    });
    // -- Part for the button "remove" -- //
    document.getElementById('remove-action')?.addEventListener('click', async () => {
        if (!currentFriendId) return;
        const tokenLocal = localStorage.getItem('token') ?? undefined;
        if (!tokenLocal) return;
        const res = await fetch(`/api/social/remove?friendId=${currentFriendId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${tokenLocal}` }
        });
        if (res.ok) {
            await loadFriendList();
            alert('Friend deleted');
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({
                    type: 'friend_remove_blocked',
                    to: currentFriendId,
                    token: tokenLocal
                }));
            }
            info_message('User correctly deleted !');
        } else {
            alert('Error blocking friend');
        }
    });
    // -- Part for the button "Invite" -- //
    document.getElementById('invite-action')?.addEventListener('click', async () => {
        if (!currentFriendId) return;
        const token = localStorage.getItem('token');
        if (!token) return;

        (document.querySelector('.social-container') as HTMLElement)!.style.display = 'none';
        document.getElementById('private-game')!.style.display = 'block';

        const res = await fetch('/api/game/private/lobby', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ invitedId: currentFriendId }) // très important
        });

        const data = await res.json();
        currentLobbyId = data.lobbyId;

        if (data.joined) {
            document.getElementById('lobby-status')!.innerHTML = `<span style="color:green;">Private lobby ready! Waiting for game...</span>`;
        } 
        else {
            document.getElementById('lobby-status')!.innerHTML = `<span style="color:orange;">Private lobby created. Waiting for your friend...</span>`;
        }
        updateLobbyPlayers(data.players);
    });

}
