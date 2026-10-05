const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes');
const { notFound, errorHandler } = require('./middlewares/error.middleware');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic Health Check Route
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Server is up and running!',
        data: null
    });
});

// Welcome Route
app.get('/', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Welcome to Smart Classroom Management API',
        data: null
    });
});

// API Routes
app.use('/api', apiRoutes);

// Error handling (phải đặt CUỐI CÙNG)
app.use(notFound);
app.use(errorHandler);

module.exports = app;
