import { navigateTo } from '../main.js';
import { initializeWebSocket } from '../utils/webSocketUtils.js';

// --- NUEVA FUNCIÓN: Muestra la vista de verificación 2FA ---
export function show2FAVerificationView(userId: number) {
    const app = document.getElementById('app')!;
    app.innerHTML = `
        <div class="main-container">
            <div class="welcome-text">2FA Required</div>
            <div class="form-container">
                <p>Enter the 6-digit code from your authenticator app.</p>
                <form id="2fa-form">
                    <input type="text" id="2fa-code" placeholder="6-digit code" maxlength="6" required />
                    <div id="2faError" class="error-message"></div>
                    <button class="btn" type="submit">Verify Code</button>
                </form>
            </div>
        </div>
    `;

    document.body.className = 'auth-page';

    document.getElementById('2fa-form')!.addEventListener('submit', async (e) => {
        e.preventDefault();

        const token = (document.getElementById('2fa-code') as HTMLInputElement).value;

        try {
            const response = await fetch('/api/verify-2fa', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, token }),
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('token', data.token);
                initializeWebSocket();
                alert('2FA Verification accepted!');
                navigateTo('/home');
            } else {
                document.getElementById('2faError')!.innerText = 'Invalid 2FA code.';
            }
        } catch (err) {
            alert('Network error during 2FA verification');
            console.error(err);
        }
    });
}

export function showLoginView() {
    const app = document.getElementById('app')!;
    app.innerHTML = `
        <div class="main-container">
            <div class="welcome-text">Welcome</div>
            <div class="form-container">
                <form id="login-form">
                    <input type="text" id="username" placeholder="login or email" required />
                    <div id="userError" class="error-message"></div>
                    <input type="password" id="password" placeholder="password" required />
                    <div id="passError" class="error-message"></div>
                    <button class="btn" type="submit">Connect</button>
                    <button class="btn" type="button" id="register-btn">Register</button>
                </form>
                <button class="btn google-btn" type="button" id="google-login-btn">
                    Connect with Google
                </button>
            </div>
        </div>
    `;

    document.body.className = 'auth-page';
    
    document.getElementById('register-btn')!.addEventListener('click', () => {
        navigateTo('/register');
    });

    //Google Login
    document.getElementById('google-login-btn')!.addEventListener('click', () => {
        // Redirige al backend para iniciar el flujo de Google OAuth
        window.location.href = 'http://localhost:3000/api/auth/google';
    });

	//Local Login
    document.getElementById('login-form')!.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = (document.getElementById('username') as HTMLInputElement).value;
        const password = (document.getElementById('password') as HTMLInputElement).value;

        try {
			
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                if (data.message === '2FA_REQUIRED') {
                    show2FAVerificationView(data.userId); 
                } else if (data.token) {
                    localStorage.setItem('token', data.token); //Si todo va bien guardo el token
                    initializeWebSocket();
                    alert('Connection accepted !');
                    navigateTo('/home');
                } else {
                    alert('Unknown success response');
                }
            } 
            else {
                const status = response.status;
                if (status === 401)
                    document.getElementById('userError')!.innerText = 'Invalid user';
                else if (status === 402)
                    document.getElementById('passError')!.innerText = 'Invalid password';
                else alert('Unknown error');
            }
        } 
        catch (err) {
            alert('Network error');
            console.error(err);
        }
    });
}