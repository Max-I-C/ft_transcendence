import { showLoginView, show2FAVerificationView, show2FASetupView } from './views/login.js';
import { showRegisterView } from './views/register.js';
import { showSuccessView } from './views/success.js';
import { showHomeView } from './views/home.js';
import { showProfileView } from './views/profile.js';
import { showGameView } from './views/game.js';
import { showSocialView } from './views/social.js';
import { RequireToken} from './views/auth.js';
import { handleOAuthCallback } from './views/auth.js';

export function navigateTo(path: string, state: any = null) {
    navigationHistory.push(path);
    history.pushState(state, '', path);
    router(path);
}

const protectedRoutes = ['/home', '/profile', '/game', '/social'];
const specialRoutes = ['/verify-2fa', '/oauth-callback', '/2fa-setup']; 

async function router(path: string) {
    if(protectedRoutes.includes(path)){
        const isToken = await RequireToken();
        if(!isToken) 
            return;
    }

    //Callback de Google
    if (path === '/oauth-callback') {
        handleOAuthCallback();
        return;
    }
    // Manejo de 2FA
    if (path === '/verify-2fa') {
        const userId = history.state?.userId; // Lee el estado guardado al navegar
        if (userId) {
            show2FAVerificationView(userId);
            return;
        } else {
            // Si el estado es inválido (navegación directa), redirigir al login
            navigateTo('/login');
            return;
        }
    }
    // 2FA setup route
    if (path === '/2fa-setup') {
        show2FASetupView();
        return;
    }
    
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
        case '/social':
            showSocialView();
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
