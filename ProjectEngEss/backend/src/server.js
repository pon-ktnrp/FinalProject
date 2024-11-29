import app from './app.js';

// Handle unexpected errors
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION! Shutting down...');
    console.error(err.name, err.message);
    process.exit(1);
});

process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION! Shutting down...');
    console.error(err);
    server.close(() => process.exit(1));
});

const PORT = 3000;

const server = app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
