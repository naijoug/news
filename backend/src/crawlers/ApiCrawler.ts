import axios from 'axios';
import { BaseCrawler } from './BaseCrawler';
import { NewsItem } from '../types';
import { DataExtractor } from './utils/DataExtractor';

/**
 * Crawler for platforms that provide REST API or GraphQL endpoints
 */
export class ApiCrawler extends BaseCrawler {
  /**
   * Fetch data from API endpoint
   */
  protected async fetch(): Promise<any> {
    if (!this.config.apiConfig) {
      throw new Error('API config is required for API crawler');
    }

    const { endpoint, method, headers, params, body } = this.config.apiConfig;

    const response = await axios({
      url: endpoint,
      method,
      headers: headers || {},
      params: params || {},
      data: body,
      timeout: this.getTimeout(),
    });

    return response.data;
  }

  /**
   * Parse API response and extract items array
   */
  protected async parse(data: any): Promise<any[]> {
    if (!this.config.apiConfig) {
      throw new Error('API config is required');
    }

    const { dataPath } = this.config.apiConfig;
    
    // Extract items array using JSONPath
    const items = DataExtractor.extractWithJsonPath(data, dataPath);
    
    if (!Array.isArray(items)) {
      this.log(`Warning: dataPath "${dataPath}" did not return an array`);
      return [];
    }

    // Handle special case: itemEndpoint for fetching individual items
    if (this.config.parser.itemEndpoint) {
      return await this.fetchIndividualItems(items);
    }

    return items;
  }

  /**
   * Fetch individual items when itemEndpoint is specified
   * Used for APIs like Hacker News that return IDs first
   */
  private async fetchIndividualItems(ids: any[]): Promise<any[]> {
    const itemEndpoint = this.config.parser.itemEndpoint!;
    const items: any[] = [];
    
    // Limit to first 30 items to avoid too many requests
    const limitedIds = ids.slice(0, 30);
    
    // Apply rate limiting if configured
    const rateLimit = this.config.rateLimit || 0;
    
    for (const id of limitedIds) {
      try {
        const url = itemEndpoint.replace('{{id}}', String(id));
        const response = await axios.get(url, {
          timeout: this.getTimeout(),
        });
        
        if (response.data) {
          items.push(response.data);
        }
        
        // Rate limiting
        if (rateLimit > 0) {
          await this.sleep(rateLimit);
        }
      } catch (error) {
        this.log(`Failed to fetch item ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    return items;
  }

  /**
   * Transform API response item into NewsItem
   */
  protected transformItem(item: any): Omit<NewsItem, 'platformId' | 'crawlTime'> {
    const parser = this.config.parser;

    // Extract title
    const title = DataExtractor.extractNestedField(item, parser.title);
    if (!title || typeof title !== 'string') {
      throw new Error('Failed to extract title');
    }

    // Extract URL
    let url = DataExtractor.extractNestedField(item, parser.url);
    if (!url || typeof url !== 'string') {
      throw new Error('Failed to extract URL');
    }
    url = DataExtractor.normalizeUrl(url);

    // Extract publish time (optional, default to now)
    let publishTime: Date;
    if (parser.time) {
      const timeValue = DataExtractor.extractNestedField(item, parser.time);
      const parsedTime = DataExtractor.parseDate(timeValue);
      publishTime = parsedTime || new Date();
    } else {
      publishTime = new Date();
    }

    // Extract hot score (optional)
    let hotScore: number | undefined;
    if (parser.hotScore) {
      const scoreValue = DataExtractor.extractNestedField(item, parser.hotScore);
      const parsedScore = DataExtractor.parseNumber(scoreValue);
      hotScore = parsedScore !== null ? parsedScore : undefined;
    }

    return {
      title: title.trim(),
      url,
      publishTime,
      hotScore,
    };
  }

  /**
   * Sleep utility for rate limiting
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
