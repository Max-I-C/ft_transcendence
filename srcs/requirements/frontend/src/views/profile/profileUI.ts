import { navigateTo } from '../../main.js';
import { logout } from '../auth.js';

export function renderProfileUI() {
    const app = document.getElementById('app')!;
    app.innerHTML = `
        <nav class="terminal-navbar">
            <ul class="terminal-nav-links">
                <li><a href="#" id="home-link">Home</a></li>
                <li><a href="#" id="game-link">Game</a></li>
                <li><a href="#" id="social-link">Social</a></li>
                <li><a href="#" id="profile-link">Profile</a></li>
                <li><a href="#" id="logout-link">⏻</a></li>
            </ul>
        </nav>
        <div class="profile-container">
            <div class="glass profile-card">
                <button id="edit-profile" class="edit-btn" title="Edit your profil">🔧</button>
                <div class="profile-header">
                    <div class="profile-picture" id="profile-picture"></div>
                    <h2>Profile</h2>
                </div>
                <p><strong>Userame :</strong> <span id="username-text">loading.....</span> <input id="username-input" type="text" style="display: none;"></p>
                <p><strong>Email :</strong> <span id="email-text">loading.....</span> <input id="email-input" type="email" style="display: none;"></p>
                <p><strong>2AF :</strong> <span id="twoaf-text">OFF</span> <input id="twoaf-input" type="checkbox" style="display: none;"></p>
                <p><strong>New password :</strong> <input id="password-input" type="password" style="display: none;"></p>
                <p><strong>Confirm password :</strong> <input id="password-confirm-input" type="password" style="display: none;"></p>
                <p><strong>Status :</strong> Online 🟢</p>
                <button id="save-profile" class="save-btn" style="display: none;">💾 Save</button>
            </div>
            <div class="glass">
                <h2>Game data</h2>
                <p><strong>Game played :<span id="game_play">loading.....</span></p>
                <p><strong>Game win :<span id="game_win">loading.....</span></p>
                <p><strong>Game loss :<span id="game_loss">loading.....</span></p>
                <p><strong>Score total :<span id="score_total">loading.....</span></p>
                <p><strong>Level :<span id="level">loading.....</span></p>
                <p><strong>Rank :<span id="rank">loading.....</span></p>
            </div>
        </div>

        <div class="stat-card">
            <div class="stat-cards">
                <div class="game-stat">
                    <h3>Games played</h3>
                    <p id="games-played">loading...</p>
                </div>
                <div class="game-stat">
                    <h3>Games won</h3>
                    <p id="games-won">loading...</p>
                </div>
                <div class="game-stat">
                    <h3>Games lost</h3>
                    <p id="games-lost">loading...</p>
                </div>
            </div>
            <div class="match-logs">
                <h3>Last Match Logs</h3>
                <ul id="logs-list">
                    <li>Loading match data...</li>
                </ul>
            </div>

            <div class="chart-container">
                <h3>Game Win/Loss Ratio</h3>
                <canvas id="donutChart" width="300" height="300"></canvas>
                <div class="legend" style="text-align:center; margin-top:10px;">
                    <span style="color: #4caf50; font-weight:bold;">&#9632; Win</span>
                    <span style="color: #f44336; font-weight:bold; margin-left: 20px;">&#9632; Loss</span>
                </div>
            </div>
            <div class="rank-section">
                <div class="current-rank">
                    <div class="rank-title">Actual Rank</div>
                    <img id="currentRankImg" src="" alt="Current Rank">
                    <div id="currentRankLabel" class="rank-label"></div>
                </div>

                <div class="score-next">
                    <div class="score">
                        <span class="score-value" id="score"></span>
                        <span class="score-label">Points</span>
                    </div>
                    <div class="separator"></div>
                    <div class="next-rank">
                        <div class="rank-title">Next Rank</div>
                        <img id="nextRankImg" src="" alt="Next Rank">
                        <div id="nextRankLabel" class="next-label"></div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.className = 'home-page';
    document.getElementById('game-link')!.addEventListener('click', () => navigateTo('/game'));
    document.getElementById('profile-link')!.addEventListener('click', () => navigateTo('/profile'));
    document.getElementById('social-link')!.addEventListener('click', () => navigateTo('/social'));
    document.getElementById('home-link')!.addEventListener('click', () => navigateTo('/home'));
    document.getElementById('logout-link')!.addEventListener('click', () => logout());
}