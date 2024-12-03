const express = require('express');
const path = require('path');
const app = express();

// Serve static files (CSS, JS, etc.) from the public folder
app.use(express.static(path.join(__dirname, '../../frontend/public')));

// Serve the main HTML file from the html folder
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/public/html/index.html'));
});

module.exports = app;
