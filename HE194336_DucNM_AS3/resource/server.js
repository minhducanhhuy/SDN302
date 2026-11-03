const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const classRoutes = require('./routes/classRoutes');
const studentRoutes = require('./routes/studentRoutes');

const app = express();
const PORT = process.env.PORT || 9999;

// Connect to MongoDB
connectDB();

// Global Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Primary REST API Routes
app.use('/api/auth', authRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/students', studentRoutes);

// Route Aliases (without /api prefix) for flexibility
app.use('/auth', authRoutes);
app.use('/classes', classRoutes);
app.use('/students', studentRoutes);

// Root Health Check Route
app.get('/', (req, res) => {
  res.json({ message: 'Assignment3 Attendance API is running', port: PORT });
});

// 404 Fallback Handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start Server if run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Base URL: http://localhost:${PORT}`);
  });
}

module.exports = app;
