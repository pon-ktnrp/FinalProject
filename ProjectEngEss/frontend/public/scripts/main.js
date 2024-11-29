const createRoomButton = document.getElementById('create-room');
const joinRoomButton = document.getElementById('join-room');

createRoomButton.addEventListener('click', () => {
    window.location.href = 'createPage.html';
});

joinRoomButton.addEventListener('click', () => {
    window.location.href = 'joinPage.html';
});