const socket = io(); // Connect to the server
const playerGrid = document.getElementById('player-grid');
const enemyGrid = document.getElementById('enemy-grid');
const statusText = document.getElementById('status');
const startGameButton = document.getElementById('start-game');

let shipsPlaced = 0;
let gameStarted = false;

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

// Handle ship placement
playerGrid.addEventListener('click', (e) => {
  if (e.target.tagName === 'DIV' && shipsPlaced < 5 && !gameStarted) {
    e.target.style.backgroundColor = 'green'; // Mark as a ship
    shipsPlaced++;
    if (shipsPlaced === 5) {
      statusText.textContent = 'Waiting for another player...';
      socket.emit('ships-placed');
    }
  }
});

// Handle enemy grid clicks
enemyGrid.addEventListener('click', (e) => {
  if (e.target.tagName === 'DIV' && gameStarted) {
    e.target.style.backgroundColor = 'red'; // Simulate a hit
    socket.emit('attack', e.target.dataset.index);
  }
});

// Socket.IO events
socket.on('game-started', () => {
  gameStarted = true;
  statusText.textContent = 'Game started! Attack the enemy!';
});

socket.on('attack-result', ({ index, hit }) => {
  const cell = playerGrid.children[index];
  cell.style.backgroundColor = hit ? 'red' : 'blue';
});
