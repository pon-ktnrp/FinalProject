const socket = io();
const playerGrid = document.getElementById('player-grid');
const enemyGrid = document.getElementById('enemy-grid');
const statusText = document.getElementById('status');

let playerId;
let shipsPlaced = 0;
let attacking = false;

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
  // Only allow ship placement on player grid if ships are not yet placed
  if (e.target.tagName === 'DIV' && shipsPlaced < 5) {
    e.target.style.backgroundColor = 'green';
    socket.emit('place-ship', parseInt(e.target.dataset.index, 10));
    shipsPlaced++;
    if (shipsPlaced === 5) {
      statusText.textContent = 'Waiting for other player...';
    }
  }
});

// Notify when the game is ready and countdown starts
socket.on('game-ready', (data) => {
  statusText.textContent = data.message;
});

// Handle countdown timer
socket.on('countdown', (data) => {
  statusText.textContent = `Game starts in: ${data.countdown}`;
});

// Notify when the game starts
socket.on('game-start', (data) => {
  statusText.textContent = data.message;
  attacking = true; // Player can start attacking
});

// Handle hit or miss and update only Player 2's enemy grid
socket.on('hit', (data) => {
  if (data.attackingPlayer !== playerId) {
    // Update Player 2's grid on Player 2's screen (for Player 1)
    const targetCell = document.querySelector(`[data-index="${data.targetIndex}"]`);
    targetCell.style.backgroundColor = 'red'; // Change color to red for a hit
    targetCell.classList.add('attacked');
    statusText.textContent = `Hit at ${data.targetIndex}!`;
  }
});

socket.on('miss', (data) => {
  if (data.attackingPlayer !== playerId) {
    // Update Player 2's grid on Player 2's screen (for Player 1)
    const targetCell = document.querySelector(`[data-index="${data.targetIndex}"]`);
    targetCell.style.backgroundColor = 'grey'; // Change color to grey for a miss
    targetCell.classList.add('attacked');
    statusText.textContent = `Missed at ${data.targetIndex}.`;
  }
});

// Handle turn change
socket.on('turn-change', (data) => {
  if (data.currentPlayer === playerId) {
    attacking = true;
    statusText.textContent = 'Your turn to attack!';
  } else {
    attacking = false;
    statusText.textContent = 'Waiting for opponent\'s turn...';
  }
});

// Handle attack on enemy grid (on Player 1's screen)
enemyGrid.addEventListener('click', (e) => {
  // Ensure only clicks on the enemy grid trigger attack logic
  if (attacking && e.target.tagName === 'DIV' && !e.target.classList.contains('attacked')) {
    const targetIndex = parseInt(e.target.dataset.index, 10);
    socket.emit('attack', targetIndex);
    attacking = false;
    statusText.textContent = 'Waiting for opponent\'s response...';

    // Locally update the enemy grid (for Player 1's attack)
    socket.on('hit', (data) => {
      if (data.attackingPlayer === playerId && data.targetIndex === targetIndex) {
        e.target.style.backgroundColor = 'red'; // Change to red if hit
        e.target.classList.add('attacked');
      }
    });

    socket.on('miss', (data) => {
      if (data.attackingPlayer === playerId && data.targetIndex === targetIndex) {
        e.target.style.backgroundColor = 'grey'; // Change to grey if miss
        e.target.classList.add('attacked');
      }
    });
  }
});

// Prevent clicks on Player 1's own grid (playerGrid) from updating any grid
playerGrid.addEventListener('click', (e) => {
  if (e.target.tagName === 'DIV') {
    // Do nothing if it's Player 1's own grid
    return; // No action taken if player clicks on their own grid
  }
});

// Notify when the game is over
socket.on('game-over', (data) => {
  if (data.winner === playerId) {
    statusText.textContent = 'You won the game!';
  } else {
    statusText.textContent = 'You lost the game.';
  }
});
