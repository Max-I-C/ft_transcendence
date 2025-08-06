import { navigateTo } from '../main.js';

export function showSuccessView() {
	const app = document.getElementById('app')!;
	app.innerHTML = `
		<div class="main-container">
			<div class="success-text">Registration complete</div> 
			<button class="btn" type="button" id="back-to-login">Back to login</button>
		</div>
	`;

    document.body.className = 'auth-page';
	document.getElementById('back-to-login')!.addEventListener('click', () => {
		navigateTo('/login');
	});
}
