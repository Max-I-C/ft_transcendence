import { showLoginView } from './views/login.js';
import { showRegisterView } from './views/register.js';
import { showSuccessView } from './views/success.js';
import { showHomeView } from './views/home.js';
import { showProfileView } from './views/profile.js';
import { showGameView } from './views/game.js';

export function navigateTo(path: string) {
	navigationHistory.push(path);
	history.pushState(null, '', path);
	router(path);
}

function router(path: string) {
	switch (path) {
		case '/':
		case '/login':
			showLoginView();
			break;
		case '/register':
			showRegisterView();
			break;
		case '/success':
			showSuccessView();
			break;
		case '/home':
			showHomeView();
			break;
		case '/profile':
			showProfileView();
			break;
		case '/game':
			showGameView();
			break;
		default:
			document.getElementById('app')!.innerHTML = '<h1>404 Not Found</h1>';
	}
}

const navigationHistory: string[] = [];

window.addEventListener('popstate', () => {
	router(location.pathname);
});

document.addEventListener('DOMContentLoaded', () => {
	router(location.pathname);
});
