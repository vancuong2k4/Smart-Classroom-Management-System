require('dotenv').config();
const http = require('http');
const app = require('./app');
const { Server } = require('socket.io');
const { connectRedis } = require('./config/redis');
const setupSocket = require('./sockets');

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// Setup Websocket logic
setupSocket(io);

const startServer = async () => {
    try {
        await connectRedis();
        server.listen(PORT, () => {
            console.log(`🚀 Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
