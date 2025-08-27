import { renderProfileUI } from './profileUI.js';
import { loadProfile, updateProfileApi } from './profileApi.js';
import { drawDonutChart } from './profileChart.js';
import { renderRanks } from './profileRank.js';

export async function showProfileView() {
    // render UI and nav
    renderProfileUI();

    const token = localStorage.getItem('token');
    const data = await loadProfile(token);
    const profile = data.profile;
    const matchLogs = data.match_logs ?? [];

    // populate fields
    (document.getElementById('username-text') as HTMLElement).innerText = profile.username ?? 'Unknow';
    (document.getElementById('email-text') as HTMLElement).innerText = profile.email ?? 'Unknow';
    (document.getElementById('game_play') as HTMLElement).innerText = String(profile.game_play ?? 'Unknow');
    (document.getElementById('game_win') as HTMLElement).innerText = String(profile.game_win ?? 'Unknow');
    (document.getElementById('game_loss') as HTMLElement).innerText = String(profile.game_loss ?? 'Unknow');
    (document.getElementById('score_total') as HTMLElement).innerText = String(profile.score_total ?? 'Unknow');
    (document.getElementById('level') as HTMLElement).innerText = String(profile.level ?? 'Unknow');

    (document.getElementById('games-played') as HTMLElement).innerText = String(profile.game_play ?? 'Unknow');
    (document.getElementById('games-won') as HTMLElement).innerText = String(profile.game_win ?? 'Unknow');
    (document.getElementById('games-lost') as HTMLElement).innerText = String(profile.game_loss ?? 'Unknow');
    (document.getElementById('score') as HTMLElement).innerText = String(profile.score_total ?? 'Unknow');

    // ranks
    renderRanks(profile);

    // match logs
    const logsList = document.getElementById('logs-list')!;
    logsList.innerHTML = '';
    if (matchLogs && matchLogs.length > 0) {
        matchLogs.forEach((log: any) => {
            const li = document.createElement('li');
            li.textContent = `Date: ${new Date(log.match_date).toLocaleString()} - Result: ${log.result} - Score: ${log.points_change}`;
            logsList.appendChild(li);
        });
    } else {
        logsList.innerHTML = '<li>No match logs found.</li>';
    }

    // chart
    if (typeof profile.game_win === 'number' && typeof profile.game_loss === 'number') {
        drawDonutChart(profile.game_win, profile.game_loss);
    }

    // edit button handler
    document.getElementById('edit-profile')!.addEventListener('click', () => {
        const usernameText = document.getElementById('username-text')!;
        const usernameInput = document.getElementById('username-input') as HTMLInputElement;
        const emailText = document.getElementById('email-text')!;
        const emailInput = document.getElementById('email-input') as HTMLInputElement;
        const twoafText = document.getElementById('twoaf-text')!;
        const twoafInput = document.getElementById('twoaf-input') as HTMLInputElement;
        const saveBtn = document.getElementById('save-profile')!;

        const passwordInput = document.getElementById('password-input') as HTMLInputElement;
        const passwordConfirmInput = document.getElementById('password-confirm-input') as HTMLInputElement;

        usernameInput.value = usernameText.textContent || '';
        emailInput.value = emailText.textContent || '';
        twoafInput.checked = twoafText.textContent === 'ON';

        usernameText.style.display = 'none';
        usernameInput.style.display = 'inline';
        emailText.style.display = 'none';
        emailInput.style.display = 'inline';
        twoafText.style.display = 'none';
        twoafInput.style.display = 'inline';
        saveBtn.style.display = 'inline';
        passwordInput.style.display = 'inline';
        passwordConfirmInput.style.display = 'inline';
    });

    // save handler
    document.getElementById('save-profile')!.addEventListener('click', async () => {
        const tokenLocal = localStorage.getItem('token');
        const password = (document.getElementById('password-input') as HTMLInputElement).value;
        const confirmPassword = (document.getElementById('password-confirm-input') as HTMLInputElement).value;

        if (password && password !== confirmPassword) {
            alert('Passwords do not match!');
            return;
        }

        const updatedProfile: any = {
            username: (document.getElementById('username-input') as HTMLInputElement).value,
            email: (document.getElementById('email-input') as HTMLInputElement).value,
            twoaf: (document.getElementById('twoaf-input') as HTMLInputElement).checked
        };

        if (password) updatedProfile.password = password;

        const response = await updateProfileApi(updatedProfile, tokenLocal!);
        if (response.ok) {
            alert('Profil mis a jour !');
            await showProfileView();
        } else {
            alert('Erreur lors de l update');
        }
    });
}