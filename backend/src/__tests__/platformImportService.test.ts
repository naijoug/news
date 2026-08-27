import fs from 'fs';
import os from 'os';
import path from 'path';
import type { PlatformRepository } from '../repositories/PlatformRepository';
import { Platform } from '../types';

jest.mock('../repositories/PlatformRepository', () => ({
  PlatformRepository: jest.fn(),
}));

import {
  importPlatformConfig,
  loadPlatformConfig,
  resolvePlatformConfigPath,
} from '../services/PlatformImportService';

const makePlatform = (id: string, overrides: Partial<Platform> = {}): Platform => ({
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
  ...overrides,
});

describe('PlatformImportService', () => {
  let tempDir: string;
  const originalConfigPath = process.env.PLATFORMS_CONFIG_PATH;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'platform-import-service-'));
    delete process.env.PLATFORMS_CONFIG_PATH;
  });

  afterEach(() => {
    if (originalConfigPath === undefined) {
      delete process.env.PLATFORMS_CONFIG_PATH;
    } else {
      process.env.PLATFORMS_CONFIG_PATH = originalConfigPath;
    }

    fs.rmSync(tempDir, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  const writeConfig = (filename: string, content: unknown): string => {
    const configPath = path.join(tempDir, filename);
    fs.writeFileSync(configPath, JSON.stringify(content), 'utf-8');
    return configPath;
  };

  it('resolves and loads a valid platform config from PLATFORMS_CONFIG_PATH', () => {
    const platforms = [makePlatform('hacker-news')];
    const configPath = writeConfig('platforms.json', platforms);
    process.env.PLATFORMS_CONFIG_PATH = configPath;

    expect(resolvePlatformConfigPath()).toBe(configPath);
    expect(loadPlatformConfig()).toEqual(platforms);
  });

  it('throws validation details when the platform config is invalid', () => {
    const configPath = writeConfig('invalid-platforms.json', [
      makePlatform('valid'),
      {
        id: 'broken',
        name: 'Broken',
        iconUrl: '/icons/broken.svg',
        enabled: true,
        config: {
          type: 'api',
          url: 'https://example.com/api',
          parser: {
            title: 'title',
            url: 'url',
          },
        },
      },
    ]);

    expect(() => loadPlatformConfig(configPath)).toThrow(
      'Platform configuration validation failed:\nbroken: Config apiConfig is required for api type'
    );
  });

  it('creates new platforms, updates existing platforms, and skips failed imports', async () => {
    const existingPlatform = makePlatform('existing', {
      enabled: false,
      config: {
        type: 'api',
        url: 'https://example.com/existing',
        apiConfig: {
          endpoint: '/items',
          method: 'GET',
          dataPath: 'items',
        },
        parser: {
          title: 'title',
          url: 'url',
        },
      },
    });
    const newPlatform = makePlatform('new');
    const failingPlatform = makePlatform('failing');
    const repo = {
      platformExists: jest
        .fn<Promise<boolean>, [string]>()
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(false),
      updatePlatform: jest.fn<Promise<void>, [string, Partial<Platform>]>().mockResolvedValue(),
      createPlatform: jest
        .fn<Promise<void>, [Platform]>()
        .mockResolvedValueOnce()
        .mockRejectedValueOnce(new Error('duplicate platform id')),
    };
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(
      importPlatformConfig(repo as unknown as PlatformRepository, [
        existingPlatform,
        newPlatform,
        failingPlatform,
      ])
    ).resolves.toEqual({
      total: 3,
      imported: 1,
      updated: 1,
      skipped: 1,
    });

    expect(repo.platformExists).toHaveBeenNthCalledWith(1, 'existing');
    expect(repo.platformExists).toHaveBeenNthCalledWith(2, 'new');
    expect(repo.platformExists).toHaveBeenNthCalledWith(3, 'failing');
    expect(repo.updatePlatform).toHaveBeenCalledWith('existing', {
      name: existingPlatform.name,
      iconUrl: existingPlatform.iconUrl,
      enabled: existingPlatform.enabled,
      config: existingPlatform.config,
    });
    expect(repo.createPlatform).toHaveBeenNthCalledWith(1, newPlatform);
    expect(repo.createPlatform).toHaveBeenNthCalledWith(2, failingPlatform);
    expect(consoleError).toHaveBeenCalledWith(
      'Failed to import platform failing platform (failing):',
      'duplicate platform id'
    );
  });
});
