const mongoose = require('mongoose');

const PlayerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    roomCode: { type: String, required: true },
    ships: { type: Array, default: [] },
    hits: { type: Array, default: [] },
});

module.exports = mongoose.model('Player', PlayerSchema);