import fs from 'fs';
import path from 'path';
import { initializeDatabase } from '../utils/database';
import { PlatformRepository } from '../repositories/PlatformRepository';
import { ConfigValidator } from '../utils/configValidator';
import { Platform } from '../types';

/**
 * Import platforms from JSON configuration file
 */
async function importPlatforms() {
  try {
    console.log('Starting platform import...');

    // Initialize database
    await initializeDatabase();
    console.log('Database initialized');

    // Read platforms configuration
    const configPath = path.join(__dirname, '../config/platforms.json');
    const configData = fs.readFileSync(configPath, 'utf-8');
    const platforms = JSON.parse(configData);

    // Validate configuration
    console.log('Validating platform configurations...');
    const validation = ConfigValidator.validatePlatforms(platforms);

    if (!validation.valid) {
      console.error('Configuration validation failed:');
      Object.entries(validation.errors).forEach(([platformId, errors]) => {
        console.error(`\n${platformId}:`);
        errors.forEach((error) => console.error(`  - ${error}`));
      });
      process.exit(1);
    }

    console.log('Configuration validation passed');

    // Import platforms
    const platformRepo = new PlatformRepository();
    let imported = 0;
    let updated = 0;
    let skipped = 0;

    for (const platform of platforms) {
      try {
        const exists = await platformRepo.platformExists(platform.id);

        if (exists) {
          // Update existing platform
          await platformRepo.updatePlatform(platform.id, {
            name: platform.name,
            iconUrl: platform.iconUrl,
            enabled: platform.enabled,
            config: platform.config,
          });
          updated++;
          console.log(`✓ Updated platform: ${platform.name} (${platform.id})`);
        } else {
          // Create new platform
          await platformRepo.createPlatform(platform as Platform);
          imported++;
          console.log(`✓ Imported platform: ${platform.name} (${platform.id})`);
        }
      } catch (error: any) {
        console.error(`✗ Failed to import ${platform.name}: ${error.message}`);
        skipped++;
      }
    }

    console.log('\n=== Import Summary ===');
    console.log(`Total platforms: ${platforms.length}`);
    console.log(`Imported: ${imported}`);
    console.log(`Updated: ${updated}`);
    console.log(`Skipped: ${skipped}`);
    console.log('Platform import completed successfully');

    process.exit(0);
  } catch (error: any) {
    console.error('Error importing platforms:', error.message);
    process.exit(1);
  }
}

// Run import if executed directly
if (require.main === module) {
  importPlatforms();
}

export { importPlatforms };
