/*
// -- socialUI.ts -- //
#######################################################################################
# The socialUI.ts file is the one that load all the html of the social page.          #
#######################################################################################
*/

export function renderSocialUI(app: HTMLElement) {
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
        <div class="social-container">
            <section class="friends-column glass" aria-label="Friends list">
                <div id="pending-requests" class="pending-requests glass">
                    <h3>Friends requests</h3>
                    <ul class="friends-list" role="list" id="pending-list"></ul>
                </div>
                <h2>My friends</h2>
                <ul class="friends-list" role="list" id="friends-list"></ul>
                <form class="add-friend" id="add-friend-form">
                    <input id="friendUsername" type="text" placeholder="Add a friend by his username" required />
                    <button id="addBtn" type="submit" disabled>Add</button>
                </form>
            </section>
            <section class="chat-bubble glass-conversation" aria-label="Chat area">
                <h2>Conversation</h2>
                <div class="chat-empty">Select a friend to load your conversation.</div>
            </section>
        </div>
        <div id="profile-popup" class="profile-popup hidden" role="dialog" aria-hidden="true"></div>
        <div id="context-menu" class="context-menu hidden">
            <ul>
                <li id="profile-action">👤 See profile</li>
                <li id="invite-action">🎮 Invite to play</li>
                <li id="block-action">🚫 Block</li>
                <li id="remove-action">❌ Delete</li>
            </ul>
        </div>
        <div id="private-game" style="display:none;">
            <div class="game-interface">
                <div class="pvp-lobby">
                    <div id="lobby-status"></div>
                    <div id="lobby-players">
                        <p><strong>Player 1:</strong> <span id="player1">Waiting...</span></p>
                        <p><strong>Player 2:</strong> <span id="player2">Waiting...</span></p>
                    </div>
                </div>
                <div class="game-canvas-container">
                    <canvas id="pong-canvas-pvp" width="400" height="300"></canvas> 
                </div>
                <div class="game-score">
                    <p id="score-pvp">Score: 0 - 0</p>
                </div>
                <p id="game-over-pvp" class="game-over-message"></p>
            </div>
        </div>
    `;
}