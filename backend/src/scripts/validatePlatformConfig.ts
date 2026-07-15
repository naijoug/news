import { loadPlatformConfig, resolvePlatformConfigPath } from '../services/PlatformImportService';

/**
 * Validate platforms.json without touching the database.
 */
function validatePlatformConfig() {
  try {
    const configPath = resolvePlatformConfigPath();
    console.log(`Validating platform configuration from ${configPath}`);

    const platforms = loadPlatformConfig(configPath);

    console.log('Configuration validation passed');
    console.log(`Total platforms: ${platforms.length}`);
    process.exit(0);
  } catch (error: any) {
    console.error('Configuration validation failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  validatePlatformConfig();
}

export { validatePlatformConfig };
