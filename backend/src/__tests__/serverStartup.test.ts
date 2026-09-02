jest.mock('../utils/database', () => ({
  initializeDatabase: jest.fn(),
}));

jest.mock('../services/PlatformImportService', () => ({
  importPlatformConfig: jest.fn(),
}));

jest.mock('../routes', () => {
  const express = jest.requireActual('express');
  return express.Router();
});

jest.mock('../routes/crawl', () => ({
  scheduler: {
    start: jest.fn(),
  },
}));

jest.mock('../repositories/NewsRepository', () => ({
  NewsRepository: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('../services/CleanupService', () => ({
  CleanupService: jest.fn().mockImplementation(() => ({
    start: jest.fn(),
  })),
}));

import { initializeDatabase } from '../utils/database';
import { importPlatformConfig } from '../services/PlatformImportService';
import { scheduler } from '../routes/crawl';
import { CleanupService } from '../services/CleanupService';
import app, { startServer } from '../index';

const mockInitializeDatabase = initializeDatabase as jest.MockedFunction<typeof initializeDatabase>;
const mockImportPlatformConfig = importPlatformConfig as jest.MockedFunction<
  typeof importPlatformConfig
>;
const mockScheduler = scheduler as jest.Mocked<typeof scheduler>;
const MockCleanupService = CleanupService as jest.MockedClass<typeof CleanupService>;

describe('server startup', () => {
  const originalPort = process.env.PORT;
  const originalCrawlSchedule = process.env.CRAWL_SCHEDULE;
  const originalDaysToKeep = process.env.DAYS_TO_KEEP;
  let listenSpy: jest.SpyInstance;
  let exitSpy: jest.SpyInstance<never, [code?: string | number | null | undefined]>;
  let consoleLogSpy: jest.SpyInstance<void, Parameters<typeof console.log>>;
  let consoleErrorSpy: jest.SpyInstance<void, Parameters<typeof console.error>>;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.PORT = '4321';
    process.env.CRAWL_SCHEDULE = '*/15 * * * *';
    process.env.DAYS_TO_KEEP = '14';

    listenSpy = jest.spyOn(app, 'listen').mockImplementation(((
      _port: number | string,
      callback?: () => void
    ) => {
      callback?.();
      return {};
    }) as typeof app.listen);
    exitSpy = jest
      .spyOn(process, 'exit')
      .mockImplementation((_code?: string | number | null) => undefined as never);
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    process.env.PORT = originalPort;
    process.env.CRAWL_SCHEDULE = originalCrawlSchedule;
    process.env.DAYS_TO_KEEP = originalDaysToKeep;
    listenSpy.mockRestore();
    exitSpy.mockRestore();
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('seeds platforms before starting schedulers and listening', async () => {
    mockInitializeDatabase.mockResolvedValue(undefined);
    mockImportPlatformConfig.mockResolvedValue({
      total: 2,
      imported: 1,
      updated: 1,
      skipped: 0,
    });

    await startServer();

    expect(mockInitializeDatabase).toHaveBeenCalledTimes(1);
    expect(mockImportPlatformConfig).toHaveBeenCalledTimes(1);
    expect(mockScheduler.start).toHaveBeenCalledWith('*/15 * * * *');
    expect(MockCleanupService).toHaveBeenCalledWith(expect.anything(), 14);
    expect(MockCleanupService.mock.results[0]?.value.start).toHaveBeenCalledTimes(1);
    expect(listenSpy).toHaveBeenCalledWith('4321', expect.any(Function));
    expect(consoleLogSpy).toHaveBeenCalledWith('Server running on port 4321');
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('exits before starting background work when platform import skips rows', async () => {
    mockInitializeDatabase.mockResolvedValue(undefined);
    mockImportPlatformConfig.mockResolvedValue({
      total: 2,
      imported: 1,
      updated: 0,
      skipped: 1,
    });

    await startServer();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to initialize database:',
      expect.objectContaining({ message: 'Failed to import 1 platform configuration(s)' })
    );
    expect(mockScheduler.start).not.toHaveBeenCalled();
    expect(MockCleanupService).not.toHaveBeenCalled();
    expect(listenSpy).not.toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('exits without importing platforms when database initialization fails', async () => {
    const dbError = new Error('database unavailable');
    mockInitializeDatabase.mockRejectedValue(dbError);

    await startServer();

    expect(mockImportPlatformConfig).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to initialize database:', dbError);
    expect(mockScheduler.start).not.toHaveBeenCalled();
    expect(listenSpy).not.toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
