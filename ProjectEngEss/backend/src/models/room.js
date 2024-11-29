const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
    code: { type: String, required: true },
    players: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
});

module.exports = mongoose.model('Room', RoomSchema);