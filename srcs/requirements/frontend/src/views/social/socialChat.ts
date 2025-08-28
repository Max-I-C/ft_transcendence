/*
// -- socialChat.ts -- //
#######################################################################################
# The socialChat.ts file is responsible of the chat. It's basically here that         #
# manage to store new message, load previous ones, send message to the user           #
# when he has to be notify of a change (like being removed).                          #
#######################################################################################
*/

export function setupFriendClickHandlers() {
    const friendsList = document.getElementById('friends-list');
    const chatSection = document.querySelector('.chat-bubble') as HTMLElement;
    if (!friendsList || !chatSection) return;
    friendsList.querySelectorAll('li').forEach(li => {
        li.addEventListener('click', async () => {
            const username = li.textContent?.replace('@', '') || "";
            const friendId = li.dataset.id;
            const token = localStorage.getItem('token') ?? undefined;
            if (!friendId || !token) return;
            // -- Request to check all the messages between two users -- //
            const res = await fetch(`/api/messages/${friendId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) {
                console.error('Failed to fetch messages', res.status);
                return;
            }
            const messages = await res.json();
            // -- HTML of the chat -- //
            chatSection.innerHTML = `
                <h2>Conversation avec ${username}</h2>
                <div class="chat-window">
                    <ul id="chat-messages" class="chat-messages" data-friend-id="${friendId}"></ul>
                </div>
                <form id="chat-form" class="chat-form">
                    <input type="text" id="chat-input" placeholder="Écris un message..." required />
                    <button type="submit">Envoyer</button>
                </form>
            `;
            const chatMessages = document.getElementById('chat-messages') as HTMLUListElement;
            // -- Loading all the messages in the chat -- //
            for (const msg of messages) {
                const liMsg = document.createElement('li');
                const isReceived = msg.sender_username === username;
                liMsg.classList.add('message', isReceived ? 'received' : 'sent');
                liMsg.textContent = isReceived ? `@${msg.sender_username}: ${msg.content}` : `Moi : ${msg.content}`;
                chatMessages.appendChild(liMsg);
            }
            chatMessages.scrollTop = chatMessages.scrollHeight;
            const chatForm = document.getElementById('chat-form') as HTMLFormElement;
            const chatInput = document.getElementById('chat-input') as HTMLInputElement;
            // -- Storing new message -- //
            chatForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const text = chatInput.value.trim();
                if (!text) return;
                const tokenLocal = localStorage.getItem('token') ?? undefined;
                if (!tokenLocal) return;
                const res = await fetch('/api/messages', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${tokenLocal}`
                    },
                    body: JSON.stringify({ toUserId: friendId, content: text })
                });
                if (res.ok) {
                    const msg = await res.json();
                    const li = document.createElement('li');
                    li.classList.add('message', 'sent');
                    li.textContent = `Moi : ${msg.content}`;
                    chatMessages.appendChild(li);
                    chatInput.value = '';
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                }
            });
        });
    });
}

// -- Sending message in the chat to notify the user of a change -- //
export function info_message(message: string) {
    const chatMessages = document.getElementById('chat-messages') as HTMLUListElement | null;
    if (chatMessages) {
        const li = document.createElement('li');
        li.classList.add('message', 'system');
        li.textContent = message;
        chatMessages.appendChild(li);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        const chatInput = document.getElementById('chat-input') as HTMLInputElement | null;
        const chatForm = document.getElementById('chat-form') as HTMLFormElement | null;
        if (chatInput) {
            chatInput.disabled = true;
            chatInput.placeholder = 'Envoi désactivé';
        }
        if (chatForm) {
            const sendBtn = chatForm.querySelector('button') as HTMLButtonElement | null;
            if (sendBtn) sendBtn.disabled = true;
        }
    }
}