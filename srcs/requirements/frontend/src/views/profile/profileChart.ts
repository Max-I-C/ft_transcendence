export function drawDonutChart(win: number, loss: number): void {
    const canvas = document.getElementById('donutChart') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const total = win + loss;
    if (total === 0) return;

    const winAngle = (win / total) * 2 * Math.PI;
    const lossAngle = (loss / total) * 2 * Math.PI;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;

    // win slice
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.fillStyle = "#4caf50";
    ctx.arc(centerX, centerY, radius, 0, winAngle);
    ctx.fill();

    // loss slice
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.fillStyle = "#f44336";
    ctx.arc(centerX, centerY, radius, winAngle, winAngle + lossAngle);
    ctx.fill();

    // inner hole
    ctx.beginPath();
    ctx.fillStyle = "#fff";
    ctx.arc(centerX, centerY, radius * 0.5, 0, 2 * Math.PI);
    ctx.fill();

    // percentage text
    const winratePercent = total === 0 ? 0 : Math.round((win / total) * 100);
    const text = `${winratePercent}%`;

    ctx.fillStyle = "#000";
    ctx.font = `${radius * 0.2}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText(text, centerX, centerY);
}