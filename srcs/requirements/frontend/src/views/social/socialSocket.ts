/*
// -- socialSocket.ts -- //
#######################################################################################
# The socialSocket.ts file is the one that manage all the WebSocket exchange.         #
#######################################################################################
*/

import { loadNotification } from './socialRequests.js';
import { loadFriendList } from './socialFriends.js';
import { info_message } from './socialChat.js';
import { initializeWebSocket } from '../../utils/webSocketUtils.js';
import { initPrivateGame, updateLobbyPlayers, lobbyStore, gameStore} from './socialContextMenu.js'

export function setupSocket(onMessage: (socket: WebSocket) => void) {
    const socket = initializeWebSocket();
    onMessage(socket);
    socket.addEventListener('message', async (event) => {
        try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'new_friend_request') {
                loadNotification(socket);
            }
            if (msg.type === 'new_friend' || msg.type === 'new_blockage') {
                loadFriendList();
            }
            if (msg.type === 'new_blockage') {
                const chatMessages = document.getElementById('chat-messages') as HTMLUListElement | null;
                if (chatMessages && chatMessages.dataset.friendId === String(msg.from_id)) {
                    info_message(`You are no longer in the friends list of @${msg.from}`);
                }
            }
            if (msg.type === 'new_message') {
                const chatMessages = document.getElementById('chat-messages') as HTMLUListElement | null;
                if (chatMessages && chatMessages.dataset.friendId === String(msg.message.sender_id)) {
                    const li = document.createElement('li');
                    li.classList.add('message', 'received');
                    li.textContent = `@${msg.message.sender_username}: ${msg.message.content}`;
                    chatMessages.appendChild(li);
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                }
            }
            if (msg.type === 'game_start') {
                document.getElementById('lobby-status')!.innerHTML =
                    `<span style="color:blue;">Game is starting...</span>`;
                initPrivateGame(msg.state);
                console.log('Game starting with state:', msg.state);
            }
            if (msg.type === 'invited_to_game') {
                const { from, lobbyId } = msg;
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

                    lobbyStore.currentLobbyId = lobbyId;
                    (document.querySelector('.social-container') as HTMLElement)!.style.display = 'none';
                    document.getElementById('private-game')!.style.display = 'block';

                    updateLobbyPlayers(lobbyData.players); // important pour afficher qui est dans le lobby
                }
            }
            if(msg.type == 'player_joined_private') {
                document.getElementById('player2')!.textContent = msg.player2;
                document.getElementById('lobby-status')!.innerHTML =
                    `<span style="color:green;">Player 2 has joined! Ready to start.</span>`;
            }
            if (msg.type === 'game_start') {
                document.getElementById('lobby-status')!.innerHTML =
                    `<span style="color:blue;">Game is starting...</span>`;
                initPrivateGame(msg.state);
                console.log('Game starting with state:', msg.state);
            }
            if (msg.type === 'game_update' && msg.lobbyId === lobbyStore.currentLobbyId) {
                // Mettre à jour l'état du jeu
                const canvas = document.getElementById('pong-canvas-private') as HTMLCanvasElement;
                const ctx = canvas.getContext('2d')!;
                const state = msg.state;
                
                // CORRECTION: Mettre à jour privateGameState avec les nouvelles données
                gameStore.privateGameState = state;
                
                // CORRECTION: Utiliser state au lieu de privateGameState pour le score
                document.getElementById('score-pvp')!.textContent = `Score: ${state.score1} - ${state.score2}`;
                
                // Mettre à jour l'affichage
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = '#222';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = 'white';
                ctx.fillRect(state.paddle1.x, state.paddle1.y, state.paddle1.width, state.paddle1.height);
                ctx.fillRect(state.paddle2.x, state.paddle2.y, state.paddle2.width, state.paddle2.height);
                ctx.beginPath();
                ctx.arc(state.ball.x, state.ball.y, state.ball.radius, 0, Math.PI * 2);
                ctx.fill();
                
                if (state.gameOver) {
                    document.getElementById('game-over-pvp')!.textContent = 
                        `Game Over! Final score: ${state.score1} - ${state.score2}`;
                }
            }
        } 
        catch (err) {
            console.error('Failed to parse JSON:', err);
        }
    });
}