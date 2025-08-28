// socialRequests.ts
import { apiGet } from './socialApi.js';
import { loadFriendList } from './socialFriends.js';

export async function loadNotification(socket: WebSocket) {
    try {
        const token = localStorage.getItem('token') ?? undefined;
        if (!token) return;

        const notifications: any[] = await apiGet('/api/notifications', token);
        const pendingList = document.getElementById('pending-list');
        if (!pendingList) return;
        const pendingRequests = notifications.filter(n => n.type === 'pending');
        pendingList.innerHTML = '';
        if (pendingRequests.length === 0) {
            pendingList.innerHTML = '<li>Aucune demande</li>';
        } else {
            for (const notif of pendingRequests) {
                const li = document.createElement('li');
                li.classList.add('pending-request-item');
                li.innerHTML = `
                    <span>${notif.sender_username}</span>
                    <div class="actions">
                        <button class="accept-btn" data-id="${notif.id}" data-username="${notif.sender_username}">Accept</button>
                        <button class="refuse-btn" data-id="${notif.id}" data-username="${notif.sender_username}">Refuse</button>
                    </div>
                `;
                pendingList.appendChild(li);
            }
        }
        document.querySelectorAll('.accept-btn, .refuse-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const button = e.currentTarget as HTMLButtonElement;
                const notifId = button.dataset.id;
                const username = button.dataset.username;
                const action = button.classList.contains('accept-btn') ? 'accept' : 'refuse';
                if (!notifId || !username) return;
                try {
                    const tokenLocal = localStorage.getItem('token') ?? undefined;
                    if (!tokenLocal) return;

                    const res = await fetch('/api/social/respond', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${tokenLocal}`
                        },
                        body: JSON.stringify({ notificationId: notifId, action })
                    });
                    if (res.ok) {
                        const resId = await fetch(`/api/users/id?username=${encodeURIComponent(username)}`, {
                            headers: { 'Authorization': `Bearer ${tokenLocal}` }
                        });
                        if (!resId.ok) throw new Error('Utilisateur introuvable');
                        const { id: friendId } = await resId.json();
                        if (socket && socket.readyState === WebSocket.OPEN) {
                            socket.send(JSON.stringify({
                                type: 'friend_request_accepted',
                                to: friendId,
                                token: tokenLocal
                            }));
                        }
                        await loadNotification(socket);
                        await loadFriendList();
                    } else {
                        alert('Error with accept request to API');
                    }
                } 
                catch (err) {
                    console.error(err);
                    alert('Network Error');
                }
            });
        });
    } 
    catch (err) {
        console.error(err);
    }
}