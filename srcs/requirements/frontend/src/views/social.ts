import { navigateTo } from '../main.js';
import { logout } from './auth.js';

let socket : WebSocket;

interface Notification {
	id: number;
	user_id: number;
	type: string;
	read: number;
	created: string;
	sender_username?: string;
}

function setupFriendClickHandlers() {
	const friendsList = document.getElementById('friends-list');
	const chatSection = document.querySelector('.chat-bubble') as HTMLElement;

	if (!friendsList || !chatSection) return;

	friendsList.querySelectorAll('li').forEach(li => {
		li.addEventListener('click', async () => {
			const username = li.textContent?.replace('@', '') || "";
			const friendId = li.dataset.id;
			const token = localStorage.getItem('token');

			if(!friendId || !token) return;
			const res = await fetch(`/api/messages/${friendId}`, {
    			headers: { 'Authorization': `Bearer ${token}` }
  			});
			console.log('HTTP status:', res.status);
			const messages = await res.json();
			console.log('messages:', messages);

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
			for(const msg of messages) {
				const liMsg = document.createElement('li');
				liMsg.classList.add('message', msg.sender_username === username ? 'received' : 'sent');
				liMsg.textContent = `${msg.sender_username}: ${msg.content}`;
				chatMessages.appendChild(liMsg);
			}

			chatMessages.scrollTop = chatMessages.scrollHeight;

			// gestion du form (mock pour l’instant)
			const chatForm = document.getElementById('chat-form') as HTMLFormElement;
			const chatInput = document.getElementById('chat-input') as HTMLInputElement;

			chatForm.addEventListener('submit', async (e) => {
				e.preventDefault();
				const text = chatInput.value.trim();
				if (!text) return;

				// API/WEBSOCKET //
				const res = await fetch('/api/messages', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${token}`
					},
					body: JSON.stringify({ toUserId: friendId, content: text})
				});
				// API/WEBSOCKET //
				
				if(res.ok){
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


async function loadFriendList() {
	const token = localStorage.getItem('token');
	if(!token)
		return ;
	try {
		const res = await fetch('/api/social/friends', {
			headers: { 'Authorization': `Bearer ${token}`}
		});
		if (!res.ok)
			throw new Error('Error in the loading list');
		const friends: { id: number; username: string }[] = await res.json();
		const friendsList = document.getElementById('friends-list');
		if(!friendsList)
			return;

		friendsList.innerHTML = '';
		if(friends.length === 0){
			friendsList.innerHTML = '<li>No friends</li>';
		}
		else{
			for(const friend of friends) {
				const li = document.createElement('li');
				li.tabIndex = 0;
				li.textContent = '@' + friend.username;
				li.dataset.id = String(friend.id);
				friendsList.appendChild(li);
			}
		}
		setupFriendClickHandlers();
	}	
	catch(err){
		console.error(err);
	}
}

async function loadNotification() {
	try {
		const token = localStorage.getItem('token');
		const res = await fetch('/api/notifications', {
			headers: { 'Authorization': `Bearer ${token}`}
		});
		if(!res.ok)
			throw new Error('Erreur lors du chargement des notifications');
		const notifications: Notification[] = await res.json();

		const pendingList = document.getElementById('pending-list');
		if(!pendingList)
			return;
		
		const pendingRequests = notifications.filter(n => n.type === 'pending');
	
		pendingList.innerHTML = '';
		if(pendingRequests.length === 0){
			pendingList.innerHTML = '<li>Aucune demande</li>';		
		}
		else{
			for(const notif of pendingRequests) {
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

				if(!notifId || !username)
					return;
				try{
					const res = await fetch('/api/social/respond', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							'Authorization': `Bearer ${token}`
						},
						body: JSON.stringify({ notificationId: notifId, action })
					});
					if(res.ok){
						if (socket && socket.readyState === WebSocket.OPEN) {
							socket.send(JSON.stringify({
								type: 'friend_request_accepted',
								to: username, // ✅ l'utilisateur à qui on doit notifier la nouvelle amitié
								token: token
							}));
						}
						await loadNotification();
						await loadFriendList();
					}
					else{
						alert('Error with accept request to API');
					}
				}
				catch (err){
					console.error(err);
					alert('Network Error');
				}
			});
		});
	}
	catch(err){
		console.error(err);
	}
}


export function showSocialView() {
	const app = document.getElementById('app')!;
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
					<ul class="friends-list" role="list" id="pending-list">
					</ul>
				</div>
				
				<div id="context-menu" class="context-menu hidden">
					<ul>
						<li id="profile-action">👤 See profile</li>
						<li id="invite-action">🎮 Invite to play</li>
						<li id="block-action">🚫 Block</li>
						<li id="remove-action">❌ Delete</li>
					</ul>
				</div>

				<h2>Mes amis</h2>
      			<ul class="friends-list" role="list" id="friends-list">
      			</ul>
				<form class="add-friend">
				 	<input id="friendUsername" type="text" placeholder="Ajouter un ami par username" aria-label="Nom d'utilisateur à ajouter" required />
        			<button id="addBtn" type="submit" disabled>Ajouter</button>
      			</form>
    		</section>
			<section class="chat-bubble glass-conversation" aria-label="Zone de conversation">
      			<h2>Conversation</h2>
      			<div class="chat-empty">
					Sélectionne un ami pour afficher la conversation ici.
      			</div>
    		</section>
  		</div>
	`;

	socket = new WebSocket('ws://localhost:3000/ws');

	// Authentifie le socket
	const token = localStorage.getItem('token');
	if (token) {
		socket.addEventListener('open', () => {
			socket.send(JSON.stringify({ type: 'auth', token }));
		});
	}

	socket.addEventListener('message', (event) => {
		console.log('Raw message from server:', event.data); // <-- voir exactement ce qui arrive
		try {
			const msg = JSON.parse(event.data);
			console.log('Parsed message:', msg);
			if (msg.type === 'new_friend_request') {
				loadNotification();
			}
			if (msg.type === 'new_friend') {
				loadFriendList();
			}
			if (msg.type === 'new_message') {
            	const chatMessages = document.getElementById('chat-messages') as HTMLUListElement;
            
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



    document.body.className = 'social-page';
	document.getElementById('game-link')!.addEventListener('click', () => navigateTo('/game'));
	document.getElementById('profile-link')!.addEventListener('click', () => navigateTo('/profile'));
	document.getElementById('home-link')!.addEventListener('click', () => navigateTo('/home'));
    document.getElementById('social-link')!.addEventListener('click', () => navigateTo('/social'));
	document.getElementById('logout-link')!.addEventListener('click', () => logout());

	const friendInput = document.getElementById('friendUsername') as HTMLInputElement;
	const addBtn = document.getElementById('addBtn') as HTMLButtonElement;
	
	friendInput.addEventListener('input', () => {
		addBtn.disabled = friendInput.value.trim() === '';
	});

	loadNotification();
	loadFriendList();

	document.querySelector('.add-friend')!.addEventListener('submit', async (e) => {
		e.preventDefault();
		const token = localStorage.getItem('token');
		const usernameFriend = (document.getElementById('friendUsername') as HTMLInputElement).value.trim();
		
		if(!usernameFriend) return;

		if (socket && socket.readyState === WebSocket.OPEN) {
			socket.send(JSON.stringify({
				type: 'friend_request',
				to: usernameFriend,
				token: token // pour que le backend sache qui envoie
			}));
		}

		try{
			const response = await fetch('/api/social/request', { 
				method: 'POST',
				headers:{
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify({ usernameFriend: usernameFriend })
			});
			if(response.ok){
				alert('Invitation correctement envoyer !');
				(document.getElementById('friendUsername') as HTMLInputElement).value = "";
				addBtn.disabled = true;
			}
			else{
				const errorData = await response.json();
				alert(errorData.message || 'Erreur lors de l invitation');
			}
		}
		catch(err){
			console.error(err);
			alert('Network Error');
		}
	});	

}
