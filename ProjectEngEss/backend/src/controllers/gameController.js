const Room = require('../models/room');

const createRoom = async (req, res) => {
    try {
        const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        const newRoom = new Room({ code: roomCode });
        await newRoom.save();
        res.status(201).json({ code: roomCode });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create room' });
    }
};

const joinRoom = async (req, res) => {
    try {
        const { code } = req.body;
        const room = await Room.findOne({ code });
        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }
        res.status(200).json({ message: 'Joined room successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to join room' });
    }
};

module.exports = { createRoom, joinRoom };