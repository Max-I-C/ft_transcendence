export function initializeWebSocket() {
    const socket = new WebSocket('ws://localhost:3000/ws');
    const tokenLocal = localStorage.getItem('token') ?? undefined;

    if (tokenLocal) {
        socket.addEventListener('open', () => {
            socket.send(JSON.stringify({ type: 'auth', token: tokenLocal }));
        });
    }

    socket.addEventListener('message', (event) => {
        try {
            const msg = JSON.parse(event.data);
            console.log('WebSocket message received:', msg);
        } catch (err) {
            console.error('Failed to parse WebSocket message:', err);
        }
    });

    return socket;
}