import { navigateTo } from '../main.js';

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
			</div>
		</div>
	`;

    document.body.className = 'auth-page';
	
    document.getElementById('register-btn')!.addEventListener('click', () => {
		navigateTo('/register');
	});

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

			if (response.ok) {
				const data = await response.json();
				localStorage.setItem('token', data.token);
				alert('Connection accepted !');
				navigateTo('/home');
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
