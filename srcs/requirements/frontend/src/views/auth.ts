import { navigateTo } from '../main.js';
import { show2FAVerificationView } from './login.js'; 
import { initializeWebSocket } from '../utils/webSocketUtils.js';

export function logout()
{
    localStorage.removeItem('token');
    alert('Successfully logout !');
    navigateTo('/login');
}

export async function RequireToken(): Promise<boolean> 
{
    const token = localStorage.getItem('token');
    if(!token)
    {
        console.error('No session detected');
        navigateTo('/login');
        return(false);
    }
    const response = await fetch('/api/profile', {
        headers:{
            'Authorization': `Bearer ${token}`
        }
    });
    if(!response.ok)
    {
        console.error('Invalid session');
        navigateTo('/login');
        return(false);  
    }
    return(true);
}

export function handleOAuthCallback() {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const userId = params.get('userId');

    history.replaceState(null, '', '/login'); 

    if (token) {
        localStorage.setItem('token', token);
        initializeWebSocket();
        alert('Google connection accepted!');
        navigateTo('/home');
    } else if (userId) {
        const parsedUserId = parseInt(userId);
        if (!isNaN(parsedUserId)) {
            navigateTo('/verify-2fa', { userId: parsedUserId }); 
        } else {
             alert('Error: Invalid user ID received for 2FA.');
             navigateTo('/login');
        }
    } else { //Puede ser por error de google o falta de datos
        alert('Google login failed or missing token/user ID.');
        navigateTo('/login');
    }
}