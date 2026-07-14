import fs from 'fs';
import path from 'path';
import { PlatformRepository } from '../repositories/PlatformRepository';
import { ConfigValidator } from '../utils/configValidator';
import { Platform } from '../types';

export interface PlatformImportResult {
  total: number;
  imported: number;
  updated: number;
  skipped: number;
}

export const resolvePlatformConfigPath = (): string => {
  const candidates = [
    process.env.PLATFORMS_CONFIG_PATH,
    path.join(__dirname, '../config/platforms.json'),
    path.join(process.cwd(), 'src/config/platforms.json'),
    path.join(process.cwd(), 'backend/src/config/platforms.json'),
  ].filter(Boolean) as string[];

  const configPath = candidates.find(candidate => fs.existsSync(candidate));

  if (!configPath) {
    throw new Error(`Platform config not found. Checked: ${candidates.join(', ')}`);
  }

  return configPath;
};

export const loadPlatformConfig = (configPath = resolvePlatformConfigPath()): Platform[] => {
  const configData = fs.readFileSync(configPath, 'utf-8');
  const platforms = JSON.parse(configData);
  const validation = ConfigValidator.validatePlatforms(platforms);

  if (!validation.valid) {
    const details = Object.entries(validation.errors)
      .map(([platformId, errors]) => `${platformId}: ${errors.join('; ')}`)
      .join('\n');
    throw new Error(`Platform configuration validation failed:\n${details}`);
  }

  return platforms as Platform[];
};

export const importPlatformConfig = async (
  platformRepo = new PlatformRepository(),
  platforms = loadPlatformConfig()
): Promise<PlatformImportResult> => {
  let imported = 0;
  let updated = 0;
  let skipped = 0;

  for (const platform of platforms) {
    try {
      const exists = await platformRepo.platformExists(platform.id);

      if (exists) {
        await platformRepo.updatePlatform(platform.id, {
          name: platform.name,
          iconUrl: platform.iconUrl,
          enabled: platform.enabled,
          config: platform.config,
        });
        updated++;
      } else {
        await platformRepo.createPlatform(platform);
        imported++;
      }
    } catch (error) {
      skipped++;
      console.error(
        `Failed to import platform ${platform.name} (${platform.id}):`,
        error instanceof Error ? error.message : error
      );
    }
  }

  return {
    total: platforms.length,
    imported,
    updated,
    skipped,
  };
};
