import { ApiCrawler } from '../crawlers/ApiCrawler';
import { CrawlerFactory } from '../crawlers/CrawlerFactory';
import { DynamicCrawler } from '../crawlers/DynamicCrawler';
import { StaticCrawler } from '../crawlers/StaticCrawler';
import { Platform } from '../types';

const createPlatform = (
  id: string,
  type: Platform['config']['type'],
  overrides: Partial<Platform> = {}
): Platform => ({
  id,
  name: `${id} platform`,
  iconUrl: `/icons/${id}.svg`,
  enabled: true,
  config: {
    type,
    url: `https://example.com/${id}`,
    selector: type === 'static' ? '.item' : undefined,
    apiConfig:
      type === 'api'
        ? {
            endpoint: `https://example.com/${id}/api`,
            method: 'GET',
            dataPath: '$.items',
          }
        : undefined,
    parser: {
      title: 'title',
      url: 'url',
    },
  },
  ...overrides,
});

describe('CrawlerFactory', () => {
  it('creates the crawler implementation that matches the platform config type', () => {
    expect(CrawlerFactory.createCrawler(createPlatform('static-news', 'static'))).toBeInstanceOf(
      StaticCrawler
    );
    expect(CrawlerFactory.createCrawler(createPlatform('dynamic-news', 'dynamic'))).toBeInstanceOf(
      DynamicCrawler
    );
    expect(CrawlerFactory.createCrawler(createPlatform('api-news', 'api'))).toBeInstanceOf(
      ApiCrawler
    );
  });

  it('rejects unknown crawler types with the raw type value for config diagnostics', () => {
    const brokenPlatform = createPlatform('broken-news', 'static', {
      config: {
        ...createPlatform('broken-news', 'static').config,
        type: 'rss' as Platform['config']['type'],
      },
    });

    expect(() => CrawlerFactory.createCrawler(brokenPlatform)).toThrow('Unknown crawler type: rss');
  });

  it('creates crawlers only for enabled platforms and skips invalid enabled configs', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    const crawlers = CrawlerFactory.createCrawlers([
      createPlatform('enabled-static', 'static'),
      createPlatform('disabled-api', 'api', { enabled: false }),
      createPlatform('enabled-api', 'api'),
      createPlatform('bad-enabled', 'static', {
        config: {
          ...createPlatform('bad-enabled', 'static').config,
          type: 'rss' as Platform['config']['type'],
        },
      }),
    ]);

    expect(crawlers).toHaveLength(2);
    expect(crawlers[0]).toBeInstanceOf(StaticCrawler);
    expect(crawlers[1]).toBeInstanceOf(ApiCrawler);
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to create crawler for platform bad-enabled platform:',
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });
});
