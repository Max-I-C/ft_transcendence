import { navigateTo } from '../main.js';

export function showRegisterView() {
	const app = document.getElementById('app')!;
	app.innerHTML = `
		<div class="main-container">
			<div class="welcome-text">Creation page</div> 
			<div class="form-container">    
				<input type="text" id="UserName" placeholder="User name"> 
				<div id="usernameError" class="error-message"></div>
				<input type="text" id="Email" placeholder="Email"> 
				<div id="emailError" class="error-message"></div>
				<input type="password" id="Password" placeholder="password">
				<div id="passwordError" class="error-message"></div>
				<input type="password" id="PasswordBis" placeholder="repeat password"> 
			</div>
			<button class="btn" type="button" id="create-account">Create account</button>
		</div>
	`;
    document.body.className = 'auth-page';
	document.getElementById('create-account')!.addEventListener('click', validateForm);
}

function clearError() {
	(document.getElementById('usernameError') as HTMLElement).innerText = '';
	(document.getElementById('emailError') as HTMLElement).innerText = '';
	(document.getElementById('passwordError') as HTMLElement).innerText = '';
}

async function validateForm() {
	clearError();
	let valid = true;
	const username = (document.getElementById('UserName') as HTMLInputElement).value;
	const email = (document.getElementById('Email') as HTMLInputElement).value;
	const password = (document.getElementById('Password') as HTMLInputElement).value;
	const passwordBis = (document.getElementById('PasswordBis') as HTMLInputElement).value;
	const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;

	if (!emailRegex.test(email)) {
		document.getElementById('emailError')!.innerText = 'Invalid email';
		valid = false;
	}
	if (password !== passwordBis) {
		document.getElementById('passwordError')!.innerText = 'Passwords do not match';
		valid = false;
	}
	if (password.length < 8) {
		document.getElementById('passwordError')!.innerText = 'Password too short';
		valid = false;
	}
	if (valid) {
		clearError();
		try {
			const response = await fetch('/api/register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username, email, password })
			});
			if (response.ok) {
				alert('Account created!');
				navigateTo('/success');
			} else {
				const data = await response.json();
				alert(data.message || 'Registration failed.');
			}
		} 
		catch (error) {
			console.error('Error during registration', error);
			alert('Network or server error');
		}
	}
}
