import { pool } from './db';
import type { Video, Collection, VideoCollection, DownloadTask, DownloadProgress } from '@shared/schema';

export interface IStorage {
  // Videos
  getVideo(id: number): Promise<Video | undefined>;
  getVideoByYouTubeId(videoId: string): Promise<Video | undefined>;
  getAllVideos(): Promise<Video[]>;
  createVideo(video: Omit<Video, 'id'>): Promise<Video>;
  updateVideo(id: number, video: Partial<Video>): Promise<Video | undefined>;
  deleteVideo(id: number): Promise<boolean>;
  
  // Collections
  getCollection(id: number): Promise<Collection | undefined>;
  getAllCollections(): Promise<Collection[]>;
  createCollection(collection: Omit<Collection, 'id' | 'createdAt' | 'updatedAt'>): Promise<Collection>;
  updateCollection(id: number, collection: Partial<Collection>): Promise<Collection | undefined>;
  deleteCollection(id: number): Promise<boolean>;
  
  // Video Collections
  getVideoCollections(collectionId: number): Promise<Video[]>;
  addVideoToCollection(videoId: number, collectionId: number): Promise<VideoCollection>;
  removeVideoFromCollection(videoId: number, collectionId: number): Promise<boolean>;
  
  // Download Tasks
  getDownloadTask(id: number): Promise<DownloadTask | undefined>;
  getActiveDownloadTasks(): Promise<DownloadTask[]>;
  getCompletedDownloadTasks(): Promise<DownloadTask[]>;
  createDownloadTask(task: Omit<DownloadTask, 'id' | 'status' | 'progress' | 'createdAt' | 'completedAt'>): Promise<DownloadTask>;
  updateDownloadTask(id: number, task: Partial<DownloadTask>): Promise<DownloadTask | undefined>;
  updateDownloadProgress(id: number, progress: Partial<DownloadProgress>): Promise<DownloadTask | undefined>;
  deleteDownloadTask(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // Videos
  async getVideo(id: number): Promise<Video | undefined> {
    const result = await pool.query('SELECT * FROM videos WHERE id = $1', [id]);
    return result.rows[0];
  }

  async getVideoByYouTubeId(videoId: string): Promise<Video | undefined> {
    const result = await pool.query('SELECT * FROM videos WHERE video_id = $1', [videoId]);
    return result.rows[0];
  }

  async getAllVideos(): Promise<Video[]> {
    const result = await pool.query('SELECT * FROM videos');
    return result.rows;
  }

  async createVideo(video: Omit<Video, 'id'>): Promise<Video> {
    const result = await pool.query(
      'INSERT INTO videos (video_id, title, description, channel_title, thumbnail_url, published_at, duration, view_count, download_path, format, quality, file_size, is_downloaded, is_watched, downloaded_at, metadata) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *',
      [video.videoId, video.title, video.description, video.channelTitle, video.thumbnailUrl, video.publishedAt, video.duration, video.viewCount, video.downloadPath, video.format, video.quality, video.fileSize, video.isDownloaded, video.isWatched, video.downloadedAt, video.metadata]
    );
    return result.rows[0];
  }

  async updateVideo(id: number, video: Partial<Video>): Promise<Video | undefined> {
    const keys = Object.keys(video);
    const values = Object.values(video);
    const setClause = keys.map((key, i) => `${key} = $${i + 2}`).join(', ');
    const result = await pool.query(
      `UPDATE videos SET ${setClause} WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    return result.rows[0];
  }

  async deleteVideo(id: number): Promise<boolean> {
    try {
      await pool.query('BEGIN');
      await pool.query('DELETE FROM video_collections WHERE video_id = $1', [id]);
      await pool.query('DELETE FROM videos WHERE id = $1', [id]);
      await pool.query('COMMIT');
      return true;
    } catch (error) {
      await pool.query('ROLLBACK');
      return false;
    }
  }

  // Collections
  async getCollection(id: number): Promise<Collection | undefined> {
    const result = await pool.query('SELECT * FROM collections WHERE id = $1', [id]);
    return result.rows[0];
  }

  async getAllCollections(): Promise<Collection[]> {
    const result = await pool.query('SELECT * FROM collections');
    return result.rows;
  }

  async createCollection(collection: Omit<Collection, 'id' | 'createdAt' | 'updatedAt'>): Promise<Collection> {
    const result = await pool.query(
      'INSERT INTO collections (name, description, thumbnail_url) VALUES ($1, $2, $3) RETURNING *',
      [collection.name, collection.description, collection.thumbnailUrl]
    );
    return result.rows[0];
  }

  async updateCollection(id: number, collection: Partial<Collection>): Promise<Collection | undefined> {
    const keys = Object.keys(collection);
    const values = Object.values(collection);
    const setClause = keys.map((key, i) => `${key} = $${i + 2}`).join(', ');
    const result = await pool.query(
      `UPDATE collections SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    return result.rows[0];
  }

  async deleteCollection(id: number): Promise<boolean> {
    try {
      await pool.query('BEGIN');
      await pool.query('DELETE FROM video_collections WHERE collection_id = $1', [id]);
      await pool.query('DELETE FROM collections WHERE id = $1', [id]);
      await pool.query('COMMIT');
      return true;
    } catch (error) {
      await pool.query('ROLLBACK');
      return false;
    }
  }

  // Video Collections
  async getVideoCollections(collectionId: number): Promise<Video[]> {
    const result = await pool.query(
      'SELECT v.* FROM videos v JOIN video_collections vc ON v.id = vc.video_id WHERE vc.collection_id = $1',
      [collectionId]
    );
    return result.rows;
  }

  async addVideoToCollection(videoId: number, collectionId: number): Promise<VideoCollection> {
    const result = await pool.query(
      'INSERT INTO video_collections (video_id, collection_id) VALUES ($1, $2) RETURNING *',
      [videoId, collectionId]
    );
    return result.rows[0];
  }

  async removeVideoFromCollection(videoId: number, collectionId: number): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM video_collections WHERE video_id = $1 AND collection_id = $2',
      [videoId, collectionId]
    );
    return result.rowCount > 0;
  }

