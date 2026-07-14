# Data Access Layer

This directory contains repository classes for database operations.

## NewsRepository

Handles all news-related database operations:

- `saveNews(newsItems)` - Save news items with automatic deduplication based on URL
- `getNews(filters)` - Retrieve news with optional filtering by platform, time range, and pagination
- `deleteOldNews(daysToKeep)` - Remove news older than specified days
- `getNewsCount(filters)` - Get total count of news items matching filters

## PlatformRepository

Handles all platform-related database operations:

- `createPlatform(platform)` - Create a new platform
- `getAllPlatforms(enabledOnly)` - Get all platforms, optionally filtered by enabled status
- `getPlatformById(id)` - Get a specific platform by ID
- `updatePlatform(id, platform)` - Update platform configuration
- `deletePlatform(id)` - Delete a platform
- `platformExists(id)` - Check if a platform exists

## Usage Example

```typescript
import { NewsRepository } from './repositories/NewsRepository';
import { PlatformRepository } from './repositories/PlatformRepository';

// Get all enabled platforms
const platformRepo = new PlatformRepository();
const platforms = await platformRepo.getAllPlatforms(true);

// Save news items
const newsRepo = new NewsRepository();
await newsRepo.saveNews([
  {
    title: 'Example News',
    url: 'https://example.com/news/1',
    platformId: 'weibo',
    publishTime: new Date(),
    hotScore: 1000,
  },
]);

// Get recent news
const news = await newsRepo.getNews({
  platformIds: ['weibo', 'zhihu'],
  limit: 20,
  offset: 0,
});
```

## Platform Configuration

To import or update platform configurations:

```bash
npm run import-platforms --workspace=backend
```

Platform configurations are stored in `src/config/platforms.json`.
