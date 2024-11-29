import express from 'express';
import mongoose from 'mongoose';
import gameRoutes from './routes/gameRoutes.js';

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// Routes
app.use('/api/game', gameRoutes);

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/battleship', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

export default app;
