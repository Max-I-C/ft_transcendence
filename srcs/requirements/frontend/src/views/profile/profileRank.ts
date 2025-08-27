export function renderRanks(profile: any) {
    const currentRankImg = document.getElementById('currentRankImg') as HTMLImageElement | null;
    const currentRankLabel = document.getElementById('currentRankLabel') as HTMLDivElement | null;
    const nextRankImg = document.getElementById('nextRankImg') as HTMLImageElement | null;
    const nextRankLabel = document.getElementById('nextRankLabel') as HTMLDivElement | null;
    const rankText = document.getElementById('rank') as HTMLElement | null;

    const score = profile.score_total ?? 0;

    const ranks = [
        { name: 'Bronze', min: 0, max: 99, img: '/views/images/bronze.png', next: 'Silver', nextPoints: 100, nextImg: '/views/images/silver.png' },
        { name: 'Silver', min: 100, max: 199, img: '/views/images/silver.png', next: 'Gold', nextPoints: 200, nextImg: '/views/images/gold.png' },
        { name: 'Gold', min: 200, max: 299, img: '/views/images/gold.png', next: 'Amethiste', nextPoints: 300, nextImg: '/views/images/amethiste.png' },
        { name: 'Amethiste', min: 300, max: Infinity, img: '/views/images/amethiste.png', next: null, nextPoints: null, nextImg: null }
    ];

    const currentRank = ranks.find(r => score >= r.min && score <= r.max);

    if (currentRank) {
        if (currentRankImg) currentRankImg.src = currentRank.img;
        if (currentRankLabel) currentRankLabel.textContent = currentRank.name;
        if (rankText) rankText.innerText = currentRank.name ?? 'Unknow';

        if (currentRank.next) {
            if (nextRankImg) nextRankImg.src = currentRank.nextImg!;
            if (nextRankLabel) nextRankLabel.textContent = `${currentRank.next} - ${currentRank.nextPoints} pts`;
        } else {
            if (nextRankImg) nextRankImg.style.display = 'none';
            if (nextRankLabel) nextRankLabel.textContent = 'Max Rank';
        }
    }
}