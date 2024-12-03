const socket = io();
const playerGrid = document.getElementById('player-grid');
const enemyGrid = document.getElementById('enemy-grid');
const statusText = document.getElementById('status');

let playerId;
let shipsPlaced = 0;

// Create 10x10 grids
function createGrid(gridElement) {
  for (let i = 0; i < 100; i++) {
    const cell = document.createElement('div');
    cell.dataset.index = i;
    gridElement.appendChild(cell);
  }
}

createGrid(playerGrid);
createGrid(enemyGrid);

// Assign player ID from server
socket.on('player-assigned', (data) => {
  playerId = data.playerId;
  statusText.textContent = 'Place your ships (5 total)';
});

socket.on('game-full', () => {
  alert('The game is full. Please try again later.');
});

// Handle ship placement
playerGrid.addEventListener('click', (e) => {
  if (e.target.tagName === 'DIV' && shipsPlaced < 5) {
    e.target.style.backgroundColor = 'green';
    socket.emit('place-ship', parseInt(e.target.dataset.index, 10));
    shipsPlaced++;
    if (shipsPlaced === 5) {
      statusText.textContent = 'Waiting for other player...';
    }
  }
});

// Notify when the game starts
socket.on('game-start', (data) => {
  statusText.textContent = data.message;
});
