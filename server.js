const express = require('express');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const LogInCollection = require('./mongodb');
 // Reuse from mongodb.js

const PORT = process.env.PORT || 3000;

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Database connected'))
    .catch(err => console.log(err));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Set static folder
app.use(express.static(path.join(__dirname, 'frontend/public')));

// Routes for authentication
app.get('/signup', (req, res) => res.sendFile(path.join(__dirname, 'frontend/public/html/signup.html')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'frontend/public/html/login.html')));

app.post('/signup', async (req, res) => {
    try {
        const existingUser = await LogInCollection.findOne({ name: req.body.name });
        if (existingUser) return res.status(400).send('User already exists');

        await LogInCollection.create({ name: req.body.name, password: req.body.password });
        res.redirect('/'); // Redirect to login page after signup
    } catch (err) {
        res.status(500).send('Error registering user');
    }
});

app.post('/login', async (req, res) => {
    try {
        const user = await LogInCollection.findOne({ name: req.body.name });
        if (!user) return res.status(400).send('User not found');

        if (user.password !== req.body.password) return res.status(400).send('Incorrect password');

        res.redirect('/multiplayer.html'); // Redirect to multiplayer.html on success
    } catch (err) {
        res.status(500).send('Error logging in');
    }
});

// Route for multiplayer.html
app.get('/multiplayer.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/public/html/multiplayer.html'));
});


// Socket.io logic
const connections = [null, null];

io.on('connection', (socket) => {
    let playerIndex = -1;

    // Find an available player number
    for (const i in connections) {
        if (connections[i] === null) {
            playerIndex = i;
            break;
        }
    }
    socket.emit('player-number', playerIndex);
    console.log(`Player ${playerIndex} has connected`);

    if (playerIndex === -1) return;

    connections[playerIndex] = false;

    socket.broadcast.emit('player-connection', playerIndex);

    // Handle Disconnect
    socket.on('disconnect', () => {
        console.log(`Player ${playerIndex} disconnected`);
        connections[playerIndex] = null;
        socket.broadcast.emit('player-connection', playerIndex);
    });

    // Player Ready
    socket.on('player-ready', () => {
        socket.broadcast.emit('enemy-ready', playerIndex);
        connections[playerIndex] = true;
    });

    // Check Player Connections
    socket.on('check-players', () => {
        const players = connections.map((connection) => ({
            connected: connection !== null,
            ready: connection === true,
        }));
        socket.emit('check-players', players);
    });

    // Fire event
    socket.on('fire', (id) => {
        console.log(`Shot fired from ${playerIndex}`, id);
        socket.broadcast.emit('fire', id);
    });

    // Fire Reply
    socket.on('fire-reply', (square) => {
        console.log(square);
        socket.broadcast.emit('fire-reply', square);
    });

    // Timeout
    setTimeout(() => {
        connections[playerIndex] = null;
        socket.emit('timeout');
        socket.disconnect();
    }, 600000); // 10 minutes
});

// Start server
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
