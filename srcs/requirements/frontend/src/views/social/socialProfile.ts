/*
// -- socialProfile.ts -- //
#######################################################################################
# The socialProfile.ts file is the one that load when the user                        #
# press the button "see profile" of one of his friend.                                #
#######################################################################################
*/

export function showProfilePopup(profile: { username: string; game_play: number; game_win: number; game_loss: number; score_total: number; level: number; is_online: number}, pos?: { x: number; y: number }) {
    const popup = document.getElementById('profile-popup') as HTMLDivElement;
    if (!popup) return;
    popup.innerHTML = `
        <div class="profile-popup-inner">
            <button id="profile-popup-close" class="profile-popup-close">✕</button>
            <h3>
                @${profile.username}
                <span class="status-indicator ${profile.is_online ? 'online' : 'offline'}"></span>
            </h3>
            <div class="profile-stats">
                <p>Level: ${profile.level ?? 0}</p>
                <p>Score total: ${profile.score_total ?? 0}</p>
                <p>Games played: ${profile.game_play ?? 0}</p>
                <p>Winrate : ${(((profile.game_play ?? 0) - (profile.game_loss ?? 0)) / (profile.game_play ?? 0) * 100).toFixed(1)}% </p>
            </div>
        </div>
    `;
    if (pos) {
        const offsetX = 8;
        const offsetY = 0;
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const popupW = 260;
        const popupH = 180;
        let left = pos.x + offsetX;
        let top = pos.y + offsetY;
        if (left + popupW > vw) left = Math.max(8, vw - popupW - 8);
        if (top + popupH > vh) top = Math.max(8, vh - popupH - 8);
        popup.style.left = `${left}px`;
        popup.style.top = `${top}px`;
        popup.style.transform = '';
    }
    popup.classList.remove('hidden');
    popup.setAttribute('aria-hidden', 'false');
    document.getElementById('profile-popup-close')?.addEventListener('click', () => closeProfilePopup());
    setTimeout(() => {
        document.addEventListener('click', outsideClickListener);
    }, 0);
    function outsideClickListener(e: MouseEvent) {
        const target = e.target as HTMLElement;
        if (!popup.contains(target)) {
            closeProfilePopup();
        }
    }
    function closeProfilePopup() {
        popup.classList.add('hidden');
        popup.setAttribute('aria-hidden', 'true');
        popup.innerHTML = '';
        document.removeEventListener('click', outsideClickListener);
        popup.style.transform = '';
    }
}