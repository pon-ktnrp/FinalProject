const express = require('express');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const LogInCollection = require('./mongodb'); // Ensure mongodb.js exports LogInCollection

const PORT = process.env.PORT || 3000;

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Database connected'))
    .catch(err => console.log('Database connection error:', err));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static files
app.use(express.static(path.join(__dirname, 'frontend/public')));

// Routes for signup and login
app.get('/signup', (req, res) =>
    res.sendFile(path.join(__dirname, 'frontend/public/html/signup.html'))
);

app.get('/', (req, res) =>
    res.sendFile(path.join(__dirname, 'frontend/public/html/login.html'))
);

app.post('/signup', async (req, res) => {
    try {
        const { name, password } = req.body;
        const existingUser = await LogInCollection.findOne({ name });

        if (existingUser) {
            return res.status(400).send('User already exists');
        }

        await LogInCollection.create({ name, password });
        res.redirect('/'); // Redirect to login page
    } catch (err) {
        console.error(err);
        res.status(500).send('Error during signup');
    }
});

app.post('/login', async (req, res) => {
    try {
        const { name, password } = req.body;
        const user = await LogInCollection.findOne({ name });

        if (!user) {
            return res.status(400).send('User not found');
        }

        if (user.password !== password) {
            return res.status(400).send('Incorrect password');
        }

        // Redirect with username as a query parameter
        res.redirect(`/multiplayer.html?username=${encodeURIComponent(user.name)}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error during login');
    }
});

// Route for multiplayer.html
app.get('/multiplayer.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/public/html/multiplayer.html'));
});

// Socket.io logic
const connections = [null, null]; // Supports two players

io.on('connection', (socket) => {
    // Retrieve username from query parameters
    const { username } = socket.handshake.query;

    let playerIndex = -1;

    // Find an available player number
    for (const i in connections) {
        if (connections[i] === null) {
            playerIndex = i;
            break;
        }
    }

    socket.emit('player-number', { index: playerIndex, username });
    console.log(`Player ${username} has connected as Player ${playerIndex}`);

    if (playerIndex === -1) {
        // Server full
        socket.emit('server-full', 'Sorry, the server is full.');
        return;
    }

    // Assign the player to the connection slot
    connections[playerIndex] = { socketId: socket.id, username, ready: false };

    // Notify other players about the new connection
    socket.broadcast.emit('player-connection', { index: playerIndex, username });

    // Handle Disconnect
    socket.on('disconnect', () => {
        console.log(`Player ${username} disconnected`);
        connections[playerIndex] = null;
        socket.broadcast.emit('player-disconnection', playerIndex);
    });

    // Player Ready
    socket.on('player-ready', () => {
        if (connections[playerIndex]) {
            connections[playerIndex].ready = true;
            socket.broadcast.emit('enemy-ready', { index: playerIndex, username });
        }
    });

    // Check Player Connections
    socket.on('check-players', () => {
        const players = connections.map((connection) => ({
            connected: connection !== null,
            ready: connection ? connection.ready : false,
            username: connection ? connection.username : null,
        }));
        socket.emit('check-players', players);
    });

    // Fire event
    socket.on('fire', (id) => {
        console.log(`Shot fired from ${username} (Player ${playerIndex}):`, id);
        socket.broadcast.emit('fire', { id, attacker: playerIndex });
    });

    // Fire Reply
    socket.on('fire-reply', (square) => {
        console.log(`Fire reply from ${username} (Player ${playerIndex}):`, square);
        socket.broadcast.emit('fire-reply', square);
    });

    // Timeout
    setTimeout(() => {
        if (connections[playerIndex] !== null) {
            connections[playerIndex] = null;
            socket.emit('timeout');
            socket.disconnect();
            socket.broadcast.emit('player-disconnection', playerIndex);
        }
    }, 600000); // Disconnect after 10 minutes
});

// Start server
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
