# Crawler Module

This module implements a flexible, configuration-driven crawler system for aggregating news from multiple platforms.

## Architecture

The crawler system follows these design patterns:

- **Strategy Pattern**: Different crawler types (Static, Dynamic, API) for different platform needs
- **Template Method Pattern**: BaseCrawler defines the crawl workflow
- **Factory Pattern**: CrawlerFactory creates appropriate crawler instances
- **Error Isolation**: Individual platform failures don't affect other platforms

## Components

### Core Interfaces

- **ICrawler**: Interface that all crawlers must implement
- **BaseCrawler**: Abstract base class with common functionality

### Crawler Implementations

1. **StaticCrawler**: For static HTML pages using Cheerio
   - Uses CSS selectors to extract data
   - Supports attribute extraction (e.g., `a@href`)
   - Best for: Weibo, Baidu, V2EX

2. **ApiCrawler**: For REST APIs and GraphQL endpoints
   - Supports JSONPath for data extraction
   - Handles nested API responses
   - Supports rate limiting
   - Best for: GitHub, Hacker News, Product Hunt

3. **DynamicCrawler**: For JavaScript-rendered pages (requires Puppeteer)
   - Currently a placeholder
   - Install Puppeteer to enable: `npm install puppeteer @types/puppeteer`

### Utilities

- **DataExtractor**: Utility class for extracting and transforming data
  - CSS selector extraction
  - JSONPath extraction
  - Date parsing
  - Number parsing
  - URL normalization

### Scheduler

- **CrawlerScheduler**: Manages crawler execution
  - Cron-based scheduling
  - Manual trigger support
  - Concurrent execution with error isolation
  - Detailed logging and statistics

## Usage

### Running Crawlers Manually

```bash
npm run test-crawler
```

### Using in Code

```typescript
import { PlatformRepository } from './repositories/PlatformRepository';
import { NewsRepository } from './repositories/NewsRepository';
import { CrawlerScheduler } from './services/CrawlerScheduler';

// Initialize
const platformRepo = new PlatformRepository();
const newsRepo = new NewsRepository();
const scheduler = new CrawlerScheduler(platformRepo, newsRepo);

// Start scheduled crawling (8 AM and 8 PM daily)
scheduler.start('0 8,20 * * *');

// Or trigger manually
const result = await scheduler.runNow();
console.log(result);
```

## Configuration

Platforms are configured in the database with a JSON config structure. See `backend/src/config/platforms.json` for examples.

### Static Crawler Config Example

```json
{
  "type": "static",
  "url": "https://example.com/hot",
  "selector": ".news-item",
  "parser": {
    "title": ".title",
    "url": "a@href",
    "time": ".time",
    "hotScore": ".score"
  }
}
```

### API Crawler Config Example

```json
{
  "type": "api",
  "url": "https://api.example.com/trending",
  "apiConfig": {
    "endpoint": "https://api.example.com/trending",
    "method": "GET",
    "dataPath": "$.data.items"
  },
  "parser": {
    "title": "title",
    "url": "url",
    "time": "created_at",
    "hotScore": "score"
  }
}
```

## Error Handling

- Each crawler runs independently
- Errors are logged but don't stop other crawlers
- Failed crawls return empty arrays
- Detailed error messages in logs

## Testing

The test script demonstrates:
- Loading platforms from database
- Creating crawlers via factory
- Running crawlers concurrently
- Collecting and displaying results
- Error isolation

## Future Enhancements

- Implement DynamicCrawler with Puppeteer
- Add retry logic for failed requests
- Implement more sophisticated rate limiting
- Add proxy support for anti-scraping
- Cache responses to reduce load
