/*
// -- socialSocket.ts -- //
#######################################################################################
# The socialSocket.ts file is the one that manage all the WebSocket exchange          #
#######################################################################################
*/

import { loadNotification } from './socialRequests.js';
import { loadFriendList } from './socialFriends.js';
import { info_message } from './socialChat.js';

export function setupSocket(onMessage: (socket: WebSocket) => void) {
    const socket = new WebSocket('ws://localhost:3000/ws');
    const tokenLocal = localStorage.getItem('token') ?? undefined;
    if (tokenLocal) {
        socket.addEventListener('open', () => {
            socket.send(JSON.stringify({ type: 'auth', token: tokenLocal }));
        });
    }
    socket.addEventListener('message', (event) => {
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
        } 
        catch (err) {
            console.error('Failed to parse JSON:', err);
        }
    });
    onMessage(socket);
}