/*
// -- socialFriends.ts -- //
#######################################################################################
# The socialFriends.ts file is the one that load the friend list and                  # 
# manage when the user is sending a request to a other user.                          #
#######################################################################################
*/

import { apiGet, apiPost } from './socialApi.js';
import { setupFriendClickHandlers } from './socialChat.js';

export async function loadFriendList() {
    const token = localStorage.getItem('token') ?? undefined;
    if (!token) return;
    try {
        const friends: { id: number; username: string }[] = await apiGet('/api/social/friends', token);
        const friendsList = document.getElementById('friends-list');
        if (!friendsList) return;

        friendsList.innerHTML = '';
        if (friends.length === 0) {
            friendsList.innerHTML = '<li>No friends</li>';
        } else {
            for (const friend of friends) {
                const li = document.createElement('li');
                li.tabIndex = 0;
                li.textContent = '@' + friend.username;
                li.dataset.id = String(friend.id);

                li.addEventListener('contextmenu', (e: MouseEvent) => {
                    e.preventDefault();
                    const detail = { id: String(friend.id), x: e.clientX, y: e.clientY };
                    document.dispatchEvent(new CustomEvent('friend-contextmenu', { detail }));
                });

                friendsList.appendChild(li);
            }
        }
        setupFriendClickHandlers();
    } 
    catch (err) {
        console.error(err);
    }
}

// -- Logic for the button add friend -- //
export function setupAddFriendForm(socket: WebSocket) {
    const friendInput = document.getElementById('friendUsername') as HTMLInputElement;
    const addBtn = document.getElementById('addBtn') as HTMLButtonElement;
    friendInput.addEventListener('input', () => {
        addBtn.disabled = friendInput.value.trim() === '';
    });
    document.querySelector('.add-friend')!.addEventListener('submit', async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token') ?? undefined;
        if (!token) return;
        const usernameFriend = friendInput.value.trim();
        if (!usernameFriend) return;
        try {
            const resId = await fetch(`/api/users/id?username=${encodeURIComponent(usernameFriend)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!resId.ok) throw new Error('Utilisateur introuvable');
            const { id: friendId } = await resId.json();
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ type: 'friend_request', to: friendId, token }));
            }
            const response = await apiPost('/api/social/request', { usernameFriend }, token);
            if (response.ok) {
                alert('Invitation correctement envoyée !');
                friendInput.value = "";
                addBtn.disabled = true;
            } else {
                const errorData = await response.json();
                alert(errorData.message || 'Erreur lors de l\'invitation');
            }
        } 
        catch (err) {
            console.error(err);
            alert('Network Error');
        }
    });
}