const express = require('express')
const path = require('path')
const http = require('http')
const PORT = process.env.PORT || 3000
const socketio = require('socket.io')
const app = express()
const server = http.createServer(app)
const io = socketio(server)
let rooms = {}; // Store room data in-memory

app.use(express.json())

// Create a room
app.post('/create-room', (req, res) => {
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    rooms[roomCode] = { players: [] };
    res.json({ roomCode });
});

// Join a room
app.post('/join-room', (req, res) => {
  const { roomCode, playerName } = req.body;
  if (rooms[roomCode] && rooms[roomCode].players.length < 2) {
      rooms[roomCode].players.push(playerName);
      res.json({ success: true, message: 'Joined room' });
  } else {
      res.status(400).json({ success: false, message: 'Room full or not found' });
  }
});

// Set static folder
app.use(express.static(path.join(__dirname, "frontend/public/html")))
app.use(express.static(path.join(__dirname, "frontend/public/css")))
app.use(express.static(path.join(__dirname, "frontend/public/scripts")))

// Start server
server.listen(PORT, () => console.log(`Server running on port ${PORT}`))

// Handle a socket connection request from web client
const connections = [null, null]

io.on('connection', socket => {
  // console.log('New WS Connection')

  // Find an available player number
  let playerIndex = -1;
  for (const i in connections) {
    if (connections[i] === null) {
      playerIndex = i
      break
    }
  }

  // Tell the connecting client what player number they are
  socket.emit('player-number', playerIndex)

  console.log(`Player ${playerIndex} has connected`)

  // Ignore player 3
  if (playerIndex === -1) return

  connections[playerIndex] = false

  // Tell eveyone what player number just connected
  socket.broadcast.emit('player-connection', playerIndex)

  // Handle Diconnect
  socket.on('disconnect', () => {
    console.log(`Player ${playerIndex} disconnected`)
    connections[playerIndex] = null
    //Tell everyone what player numbe just disconnected
    socket.broadcast.emit('player-connection', playerIndex)
  })

  // On Ready
  socket.on('player-ready', () => {
    socket.broadcast.emit('enemy-ready', playerIndex)
    connections[playerIndex] = true
  })

  // Check player connections
  socket.on('check-players', () => {
    const players = []
    for (const i in connections) {
      connections[i] === null ? players.push({connected: false, ready: false}) : players.push({connected: true, ready: connections[i]})
    }
    socket.emit('check-players', players)
  })

  // On Fire Received
  socket.on('fire', id => {
    console.log(`Shot fired from ${playerIndex}`, id)

    // Emit the move to the other player
    socket.broadcast.emit('fire', id)
  })

  // on Fire Reply
  socket.on('fire-reply', square => {
    console.log(square)

    // Forward the reply to the other player
    socket.broadcast.emit('fire-reply', square)
  })

  // Timeout connection
  setTimeout(() => {
    connections[playerIndex] = null
    socket.emit('timeout')
    socket.disconnect()
  }, 600000) // 10 minute limit per player
})