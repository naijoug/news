import { ICrawler } from './ICrawler';
import { Platform } from '../types';
import { StaticCrawler } from './StaticCrawler';
import { DynamicCrawler } from './DynamicCrawler';
import { ApiCrawler } from './ApiCrawler';

/**
 * Factory class for creating crawler instances based on platform configuration
 */
export class CrawlerFactory {
  /**
   * Create a crawler instance for the given platform
   */
  static createCrawler(platform: Platform): ICrawler {
    const { id, name, config } = platform;

    switch (config.type) {
      case 'static':
        return new StaticCrawler(id, name, config);
      
      case 'dynamic':
        return new DynamicCrawler(id, name, config);
      
      case 'api':
        return new ApiCrawler(id, name, config);
      
      default:
        throw new Error(`Unknown crawler type: ${(config as any).type}`);
    }
  }

  /**
   * Create crawlers for multiple platforms
   */
  static createCrawlers(platforms: Platform[]): ICrawler[] {
    return platforms
      .filter(platform => platform.enabled)
      .map(platform => {
        try {
          return CrawlerFactory.createCrawler(platform);
        } catch (error) {
          console.error(`Failed to create crawler for platform ${platform.name}:`, error);
          return null;
        }
      })
      .filter((crawler): crawler is ICrawler => crawler !== null);
  }
}
