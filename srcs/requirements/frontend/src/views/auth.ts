import { navigateTo } from '../main.js';

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
	if(!response)
	{
		console.error('Invalid session');
		navigateTo('/login');
		return(false);	
	}
	return(true);
}