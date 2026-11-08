const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const { connectDB, getDbStatus } = require('./config/db');
const articleRoutes = require('./routes/articleRoutes');
const categoryRoutes = require('./routes/categoryRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB (non-blocking)
connectDB();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'berryfresh-articles-api',
    mongodbConnected: getDbStatus(),
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/articles', articleRoutes);
app.use('/api/categories', categoryRoutes);

// Root Welcome
app.get('/', (req, res) => {
  res.json({
    name: 'Berry Fresh Knowledge & Articles API',
    version: '2.0.0',
    endpoints: {
      health: '/api/health',
      articles: '/api/articles',
      categories: '/api/categories',
    },
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Error]', err.stack);
  res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
});

// Start listening
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🍓 Berry Fresh Articles API is running on http://localhost:${PORT}`);
    console.log(`📡 Endpoints: http://localhost:${PORT}/api/articles`);
  });
}

module.exports = app;
