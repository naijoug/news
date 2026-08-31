import type { Platform } from '../types';

jest.mock('../utils/database', () => ({
  initializeDatabase: jest.fn(),
}));

jest.mock('../services/PlatformImportService', () => ({
  importPlatformConfig: jest.fn(),
  loadPlatformConfig: jest.fn(),
  resolvePlatformConfigPath: jest.fn(),
}));

import { initializeDatabase } from '../utils/database';
import {
  importPlatformConfig,
  loadPlatformConfig,
  resolvePlatformConfigPath,
} from '../services/PlatformImportService';
import { importPlatforms } from '../scripts/importPlatforms';
import { validatePlatformConfig } from '../scripts/validatePlatformConfig';

const mockInitializeDatabase = initializeDatabase as jest.MockedFunction<typeof initializeDatabase>;
const mockResolvePlatformConfigPath = resolvePlatformConfigPath as jest.MockedFunction<
  typeof resolvePlatformConfigPath
>;
const mockLoadPlatformConfig = loadPlatformConfig as jest.MockedFunction<typeof loadPlatformConfig>;
const mockImportPlatformConfig = importPlatformConfig as jest.MockedFunction<
  typeof importPlatformConfig
>;

const makePlatform = (id: string): Platform => ({
  id,
  name: `${id} platform`,
  iconUrl: `/icons/${id}.svg`,
  enabled: true,
  config: {
    type: 'static',
    url: `https://example.com/${id}`,
    selector: '.item',
    parser: {
      title: '.title',
      url: '.title a',
    },
  },
});

describe('platform scripts', () => {
  let exitSpy: jest.SpyInstance<never, [code?: string | number | null | undefined]>;
  let consoleLogSpy: jest.SpyInstance<void, Parameters<typeof console.log>>;
  let consoleErrorSpy: jest.SpyInstance<void, Parameters<typeof console.error>>;

  beforeEach(() => {
    jest.clearAllMocks();
    exitSpy = jest
      .spyOn(process, 'exit')
      .mockImplementation((_code?: string | number | null) => undefined as never);
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    exitSpy.mockRestore();
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('exits 0 after importing all configured platforms without skips', async () => {
    const platforms = [makePlatform('hacker-news'), makePlatform('reddit')];
    mockInitializeDatabase.mockResolvedValue(undefined);
    mockResolvePlatformConfigPath.mockReturnValue('/tmp/platforms.json');
    mockLoadPlatformConfig.mockReturnValue(platforms);
    mockImportPlatformConfig.mockResolvedValue({
      total: platforms.length,
      imported: 1,
      updated: 1,
      skipped: 0,
    });

    await importPlatforms();

    expect(mockInitializeDatabase).toHaveBeenCalledTimes(1);
    expect(mockLoadPlatformConfig).toHaveBeenCalledWith('/tmp/platforms.json');
    expect(mockImportPlatformConfig).toHaveBeenCalledWith(undefined, platforms);
    expect(consoleLogSpy).toHaveBeenCalledWith('Platform import completed successfully');
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  it('exits 1 when platform import reports skipped rows', async () => {
    const platforms = [makePlatform('hacker-news'), makePlatform('broken')];
    mockInitializeDatabase.mockResolvedValue(undefined);
    mockResolvePlatformConfigPath.mockReturnValue('/tmp/platforms.json');
    mockLoadPlatformConfig.mockReturnValue(platforms);
    mockImportPlatformConfig.mockResolvedValue({
      total: platforms.length,
      imported: 1,
      updated: 0,
      skipped: 1,
    });

    await importPlatforms();

    expect(consoleLogSpy).toHaveBeenCalledWith('Skipped: 1');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('exits 1 and prints validation errors before importing platforms', async () => {
    mockInitializeDatabase.mockResolvedValue(undefined);
    mockResolvePlatformConfigPath.mockReturnValue('/tmp/platforms.json');
    mockLoadPlatformConfig.mockImplementation(() => {
      throw new Error('Platform configuration validation failed:\nbroken: Config url is required');
    });

    await importPlatforms();

    expect(mockImportPlatformConfig).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error importing platforms:',
      'Platform configuration validation failed:\nbroken: Config url is required'
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('validates platform config without initializing the database', () => {
    const platforms = [makePlatform('hacker-news')];
    mockResolvePlatformConfigPath.mockReturnValue('/tmp/platforms.json');
    mockLoadPlatformConfig.mockReturnValue(platforms);

    validatePlatformConfig();

    expect(mockInitializeDatabase).not.toHaveBeenCalled();
    expect(mockLoadPlatformConfig).toHaveBeenCalledWith('/tmp/platforms.json');
    expect(consoleLogSpy).toHaveBeenCalledWith('Configuration validation passed');
    expect(consoleLogSpy).toHaveBeenCalledWith('Total platforms: 1');
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  it('exits 1 when standalone platform config validation fails', () => {
    mockResolvePlatformConfigPath.mockReturnValue('/tmp/platforms.json');
    mockLoadPlatformConfig.mockImplementation(() => {
      throw new Error('Platform configuration validation failed:\nbroken: Platform id is required');
    });

    validatePlatformConfig();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Configuration validation failed:',
      'Platform configuration validation failed:\nbroken: Platform id is required'
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
