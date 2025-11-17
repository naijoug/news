import { PlatformRepository } from '../repositories/PlatformRepository';
import { NewsRepository } from '../repositories/NewsRepository';
import { CrawlerScheduler } from '../services/CrawlerScheduler';

/**
 * Test script to verify crawler implementation
 */
async function testCrawler() {
  console.log('=== Testing Crawler Implementation ===\n');

  try {
    // Initialize repositories
    const platformRepo = new PlatformRepository();
    const newsRepo = new NewsRepository();

    // Get all platforms
    const platforms = await platformRepo.getAllPlatforms(true);
    console.log(`Found ${platforms.length} enabled platforms:`);
    platforms.forEach(p => console.log(`  - ${p.name} (${p.id}) - Type: ${p.config.type}`));
    console.log();

    // Create scheduler
    const scheduler = new CrawlerScheduler(platformRepo, newsRepo);

    // Run crawlers manually
    console.log('Starting manual crawl...\n');
    const result = await scheduler.runNow();

    // Display results
    console.log('\n=== Crawl Results ===');
    console.log(`Success: ${result.success}`);
    console.log(`Message: ${result.message}`);
    
    if (result.statistics) {
      console.log('\nStatistics:');
      console.log(`  Total Platforms: ${result.statistics.totalPlatforms}`);
      console.log(`  Successful: ${result.statistics.successCount}`);
      console.log(`  Failed: ${result.statistics.failureCount}`);
      console.log(`  Total Items: ${result.statistics.totalItems}`);
      console.log(`  Duration: ${result.statistics.duration}ms`);
    }

    console.log('\nPer-Platform Results:');
    result.results.forEach(r => {
      const status = r.success ? '✓' : '✗';
      const items = r.success ? `${r.itemCount} items` : r.error;
      console.log(`  ${status} ${r.platformName}: ${items} (${r.duration}ms)`);
    });

    // Display some sample news
    console.log('\n=== Sample News Items ===');
    const news = await newsRepo.getNews({ limit: 5 });
    news.forEach((item, index) => {
      console.log(`\n${index + 1}. [${item.platformId}] ${item.title}`);
      console.log(`   URL: ${item.url}`);
      console.log(`   Time: ${item.publishTime.toISOString()}`);
      if (item.hotScore) {
        console.log(`   Score: ${item.hotScore}`);
      }
    });

    console.log('\n=== Test Completed ===');
    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

testCrawler();
