// Extract roomCode from URL
const urlParams = new URLSearchParams(window.location.search);
const roomCode = urlParams.get('roomCode');

if (roomCode) {
    console.log(`Room Code: ${roomCode}`);
    // Display room code or use it for backend requests
    document.getElementById('room-code-display').textContent = `Room Code: ${roomCode}`;
} else {
    alert('Room code not found. Redirecting to home page.');
    window.location.href = './index.html';
}
