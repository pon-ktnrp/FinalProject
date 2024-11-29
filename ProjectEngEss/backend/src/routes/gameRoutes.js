const express = require('express');
const { createRoom, joinRoom } = require('../controllers/gameController');
const router = express.Router();

router.post('/create-room', createRoom);
router.post('/join-room', joinRoom);

module.exports = router;