  // Download Tasks
  async getDownloadTask(id: number): Promise<DownloadTask | undefined> {
    const result = await pool.query('SELECT * FROM download_tasks WHERE id = $1', [id]);
    return result.rows[0];
  }

  async getActiveDownloadTasks(): Promise<DownloadTask[]> {
    const result = await pool.query(
      "SELECT * FROM download_tasks WHERE status IN ('pending', 'downloading') ORDER BY progress DESC, created_at DESC"
    );
    return result.rows;
  }

  async getCompletedDownloadTasks(): Promise<DownloadTask[]> {
    const result = await pool.query(
      "SELECT * FROM download_tasks WHERE status IN ('completed', 'failed') ORDER BY completed_at DESC"
    );
    return result.rows;
  }

  async createDownloadTask(task: Omit<DownloadTask, 'id' | 'status' | 'progress' | 'createdAt' | 'completedAt'>): Promise<DownloadTask> {
    const result = await pool.query(
      'INSERT INTO download_tasks (video_id, title, format, quality, collection_id, status, progress) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [task.videoId, task.title, task.format, task.quality, task.collectionId, 'pending', 0]
    );
    return result.rows[0];
  }

  async updateDownloadTask(id: number, task: Partial<DownloadTask>): Promise<DownloadTask | undefined> {
    const keys = Object.keys(task);
    const values = Object.values(task);
    const setClause = keys.map((key, i) => `${key} = $${i + 2}`).join(', ');
    const result = await pool.query(
      `UPDATE download_tasks SET ${setClause} WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    return result.rows[0];
  }

  async updateDownloadProgress(id: number, progress: Partial<DownloadProgress>): Promise<DownloadTask | undefined> {
    const updates: any = {};
    
    if (progress.progress !== undefined) {
      updates.progress = progress.progress;
    }
    
    if (progress.status !== undefined) {
      updates.status = progress.status;
      if (progress.status === 'completed' || progress.status === 'failed') {
        updates.completed_at = new Date();
      }
    }

    const keys = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = keys.map((key, i) => `${key} = $${i + 2}`).join(', ');
    
    const result = await pool.query(
      `UPDATE download_tasks SET ${setClause} WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    return result.rows[0];
  }

  async deleteDownloadTask(id: number): Promise<boolean> {
    const result = await pool.query('DELETE FROM download_tasks WHERE id = $1', [id]);
    return result.rowCount > 0;
  }
}

// Initialize database with sample collections
export async function initializeDatabase() {
  const result = await pool.query('SELECT COUNT(*) FROM collections');
  
  if (parseInt(result.rows[0].count) === 0) {
    // Add default collections
    await pool.query(`
      INSERT INTO collections (name, description) VALUES
      ('Educational', 'Educational videos'),
      ('Music Videos', 'Music videos collection'),
      ('Tutorials', 'Tutorial videos'),
      ('Documentaries', 'Documentary videos')
    `);
  }
}

// Use the database storage
export const storage = new DatabaseStorage();