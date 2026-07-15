import { initializeDatabase } from '../utils/database';
import {
  importPlatformConfig,
  loadPlatformConfig,
  resolvePlatformConfigPath,
} from '../services/PlatformImportService';

/**
 * Import platforms from JSON configuration file
 */
async function importPlatforms() {
  try {
    console.log('Starting platform import...');

    // Initialize database
    await initializeDatabase();
    console.log('Database initialized');

    // Read and validate platforms configuration
    const configPath = resolvePlatformConfigPath();
    console.log(`Reading platform configuration from ${configPath}`);
    const platforms = loadPlatformConfig(configPath);
    console.log('Configuration validation passed');

    // Import platforms
    const { imported, updated, skipped } = await importPlatformConfig(undefined, platforms);

    console.log('\n=== Import Summary ===');
    console.log(`Total platforms: ${platforms.length}`);
    console.log(`Imported: ${imported}`);
    console.log(`Updated: ${updated}`);
    console.log(`Skipped: ${skipped}`);
    console.log('Platform import completed successfully');

    process.exit(skipped > 0 ? 1 : 0);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error importing platforms:', message);
    process.exit(1);
  }
}

// Run import if executed directly
if (require.main === module) {
  importPlatforms();
}

export { importPlatforms };
