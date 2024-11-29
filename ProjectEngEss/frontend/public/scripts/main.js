const createRoomButton = document.getElementById('create-room');
const joinRoomButton = document.getElementById('join-room');

createRoomButton.addEventListener('click', () => {
    window.location.href = 'create-room.html';
});

joinRoomButton.addEventListener('click', () => {
    window.location.href = 'join-room.html';
});