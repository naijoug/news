import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '../../data/news.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Create database connection
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    throw err;
  }
  console.log('Connected to SQLite database');
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

/**
 * Initialize database tables and indexes
 */
export const initializeDatabase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create platforms table
      db.run(`
        CREATE TABLE IF NOT EXISTS platforms (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          icon_url TEXT NOT NULL,
          enabled BOOLEAN DEFAULT 1,
          config TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Error creating platforms table:', err.message);
          reject(err);
          return;
        }
        console.log('Platforms table created or already exists');
      });

      // Create news table
      db.run(`
        CREATE TABLE IF NOT EXISTS news (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          url TEXT NOT NULL UNIQUE,
          platform_id TEXT NOT NULL,
          publish_time DATETIME NOT NULL,
          hot_score INTEGER,
          crawl_time DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (platform_id) REFERENCES platforms(id)
        )
      `, (err) => {
        if (err) {
          console.error('Error creating news table:', err.message);
          reject(err);
          return;
        }
        console.log('News table created or already exists');
      });

      // Create indexes for optimized queries
      db.run(`
        CREATE INDEX IF NOT EXISTS idx_platform_time 
        ON news(platform_id, publish_time DESC)
      `, (err) => {
        if (err) {
          console.error('Error creating idx_platform_time:', err.message);
        } else {
          console.log('Index idx_platform_time created or already exists');
        }
      });

      db.run(`
        CREATE INDEX IF NOT EXISTS idx_crawl_time 
        ON news(crawl_time DESC)
      `, (err) => {
        if (err) {
          console.error('Error creating idx_crawl_time:', err.message);
          reject(err);
        } else {
          console.log('Index idx_crawl_time created or already exists');
          resolve();
        }
      });
    });
  });
};

/**
 * Get database instance
 */
export const getDatabase = (): sqlite3.Database => {
  return db;
};

/**
 * Close database connection
 */
export const closeDatabase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
        reject(err);
      } else {
        console.log('Database connection closed');
        resolve();
      }
    });
  });
};

export default db;
