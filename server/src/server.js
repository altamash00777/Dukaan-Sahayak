const dotenv = require('dotenv');
// Load environment variables before anything else
dotenv.config();

const app = require('./app');
const connectDB = require('./config/db');

// Handle uncaught exceptions gracefully
process.on('uncaughtException', (err) => {
  console.error('CRITICAL: UNCAUGHT EXCEPTION! Shutting down...', err);
  process.exit(1);
});


app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Dukaan Sahayak API is running"
  });
});




const PORT = process.env.PORT || 5000;

// Connect Database and launch server
const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(`🚀 Dukaan Sahayak Server running on port ${PORT}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API Base: http://localhost:${PORT}/api`);
      console.log(`===============================================`);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      console.error('CRITICAL: UNHANDLED REJECTION! Closing server...', err);
      server.close(() => {
        process.exit(1);
      });
    });

    // Graceful shutdown on SIGTERM / SIGINT
    const handleShutdown = (signal) => {
      console.log(`Received ${signal}. Shutting down gracefully...`);
      server.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));
  } catch (error) {
    console.error('Failed to start Dukaan Sahayak server:', error.message);
    process.exit(1);
  }
};

startServer();
