import express from 'express';

const router = express.Router();

// Define your game routes here
router.get('/', (req, res) => {
    res.send('Game Routes Working!');
});

export default router;
