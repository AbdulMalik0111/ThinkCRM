import dotenv from 'dotenv';
dotenv.config();

import app from './src/app.js';
import { connectDB } from './src/config/database.js';
import { logger } from './src/utils/logger.js';
import { startJobs } from './src/jobs/index.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      startJobs();
      logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(
          `Port ${PORT} is already in use. Stop the other server or set a different PORT in the environment.`
        );
      } else {
        logger.error({ err: error }, 'Failed to start HTTP server');
      }

      process.exit(1);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  // Do not exit in production for all rejections, but consider graceful shutdown
});
