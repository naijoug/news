import * as cron from 'node-cron';
import { NewsRepository } from '../repositories/NewsRepository';

/**
 * Service for cleaning up old data
 */
export class CleanupService {
  private newsRepo: NewsRepository;
  private cronJob: cron.ScheduledTask | null = null;
  private daysToKeep: number;

  constructor(newsRepo: NewsRepository, daysToKeep: number = 7) {
    this.newsRepo = newsRepo;
    this.daysToKeep = daysToKeep;
  }

  /**
   * Start the cleanup scheduler
   * Default: Run at 2:00 AM every day
   */
  start(schedule: string = '0 2 * * *'): void {
    if (this.cronJob) {
      this.log('Cleanup service is already running');
      return;
    }

    this.log(`Starting cleanup service with schedule: ${schedule}`);
    this.log(`Will keep news for ${this.daysToKeep} days`);

    this.cronJob = cron.schedule(schedule, async () => {
      await this.cleanup();
    });

    this.log('Cleanup service started successfully');
  }

  /**
   * Stop the cleanup scheduler
   */
  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      this.log('Cleanup service stopped');
    }
  }

  /**
   * Manually trigger cleanup
   */
  async runNow(): Promise<CleanupResult> {
    this.log('Manual cleanup triggered');
    return await this.cleanup();
  }

  /**
   * Perform cleanup
   */
  private async cleanup(): Promise<CleanupResult> {
    const startTime = Date.now();
    this.log('Starting cleanup execution');

    try {
      const deletedCount = await this.newsRepo.deleteOldNews(this.daysToKeep);
      const duration = Date.now() - startTime;

      this.log(`Cleanup completed: ${deletedCount} items deleted in ${duration}ms`);

      return {
        success: true,
        deletedCount,
        duration,
        daysKept: this.daysToKeep,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      this.log(`Cleanup failed: ${errorMessage}`);

      return {
        success: false,
        deletedCount: 0,
        duration,
        daysKept: this.daysToKeep,
        error: errorMessage,
      };
    }
  }

  /**
   * Log with timestamp
   */
  private log(message: string): void {
    console.log(`[${new Date().toISOString()}] [CleanupService] ${message}`);
  }

  /**
   * Check if cleanup service is running
   */
  isRunning(): boolean {
    return this.cronJob !== null;
  }
}

/**
 * Cleanup result
 */
export interface CleanupResult {
  success: boolean;
  deletedCount: number;
  duration: number;
  daysKept: number;
  error?: string;
}
