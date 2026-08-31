import { ConfigValidator } from '../utils/configValidator';

describe('ConfigValidator', () => {
  const validStaticPlatform = {
    id: 'hacker-news',
    name: 'Hacker News',
    iconUrl: '/icons/hn.svg',
    enabled: true,
    config: {
      type: 'static',
      url: 'https://news.ycombinator.com',
      selector: '.athing',
      parser: {
        title: '.titleline a',
        url: '.titleline a',
      },
    },
  };

  it('accepts a valid static platform config', () => {
    const result = ConfigValidator.validatePlatform(validStaticPlatform);

    expect(result).toEqual({
      valid: true,
      errors: [],
    });
  });

  it('reports required platform and static crawler fields together', () => {
    const result = ConfigValidator.validatePlatform({
      id: '',
      name: 42,
      enabled: 'yes',
      config: {
        type: 'static',
        url: '',
        parser: {
          title: '',
        },
      },
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        'Platform id is required and must be a string',
        'Platform name is required and must be a string',
        'Platform iconUrl is required and must be a string',
        'Platform enabled must be a boolean',
        'Config url is required and must be a string',
        'Config selector is required for static type',
        'parser.title is required and must be a string',
        'parser.url is required and must be a string',
      ])
    );
  });

  it('validates api crawler-specific apiConfig fields', () => {
    const errors = ConfigValidator.validateCrawlerConfig({
      type: 'api',
      url: 'https://example.com/api',
      apiConfig: {
        endpoint: '',
        method: 'PATCH',
        dataPath: '',
      },
      parser: {
        title: 'title',
        url: 'url',
      },
      timeout: 'fast',
      rateLimit: 'slow',
    });

    expect(errors).toEqual(
      expect.arrayContaining([
        'apiConfig.endpoint is required and must be a string',
        'apiConfig.method must be GET or POST',
        'apiConfig.dataPath is required and must be a string',
        'Config timeout must be a number',
        'Config rateLimit must be a number',
      ])
    );
  });

  it('keys invalid platform arrays by platform id or fallback index', () => {
    const result = ConfigValidator.validatePlatforms([
      validStaticPlatform,
      {
        id: 'broken-api',
        name: 'Broken API',
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
      null,
    ]);

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual({
      'broken-api': ['Config apiConfig is required for api type'],
      platform_2: ['Platform must be an object'],
    });
  });

  it('rejects non-array platform collections', () => {
    expect(ConfigValidator.validatePlatforms({})).toEqual({
      valid: false,
      errors: { _general: ['Platforms must be an array'] },
    });
  });

  it('rejects duplicate platform ids before import-time overwrite ambiguity', () => {
    const result = ConfigValidator.validatePlatforms([
      validStaticPlatform,
      {
        ...validStaticPlatform,
        name: 'Duplicate Hacker News',
      },
    ]);

    expect(result).toEqual({
      valid: false,
      errors: {
        'hacker-news': ['Platform id must be unique'],
      },
    });
  });
});
