const http = require('http');
const socketIo = require('socket.io');
const app = require('./backend/src/app');

const server = http.createServer(app);
const io = socketIo(server);

const players = [];
const grids = {}; // Stores player grids

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  players.push(socket.id);
  grids[socket.id] = [];

  if (players.length === 2) {
    io.emit('game-started');
  }

  socket.on('ships-placed', () => {
    console.log(`Player ${socket.id} placed ships`);
  });

  socket.on('attack', (index) => {
    const opponent = players.find((id) => id !== socket.id);
    const hit = grids[opponent]?.includes(parseInt(index, 10));
    socket.emit('attack-result', { index, hit });
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
    const index = players.indexOf(socket.id);
    if (index !== -1) players.splice(index, 1);
    delete grids[socket.id];
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
