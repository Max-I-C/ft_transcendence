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
			<button class="gsi-material-button">
				<div class="gsi-material-button-state"></div>
					<div class="gsi-material-button-content-wrapper">
						<div class="gsi-material-button-icon">
							<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" xmlns:xlink="http://www.w3.org/1999/xlink" style="display: block;">
								<path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
								<path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
								<path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
								<path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
								<path fill="none" d="M0 0h48v48H0z"></path>
							</svg>
						</div>
						<span class="gsi-material-button-contents">Continue with Google</span>
						<span style="display: none;">Continue with Google</span>
					</div>
			</button>
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
		} catch (error) {
			console.error('Error during registration', error);
			alert('Network or server error');
		}
	}
}
