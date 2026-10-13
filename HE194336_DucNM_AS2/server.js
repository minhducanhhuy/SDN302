require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');

const bookRoutes = require('./routes/bookRoutes');
const memberRoutes = require('./routes/memberRoutes');
const loanRoutes = require('./routes/loanRoutes');

const app = express();
app.use(express.json());

app.use('/api/books', bookRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/loans', loanRoutes);

app.use((req, res) => {
    res.status(404).json({ message: 'Route not found.' });
});

app.use((err, req, res, next) => {
    if (err.name === 'CastError') {
        return res.status(404).json({ message: 'Resource not found.' });
    }
    if (err.name === 'ValidationError') {
        return res.status(400).json({ message: err.message });
    }
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern || {})[0];
        return res.status(409).json({
            message: field ? `${field} already exists.` : 'A record with these values already exists.'
        });
    }

    const statusCode = Number.isInteger(err.status) && err.status >= 400 && err.status < 600
        ? err.status
        : 500;
    if (statusCode !== 500) {
        return res.status(statusCode).json({ message: err.message });
    }

    console.error(err);
    res.status(500).json({ message: 'Internal server error.' });
});

const PORT = process.env.PORT || 8888;

connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    })
    .catch(error => {
        console.error('MongoDB connection failed:', error.message);
        process.exitCode = 1;
    });
