import { getDatabase } from '../utils/database';
import { NewsItem, NewsFilter } from '../types';

export class NewsRepository {
  private db = getDatabase();

  /**
   * Save news items to database with deduplication based on URL
   */
  async saveNews(newsItems: NewsItem[]): Promise<void> {
    return new Promise((resolve, reject) => {
      if (newsItems.length === 0) {
        resolve();
        return;
      }

      const stmt = this.db.prepare(`
        INSERT OR IGNORE INTO news (title, url, platform_id, publish_time, hot_score, crawl_time)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      let completed = 0;
      let hasError = false;

      newsItems.forEach((item) => {
        stmt.run(
          item.title,
          item.url,
          item.platformId,
          item.publishTime.toISOString(),
          item.hotScore || null,
          item.crawlTime ? item.crawlTime.toISOString() : new Date().toISOString(),
          (err: Error | null) => {
            if (err && !hasError) {
              hasError = true;
              stmt.finalize();
              reject(err);
              return;
            }

            completed++;
            if (completed === newsItems.length) {
              stmt.finalize((finalizeErr: Error | null) => {
                if (finalizeErr) {
                  reject(finalizeErr);
                } else {
                  resolve();
                }
              });
            }
          }
        );
      });
    });
  }

  /**
   * Get news items with optional filters
   */
  async getNews(filters: NewsFilter = {}): Promise<NewsItem[]> {
    return new Promise((resolve, reject) => {
      const {
        platformIds,
        startTime,
        endTime,
        limit = 50,
        offset = 0,
      } = filters;

      let query = 'SELECT * FROM news WHERE 1=1';
      const params: any[] = [];

      if (platformIds && platformIds.length > 0) {
        const placeholders = platformIds.map(() => '?').join(',');
        query += ` AND platform_id IN (${placeholders})`;
        params.push(...platformIds);
      }

      if (startTime) {
        query += ' AND publish_time >= ?';
        params.push(startTime.toISOString());
      }

      if (endTime) {
        query += ' AND publish_time <= ?';
        params.push(endTime.toISOString());
      }

      query += ' ORDER BY publish_time DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      this.db.all(query, params, (err, rows: any[]) => {
        if (err) {
          reject(err);
          return;
        }

        const newsItems: NewsItem[] = rows.map((row) => ({
          id: row.id,
          title: row.title,
          url: row.url,
          platformId: row.platform_id,
          publishTime: new Date(row.publish_time),
          hotScore: row.hot_score,
          crawlTime: new Date(row.crawl_time),
        }));

        resolve(newsItems);
      });
    });
  }

  /**
   * Delete old news items
   */
  async deleteOldNews(daysToKeep: number): Promise<number> {
    return new Promise((resolve, reject) => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      this.db.run(
        'DELETE FROM news WHERE crawl_time < ?',
        [cutoffDate.toISOString()],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.changes);
          }
        }
      );
    });
  }

  /**
   * Get total count of news items with filters
   */
  async getNewsCount(filters: NewsFilter = {}): Promise<number> {
    return new Promise((resolve, reject) => {
      const { platformIds, startTime, endTime } = filters;

      let query = 'SELECT COUNT(*) as count FROM news WHERE 1=1';
      const params: any[] = [];

      if (platformIds && platformIds.length > 0) {
        const placeholders = platformIds.map(() => '?').join(',');
        query += ` AND platform_id IN (${placeholders})`;
        params.push(...platformIds);
      }

      if (startTime) {
        query += ' AND publish_time >= ?';
        params.push(startTime.toISOString());
      }

      if (endTime) {
        query += ' AND publish_time <= ?';
        params.push(endTime.toISOString());
      }

      this.db.get(query, params, (err, row: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(row.count);
        }
      });
    });
  }
}
