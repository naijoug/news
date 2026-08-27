import * as cron from 'node-cron';
import { NewsRepository } from '../repositories/NewsRepository';
import { CleanupService } from '../services/CleanupService';

jest.mock('node-cron', () => ({
  schedule: jest.fn(),
}));

type MockNewsRepository = Pick<NewsRepository, 'deleteOldNews'>;

const mockedCron = jest.mocked(cron);

function createMockRepository(): jest.Mocked<MockNewsRepository> {
  return {
    deleteOldNews: jest.fn(),
  };
}

describe('CleanupService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns deleted count and retention window for manual cleanup success', async () => {
    const newsRepo = createMockRepository();
    newsRepo.deleteOldNews.mockResolvedValue(3);
    const service = new CleanupService(newsRepo as unknown as NewsRepository, 14);

    const result = await service.runNow();

    expect(newsRepo.deleteOldNews).toHaveBeenCalledWith(14);
    expect(result).toEqual({
      success: true,
      deletedCount: 3,
      duration: expect.any(Number),
      daysKept: 14,
    });
    expect(result.duration).toBeGreaterThanOrEqual(0);
  });

  it('returns a failure result when repository cleanup rejects', async () => {
    const newsRepo = createMockRepository();
    newsRepo.deleteOldNews.mockRejectedValue(new Error('database locked'));
    const service = new CleanupService(newsRepo as unknown as NewsRepository, 5);

    await expect(service.runNow()).resolves.toMatchObject({
      success: false,
      deletedCount: 0,
      daysKept: 5,
      error: 'database locked',
    });
  });

  it('falls back to an unknown error message for non-Error rejections', async () => {
    const newsRepo = createMockRepository();
    newsRepo.deleteOldNews.mockRejectedValue('timeout');
    const service = new CleanupService(newsRepo as unknown as NewsRepository);

    await expect(service.runNow()).resolves.toMatchObject({
      success: false,
      deletedCount: 0,
      daysKept: 7,
      error: 'Unknown error',
    });
  });

  it('starts and stops a single scheduled cleanup job', () => {
    const newsRepo = createMockRepository();
    const stop = jest.fn();
    mockedCron.schedule.mockReturnValue({ stop } as unknown as cron.ScheduledTask);
    const service = new CleanupService(newsRepo as unknown as NewsRepository);

    service.start('*/5 * * * *');
    service.start('*/10 * * * *');

    expect(mockedCron.schedule).toHaveBeenCalledTimes(1);
    expect(mockedCron.schedule).toHaveBeenCalledWith('*/5 * * * *', expect.any(Function));
    expect(service.isRunning()).toBe(true);

    service.stop();

    expect(stop).toHaveBeenCalledTimes(1);
    expect(service.isRunning()).toBe(false);
  });
});
