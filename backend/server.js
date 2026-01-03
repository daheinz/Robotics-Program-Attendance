const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
require('dotenv').config();

const requestLogger = require('./middleware/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { optionalAuth } = require('./middleware/auth');
const { processMidnightCheckout } = require('./utils/midnightCheckout');

// Import routes
const kioskRoutes = require('./routes/kiosk');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const presenceRoutes = require('./routes/presence');
const attendanceRoutes = require('./routes/attendance');
const contactRoutes = require('./routes/contacts');
const reflectionRoutes = require('./routes/reflections');
const settingsRoutes = require('./routes/settings');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);
app.use(optionalAuth); // Add user to request if authenticated

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Manual trigger for midnight checkout (for testing)
app.post('/admin/midnight-checkout', async (req, res) => {
  try {
    await processMidnightCheckout();
    res.json({ success: true, message: '2 AM checkout process completed' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API Routes
app.use('/auth', authRoutes);
app.use('/kiosk', kioskRoutes);
app.use('/users', userRoutes);
app.use('/presence', presenceRoutes);
app.use('/attendance', attendanceRoutes);
app.use('/', contactRoutes); // Includes /users/:id/contacts and /contacts/:contactId
app.use('/reflections', reflectionRoutes);
app.use('/settings', settingsRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Robotics Attendance System API running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

// Schedule midnight auto-checkout (runs daily at 2:00 AM)
cron.schedule('0 2 * * *', async () => {
  console.log('⏰ Running scheduled 2 AM checkout...');
  try {
    await processMidnightCheckout();
  } catch (error) {
    console.error('Error in scheduled 2 AM checkout:', error);
  }
}, {
  timezone: 'America/New_York' // Adjust to your timezone
});

console.log('✓ Auto-checkout scheduled (2:00 AM daily)');

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

module.exports = app;
