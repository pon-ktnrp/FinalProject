const http = require('http');
const socketIo = require('socket.io');
const app = require('./backend/src/app');

const server = http.createServer(app);
const io = socketIo(server);

let players = []; // Store connected players
let playerStates = {}; // Track each player's ship placement and turns
let countdownTimer = null; // To handle the countdown
let currentTurn = 0; // Keep track of whose turn it is (0 for player 1, 1 for player 2)

// Ship positions for each player
const shipPositions = {
  // { playerId: [shipIndex1, shipIndex2, ...] }
};

io.on('connection', (socket) => {
  console.log(`A user connected: ${socket.id}`);

  if (players.length < 2) {
    players.push(socket.id);
    playerStates[socket.id] = {
      ships: [],
      ready: false,
      turn: false,
      attacks: [],
      sunk: 0
    };

    socket.emit('player-assigned', { playerId: socket.id });
  } else {
    socket.emit('game-full');
  }

  // Handle ship placement
  socket.on('place-ship', (index) => {
    if (playerStates[socket.id].ships.length < 5) {
      playerStates[socket.id].ships.push(index);

      // Add ship positions to the shipPositions object
      if (playerStates[socket.id].ships.length === 5) {
        shipPositions[socket.id] = playerStates[socket.id].ships; // Store ships

        playerStates[socket.id].ready = true;
        socket.emit('ready', { message: 'Ships placed!' });

        if (players.every((id) => playerStates[id]?.ready)) {
          io.emit('game-ready', { message: 'Both players are ready! Starting countdown...' });

          // Start countdown from 5 to 0
          let countdown = 5;
          countdownTimer = setInterval(() => {
            io.emit('countdown', { countdown });
            if (countdown === 0) {
              clearInterval(countdownTimer);
              io.emit('game-start', { message: 'Game started! Player 1, it\'s your turn to attack!' });
              playerStates[players[0]].turn = true; // Player 1 goes first
            }
            countdown--;
          }, 1000);
        }
      }
    }
  });

  // Handle attack logic
  socket.on('attack', (targetIndex) => {
    const attackingPlayer = socket.id;
    const defendingPlayer = players[(players.indexOf(attackingPlayer) + 1) % 2];

    // Check if it's the player's turn
    if (playerStates[attackingPlayer].turn) {
      if (shipPositions[defendingPlayer] && shipPositions[defendingPlayer].includes(targetIndex)) {
        // Attack hits
        playerStates[defendingPlayer].sunk++;
        playerStates[attackingPlayer].attacks.push(targetIndex);
        io.emit('hit', { attackingPlayer, targetIndex });

        // Check if the defending player has lost all ships
        if (playerStates[defendingPlayer].sunk === 5) {
          io.emit('game-over', { winner: attackingPlayer });
        }
      } else {
        // Attack misses
        playerStates[attackingPlayer].attacks.push(targetIndex);
        io.emit('miss', { attackingPlayer, targetIndex });
      }

      // Switch turn
      playerStates[attackingPlayer].turn = false;
      playerStates[defendingPlayer].turn = true;
      io.emit('turn-change', { currentPlayer: defendingPlayer });
    } else {
      socket.emit('not-your-turn', { message: 'It\'s not your turn!' });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    players = players.filter((id) => id !== socket.id);
    delete playerStates[socket.id];
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
