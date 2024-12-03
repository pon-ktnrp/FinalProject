const http = require('http');
const socketIo = require('socket.io');
const app = require('./backend/src/app');

const server = http.createServer(app);
const io = socketIo(server);

let players = []; // Store connected players
let playerStates = {}; // Track each player's ship placement and turns

io.on('connection', (socket) => {
  console.log(`A user connected: ${socket.id}`);

  // Add the new player to the game
  if (players.length < 2) {
    players.push(socket.id);
    playerStates[socket.id] = {
      ships: [],
      ready: false,
    };

    socket.emit('player-assigned', { playerId: socket.id });
  } else {
    socket.emit('game-full');
  }

  // Handle ship placement
  socket.on('place-ship', (index) => {
    if (playerStates[socket.id].ships.length < 5) {
      playerStates[socket.id].ships.push(index);

      // Check if the player is ready
      if (playerStates[socket.id].ships.length === 5) {
        playerStates[socket.id].ready = true;
        socket.emit('ready', { message: 'Ships placed!' });

        // Notify both players when the game starts
        if (players.every((id) => playerStates[id]?.ready)) {
          io.emit('game-start', { message: 'All players are ready!' });
        }
      }
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
