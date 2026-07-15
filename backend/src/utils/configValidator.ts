type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export class ConfigValidator {
  /**
   * Validate platform configuration
   */
  static validatePlatform(platform: unknown): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!isRecord(platform)) {
      return {
        valid: false,
        errors: ['Platform must be an object'],
      };
    }

    // Check required fields
    if (!platform.id || typeof platform.id !== 'string') {
      errors.push('Platform id is required and must be a string');
    }

    if (!platform.name || typeof platform.name !== 'string') {
      errors.push('Platform name is required and must be a string');
    }

    if (!platform.iconUrl || typeof platform.iconUrl !== 'string') {
      errors.push('Platform iconUrl is required and must be a string');
    }

    if (typeof platform.enabled !== 'boolean') {
      errors.push('Platform enabled must be a boolean');
    }

    if (!platform.config) {
      errors.push('Platform config is required');
    } else {
      const configErrors = this.validateCrawlerConfig(platform.config);
      errors.push(...configErrors);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate crawler configuration
   */
  static validateCrawlerConfig(config: unknown): string[] {
    const errors: string[] = [];

    if (!isRecord(config)) {
      return ['Config must be an object'];
    }

    // Check type
    if (!['static', 'dynamic', 'api'].includes(String(config.type))) {
      errors.push('Config type must be one of: static, dynamic, api');
    }

    // Check URL
    if (!config.url || typeof config.url !== 'string') {
      errors.push('Config url is required and must be a string');
    }

    // Validate based on type
    if (config.type === 'static' || config.type === 'dynamic') {
      if (!config.selector || typeof config.selector !== 'string') {
        errors.push(`Config selector is required for ${config.type} type`);
      }
    }

    if (config.type === 'api') {
      if (!config.apiConfig) {
        errors.push('Config apiConfig is required for api type');
      } else if (!isRecord(config.apiConfig)) {
        errors.push('Config apiConfig must be an object');
      } else {
        if (!config.apiConfig.endpoint || typeof config.apiConfig.endpoint !== 'string') {
          errors.push('apiConfig.endpoint is required and must be a string');
        }

        if (!['GET', 'POST'].includes(String(config.apiConfig.method))) {
          errors.push('apiConfig.method must be GET or POST');
        }

        if (!config.apiConfig.dataPath || typeof config.apiConfig.dataPath !== 'string') {
          errors.push('apiConfig.dataPath is required and must be a string');
        }
      }
    }

    // Check parser
    if (!config.parser) {
      errors.push('Config parser is required');
    } else if (!isRecord(config.parser)) {
      errors.push('Config parser must be an object');
    } else {
      if (!config.parser.title || typeof config.parser.title !== 'string') {
        errors.push('parser.title is required and must be a string');
      }

      if (!config.parser.url || typeof config.parser.url !== 'string') {
        errors.push('parser.url is required and must be a string');
      }
    }

    // Check optional numeric fields
    if (config.timeout !== undefined && typeof config.timeout !== 'number') {
      errors.push('Config timeout must be a number');
    }

    if (config.rateLimit !== undefined && typeof config.rateLimit !== 'number') {
      errors.push('Config rateLimit must be a number');
    }

    return errors;
  }

  /**
   * Validate array of platforms
   */
  static validatePlatforms(platforms: unknown): {
    valid: boolean;
    errors: Record<string, string[]>;
  } {
    if (!Array.isArray(platforms)) {
      return {
        valid: false,
        errors: { _general: ['Platforms must be an array'] },
      };
    }

    const allErrors: Record<string, string[]> = {};
    let hasErrors = false;

    platforms.forEach((platform, index) => {
      const result = this.validatePlatform(platform);
      if (!result.valid) {
        hasErrors = true;
        const platformId =
          isRecord(platform) && typeof platform.id === 'string' ? platform.id : `platform_${index}`;
        allErrors[platformId] = result.errors;
      }
    });

    return {
      valid: !hasErrors,
      errors: allErrors,
    };
  }
}
