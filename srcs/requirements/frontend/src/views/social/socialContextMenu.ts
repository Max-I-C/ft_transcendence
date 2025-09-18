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
let privateGameState: any = null;
let privateGameCtx: CanvasRenderingContext2D | null = null;

function updateLobbyPlayers(players: { id: string, username: string }[] = []) {
    const player1 = players[0]?.username || 'Waiting...';
    const player2 = players[1]?.username || 'Waiting...';

    document.getElementById('player1')!.textContent = player1;
    document.getElementById('player2')!.textContent = player2;
}

function initPrivateGame(gameState: any) {
    const canvas = document.getElementById('pong-canvas-private') as HTMLCanvasElement;
    privateGameCtx = canvas.getContext('2d')!;
    privateGameState = gameState;
    
    // Écouter les touches pour déplacer le paddle
    document.addEventListener('keydown', async (e) => {
        let direction = null;
        if (e.key === 'w' || e.key === 'ArrowUp') direction = 'up';
        if (e.key === 's' || e.key === 'ArrowDown') direction = 'down';
        
        if (!direction) return;
        
        try {
            const token = localStorage.getItem('token');
            await fetch('/api/game/pvp/move-paddle', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ direction })
            });
        } catch (err) {
            console.error('Error moving paddle:', err);
        }
    });
}

export function listenToInviteToGame(socket: WebSocket) {
    socket.addEventListener('message', async (event) => {
        try {
            const data = JSON.parse(event.data);
            if (data.type === 'invited_to_game') {
                const { from, lobbyId } = data;
                if (confirm(`${from} has invited you to a private game. Do you accept?`)) {
                    const token = localStorage.getItem('token');
                    await fetch(`/api/game/private/join/${lobbyId}`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    // Une fois rejoint, récupérer les infos du lobby
                    const res = await fetch(`/api/game/private/lobby/${lobbyId}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const lobbyData = await res.json();

                    currentLobbyId = lobbyId;
                    (document.querySelector('.social-container') as HTMLElement)!.style.display = 'none';
                    document.getElementById('private-game')!.style.display = 'block';

                    updateLobbyPlayers(lobbyData.players); // important pour afficher qui est dans le lobby
                }
            }
            if(data.type == 'player_joined_private') {
                document.getElementById('player2')!.textContent = data.player2;
                document.getElementById('lobby-status')!.innerHTML =
                    `<span style="color:green;">Player 2 has joined! Ready to start.</span>`;
            }
            if (data.type === 'game_start') {
                document.getElementById('lobby-status')!.innerHTML =
                    `<span style="color:blue;">Game is starting...</span>`;
                
                initPrivateGame(data.state);
                console.log('Game starting with state:', data.state);
            }
            if (data.type === 'game_update' && data.lobbyId === currentLobbyId) {
                // Mettre à jour l'état du jeu
                const canvas = document.getElementById('pong-canvas-private') as HTMLCanvasElement;
                const ctx = canvas.getContext('2d')!;
                const state = data.state;
                // Mettre à jour l'affichage
                document.getElementById('score-pvp')!.textContent = `Score: ${privateGameState.score1} - ${privateGameState.score2}`;
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = '#222';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = 'white';
                ctx.fillRect(state.paddle1.x, state.paddle1.y, state.paddle1.width, state.paddle1.height);
                ctx.fillRect(state.paddle2.x, state.paddle2.y, state.paddle2.width, state.paddle2.height);
                ctx.beginPath();
                ctx.arc(state.ball.x, state.ball.y, state.ball.radius, 0, Math.PI * 2);
                ctx.fill();
                
                if (data.state.gameOver) {
                    document.getElementById('game-over-pvp')!.textContent = 
                        `Game Over! Final score: ${data.state.score1} - ${data.state.score2}`;
                }
            }
        } 
        catch (err) {
            console.error('Error handling invited_to_game message:', err);
        }
    });
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
