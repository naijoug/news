import { getDatabase } from '../utils/database';
import { Platform } from '../types';

export class PlatformRepository {
  private db = getDatabase();

  /**
   * Create a new platform
   */
  async createPlatform(platform: Platform): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO platforms (id, name, icon_url, enabled, config, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          platform.id,
          platform.name,
          platform.iconUrl,
          platform.enabled ? 1 : 0,
          JSON.stringify(platform.config),
          new Date().toISOString(),
          new Date().toISOString(),
        ],
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  /**
   * Get all platforms
   */
  async getAllPlatforms(enabledOnly: boolean = false): Promise<Platform[]> {
    return new Promise((resolve, reject) => {
      let query = 'SELECT * FROM platforms';
      if (enabledOnly) {
        query += ' WHERE enabled = 1';
      }
      query += ' ORDER BY name';

      this.db.all(query, [], (err, rows: any[]) => {
        if (err) {
          reject(err);
          return;
        }

        const platforms: Platform[] = rows.map((row) => ({
          id: row.id,
          name: row.name,
          iconUrl: row.icon_url,
          enabled: row.enabled === 1,
          config: JSON.parse(row.config),
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at),
        }));

        resolve(platforms);
      });
    });
  }

  /**
   * Get platform by ID
   */
  async getPlatformById(id: string): Promise<Platform | null> {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM platforms WHERE id = ?',
        [id],
        (err, row: any) => {
          if (err) {
            reject(err);
            return;
          }

          if (!row) {
            resolve(null);
            return;
          }

          const platform: Platform = {
            id: row.id,
            name: row.name,
            iconUrl: row.icon_url,
            enabled: row.enabled === 1,
            config: JSON.parse(row.config),
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
          };

          resolve(platform);
        }
      );
    });
  }

  /**
   * Update platform
   */
  async updatePlatform(id: string, platform: Partial<Platform>): Promise<void> {
    return new Promise((resolve, reject) => {
      const updates: string[] = [];
      const params: any[] = [];

      if (platform.name !== undefined) {
        updates.push('name = ?');
        params.push(platform.name);
      }

      if (platform.iconUrl !== undefined) {
        updates.push('icon_url = ?');
        params.push(platform.iconUrl);
      }

      if (platform.enabled !== undefined) {
        updates.push('enabled = ?');
        params.push(platform.enabled ? 1 : 0);
      }

      if (platform.config !== undefined) {
        updates.push('config = ?');
        params.push(JSON.stringify(platform.config));
      }

      updates.push('updated_at = ?');
      params.push(new Date().toISOString());

      params.push(id);

      this.db.run(
        `UPDATE platforms SET ${updates.join(', ')} WHERE id = ?`,
        params,
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  /**
   * Delete platform
   */
  async deletePlatform(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM platforms WHERE id = ?', [id], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Check if platform exists
   */
  async platformExists(id: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT COUNT(*) as count FROM platforms WHERE id = ?',
        [id],
        (err, row: any) => {
          if (err) {
            reject(err);
          } else {
            resolve(row.count > 0);
          }
        }
      );
    });
  }
}
