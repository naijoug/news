import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './utils/database';
import apiRoutes from './routes';
import { scheduler } from './routes/crawl';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { cacheMiddleware } from './middleware/cache';
import { timeoutMiddleware } from './middleware/timeout';
import { CleanupService } from './services/CleanupService';
import { NewsRepository } from './repositories/NewsRepository';
import { importPlatformConfig } from './services/PlatformImportService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(timeoutMiddleware(10000)); // 10 second timeout

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// API routes with cache
app.use('/api', cacheMiddleware, apiRoutes);

// Error handlers (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize database and start server
initializeDatabase()
  .then(async () => {
    console.log('Database initialized successfully');

    // Seed/update configured platforms on startup so a fresh Docker volume is usable immediately.
    const platformImport = await importPlatformConfig();
    if (platformImport.skipped > 0) {
      throw new Error(`Failed to import ${platformImport.skipped} platform configuration(s)`);
    }
    console.log(
      `Platform config ready: ${platformImport.imported} imported, ${platformImport.updated} updated, ${platformImport.skipped} skipped`
    );

    // Start crawler scheduler
    const crawlSchedule = process.env.CRAWL_SCHEDULE || '0 8,20 * * *';
    scheduler.start(crawlSchedule);
    console.log(`Crawler scheduler started with schedule: ${crawlSchedule}`);

    // Start cleanup service
    const newsRepo = new NewsRepository();
    const daysToKeep = parseInt(process.env.DAYS_TO_KEEP || '7', 10);
    const cleanupService = new CleanupService(newsRepo, daysToKeep);
    cleanupService.start();
    console.log(`Cleanup service started (keeping ${daysToKeep} days of data)`);

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(error => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  });

export default app;
