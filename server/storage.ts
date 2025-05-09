import {
  videos, Video, InsertVideo,
  collections, Collection, InsertCollection,
  videoCollections, VideoCollection, InsertVideoCollection,
  downloadTasks, DownloadTask, InsertDownloadTask,
  DownloadProgress
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc } from "drizzle-orm";

export interface IStorage {
  // Videos
  getVideo(id: number): Promise<Video | undefined>;
  getVideoByYouTubeId(videoId: string): Promise<Video | undefined>;
  getAllVideos(): Promise<Video[]>;
  createVideo(video: InsertVideo): Promise<Video>;
  updateVideo(id: number, video: Partial<Video>): Promise<Video | undefined>;
  deleteVideo(id: number): Promise<boolean>;
  
  // Collections
  getCollection(id: number): Promise<Collection | undefined>;
  getAllCollections(): Promise<Collection[]>;
  createCollection(collection: InsertCollection): Promise<Collection>;
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
  createDownloadTask(task: InsertDownloadTask): Promise<DownloadTask>;
  updateDownloadTask(id: number, task: Partial<DownloadTask>): Promise<DownloadTask | undefined>;
  updateDownloadProgress(id: number, progress: Partial<DownloadProgress>): Promise<DownloadTask | undefined>;
  deleteDownloadTask(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private videos: Map<number, Video>;
  private collections: Map<number, Collection>;
  private videoCollections: Map<number, VideoCollection>;
  private downloadTasks: Map<number, DownloadTask>;
  private videoIdCounter: number;
  private collectionIdCounter: number;
  private videoCollectionIdCounter: number;
  private downloadTaskIdCounter: number;

  constructor() {
    this.videos = new Map();
    this.collections = new Map();
    this.videoCollections = new Map();
    this.downloadTasks = new Map();
    this.videoIdCounter = 1;
    this.collectionIdCounter = 1;
    this.videoCollectionIdCounter = 1;
    this.downloadTaskIdCounter = 1;

    // Initialize with default collections
    this.createCollection({ name: "Educational", description: "Educational videos" });
    this.createCollection({ name: "Music Videos", description: "Music videos collection" });
    this.createCollection({ name: "Tutorials", description: "Tutorial videos" });
    this.createCollection({ name: "Documentaries", description: "Documentary videos" });
  }

  // Videos
  async getVideo(id: number): Promise<Video | undefined> {
    return this.videos.get(id);
  }

  async getVideoByYouTubeId(videoId: string): Promise<Video | undefined> {
    return Array.from(this.videos.values()).find(video => video.videoId === videoId);
  }

  async getAllVideos(): Promise<Video[]> {
    return Array.from(this.videos.values());
  }

  async createVideo(videoData: InsertVideo): Promise<Video> {
    const id = this.videoIdCounter++;
    const video: Video = { ...videoData, id };
    this.videos.set(id, video);
    return video;
  }

  async updateVideo(id: number, videoData: Partial<Video>): Promise<Video | undefined> {
    const video = this.videos.get(id);
    if (!video) return undefined;

    const updatedVideo = { ...video, ...videoData };
    this.videos.set(id, updatedVideo);
    return updatedVideo;
  }

  async deleteVideo(id: number): Promise<boolean> {
    // Remove video from collections
    const videoCollectionsToRemove = Array.from(this.videoCollections.values())
      .filter(vc => vc.videoId === id);
    
    for (const vc of videoCollectionsToRemove) {
      this.videoCollections.delete(vc.id);
    }

    return this.videos.delete(id);
  }

  // Collections
  async getCollection(id: number): Promise<Collection | undefined> {
    return this.collections.get(id);
  }

  async getAllCollections(): Promise<Collection[]> {
    return Array.from(this.collections.values());
  }

  async createCollection(collectionData: InsertCollection): Promise<Collection> {
    const id = this.collectionIdCounter++;
    const now = new Date();
    const collection: Collection = { 
      ...collectionData, 
      id, 
      createdAt: now, 
      updatedAt: now 
    };
    this.collections.set(id, collection);
    return collection;
  }

  async updateCollection(id: number, collectionData: Partial<Collection>): Promise<Collection | undefined> {
    const collection = this.collections.get(id);
    if (!collection) return undefined;

    const now = new Date();
    const updatedCollection = { 
      ...collection, 
      ...collectionData, 
      updatedAt: now 
    };
    this.collections.set(id, updatedCollection);
    return updatedCollection;
  }

  async deleteCollection(id: number): Promise<boolean> {
    // Remove all videos from this collection
    const videoCollectionsToRemove = Array.from(this.videoCollections.values())
      .filter(vc => vc.collectionId === id);
    
    for (const vc of videoCollectionsToRemove) {
      this.videoCollections.delete(vc.id);
    }

    return this.collections.delete(id);
  }

  // Video Collections
  async getVideoCollections(collectionId: number): Promise<Video[]> {
    const videoCollections = Array.from(this.videoCollections.values())
      .filter(vc => vc.collectionId === collectionId);
    
    const videos: Video[] = [];
    for (const vc of videoCollections) {
      const video = this.videos.get(vc.videoId);
      if (video) videos.push(video);
    }
    
    return videos;
  }

  async addVideoToCollection(videoId: number, collectionId: number): Promise<VideoCollection> {
    // Check if already exists
    const existing = Array.from(this.videoCollections.values())
      .find(vc => vc.videoId === videoId && vc.collectionId === collectionId);
    
    if (existing) return existing;

    const id = this.videoCollectionIdCounter++;
    const videoCollection: VideoCollection = { id, videoId, collectionId };
    this.videoCollections.set(id, videoCollection);
    return videoCollection;
  }

  async removeVideoFromCollection(videoId: number, collectionId: number): Promise<boolean> {
    const toRemove = Array.from(this.videoCollections.values())
      .find(vc => vc.videoId === videoId && vc.collectionId === collectionId);
    
    if (!toRemove) return false;
    return this.videoCollections.delete(toRemove.id);
  }

  // Download Tasks
  async getDownloadTask(id: number): Promise<DownloadTask | undefined> {
    return this.downloadTasks.get(id);
  }

  async getActiveDownloadTasks(): Promise<DownloadTask[]> {
    return Array.from(this.downloadTasks.values())
      .filter(task => task.status === "pending" || task.status === "downloading")
      .sort((a, b) => {
        // Sort by progress (highest first)
        if (a.progress !== b.progress) return b.progress - a.progress;
        // Then by creation date (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }

  async getCompletedDownloadTasks(): Promise<DownloadTask[]> {
    return Array.from(this.downloadTasks.values())
      .filter(task => task.status === "completed" || task.status === "failed")
      .sort((a, b) => {
        // Sort by completion date (newest first)
        if (a.completedAt && b.completedAt) {
          return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
        }
        return 0;
      });
  }

  async createDownloadTask(taskData: InsertDownloadTask): Promise<DownloadTask> {
    const id = this.downloadTaskIdCounter++;
    const now = new Date();
    const task: DownloadTask = { 
      ...taskData, 
      id, 
      status: "pending", 
      progress: 0, 
      createdAt: now 
    };
    this.downloadTasks.set(id, task);
    return task;
  }

  async updateDownloadTask(id: number, taskData: Partial<DownloadTask>): Promise<DownloadTask | undefined> {
    const task = this.downloadTasks.get(id);
    if (!task) return undefined;

    const updatedTask = { ...task, ...taskData };
    
    // If status changed to completed or failed, set completedAt
    if (
      (taskData.status === "completed" || taskData.status === "failed") && 
      task.status !== "completed" && 
      task.status !== "failed"
    ) {
      updatedTask.completedAt = new Date();
    }

    this.downloadTasks.set(id, updatedTask);
    return updatedTask;
  }

  async updateDownloadProgress(id: number, progress: Partial<DownloadProgress>): Promise<DownloadTask | undefined> {
    const task = this.downloadTasks.get(id);
    if (!task) return undefined;

    const updatedTask: DownloadTask = {
      ...task,
      progress: progress.progress ?? task.progress,
      status: progress.status ?? task.status
    };

    // If status changed to completed or failed, set completedAt
    if (
      (progress.status === "completed" || progress.status === "failed") && 
      task.status !== "completed" && 
      task.status !== "failed"
    ) {
      updatedTask.completedAt = new Date();
    }

    this.downloadTasks.set(id, updatedTask);
    return updatedTask;
  }

  async deleteDownloadTask(id: number): Promise<boolean> {
    return this.downloadTasks.delete(id);
  }
}

export class DatabaseStorage implements IStorage {
  // Videos
  async getVideo(id: number): Promise<Video | undefined> {
    const [video] = await db.select().from(videos).where(eq(videos.id, id));
    return video;
  }

  async getVideoByYouTubeId(videoId: string): Promise<Video | undefined> {
    const [video] = await db.select().from(videos).where(eq(videos.videoId, videoId));
    return video;
  }

  async getAllVideos(): Promise<Video[]> {
    return await db.select().from(videos);
  }

  async createVideo(video: InsertVideo): Promise<Video> {
    const [createdVideo] = await db.insert(videos).values(video).returning();
    return createdVideo;
  }

  async updateVideo(id: number, video: Partial<Video>): Promise<Video | undefined> {
    const [updatedVideo] = await db
      .update(videos)
      .set(video)
      .where(eq(videos.id, id))
      .returning();
    return updatedVideo;
  }

  async deleteVideo(id: number): Promise<boolean> {
    // First delete video collections
    await db
      .delete(videoCollections)
      .where(eq(videoCollections.videoId, id));
      
    const [deleted] = await db
      .delete(videos)
      .where(eq(videos.id, id))
      .returning({ id: videos.id });
    return !!deleted;
  }

  // Collections
  async getCollection(id: number): Promise<Collection | undefined> {
    const [collection] = await db.select().from(collections).where(eq(collections.id, id));
    return collection;
  }

  async getAllCollections(): Promise<Collection[]> {
    return await db.select().from(collections);
  }

  async createCollection(collection: InsertCollection): Promise<Collection> {
    const [createdCollection] = await db
      .insert(collections)
      .values(collection)
      .returning();
    return createdCollection;
  }

  async updateCollection(id: number, collection: Partial<Collection>): Promise<Collection | undefined> {
    // Always update the updatedAt timestamp
    const updateData = {
      ...collection,
      updatedAt: new Date()
    };
    
    const [updatedCollection] = await db
      .update(collections)
      .set(updateData)
      .where(eq(collections.id, id))
      .returning();
    return updatedCollection;
  }

  async deleteCollection(id: number): Promise<boolean> {
    // First delete any video collection mappings
    await db
      .delete(videoCollections)
      .where(eq(videoCollections.collectionId, id));
    
    // Then delete the collection
    const [deleted] = await db
      .delete(collections)
      .where(eq(collections.id, id))
      .returning({ id: collections.id });
    return !!deleted;
  }

  // Video Collections
  async getVideoCollections(collectionId: number): Promise<Video[]> {
    // Join videos and videoCollections to get videos in a collection
    const collectionVideos = await db
      .select({
        id: videos.id,
        videoId: videos.videoId,
        title: videos.title,
        description: videos.description,
        channelTitle: videos.channelTitle,
        thumbnailUrl: videos.thumbnailUrl,
        publishedAt: videos.publishedAt,
        duration: videos.duration,
        viewCount: videos.viewCount,
        downloadPath: videos.downloadPath,
        format: videos.format,
        quality: videos.quality,
        fileSize: videos.fileSize,
        isDownloaded: videos.isDownloaded,
        isWatched: videos.isWatched,
        downloadedAt: videos.downloadedAt,
        metadata: videos.metadata,
      })
      .from(videoCollections)
      .innerJoin(videos, eq(videoCollections.videoId, videos.id))
      .where(eq(videoCollections.collectionId, collectionId));
      
    return collectionVideos;
  }

  async addVideoToCollection(videoId: number, collectionId: number): Promise<VideoCollection> {
    // Check if it already exists
    const existing = await db
      .select()
      .from(videoCollections)
      .where(
        and(
          eq(videoCollections.videoId, videoId),
          eq(videoCollections.collectionId, collectionId)
        )
      );
      
    if (existing.length > 0) {
      return existing[0];
    }
      
    const [videoCollection] = await db
      .insert(videoCollections)
      .values({ videoId, collectionId })
      .returning();
    return videoCollection;
  }

  async removeVideoFromCollection(videoId: number, collectionId: number): Promise<boolean> {
    const [deleted] = await db
      .delete(videoCollections)
      .where(
        and(
          eq(videoCollections.videoId, videoId),
          eq(videoCollections.collectionId, collectionId)
        )
      )
      .returning({ id: videoCollections.id });
    return !!deleted;
  }

  // Download Tasks
  async getDownloadTask(id: number): Promise<DownloadTask | undefined> {
    const [task] = await db.select().from(downloadTasks).where(eq(downloadTasks.id, id));
    return task;
  }

  async getActiveDownloadTasks(): Promise<DownloadTask[]> {
    return await db
      .select()
      .from(downloadTasks)
      .where(
        or(
          eq(downloadTasks.status, 'pending'),
          eq(downloadTasks.status, 'downloading')
        )
      )
      .orderBy(desc(downloadTasks.progress), desc(downloadTasks.createdAt));
  }

  async getCompletedDownloadTasks(): Promise<DownloadTask[]> {
    return await db
      .select()
      .from(downloadTasks)
      .where(
        or(
          eq(downloadTasks.status, 'completed'),
          eq(downloadTasks.status, 'failed')
        )
      )
      .orderBy(desc(downloadTasks.completedAt));
  }

  async createDownloadTask(task: InsertDownloadTask): Promise<DownloadTask> {
    const [createdTask] = await db
      .insert(downloadTasks)
      .values({
        ...task,
        status: 'pending',
        progress: 0
      })
      .returning();
    return createdTask;
  }

  async updateDownloadTask(id: number, task: Partial<DownloadTask>): Promise<DownloadTask | undefined> {
    // If status changed to completed or failed, set completedAt
    if (
      (task.status === "completed" || task.status === "failed")
    ) {
      task.completedAt = new Date();
    }
    
    const [updatedTask] = await db
      .update(downloadTasks)
      .set(task)
      .where(eq(downloadTasks.id, id))
      .returning();
    return updatedTask;
  }

  async updateDownloadProgress(id: number, progress: Partial<DownloadProgress>): Promise<DownloadTask | undefined> {
    // Prepare the update data
    const updateData: Partial<DownloadTask> = {};
    
    if (progress.progress !== undefined) {
      updateData.progress = progress.progress;
    }
    
    if (progress.status !== undefined) {
      updateData.status = progress.status;
      
      // If download is completed or failed, set completedAt
      if (progress.status === 'completed' || progress.status === 'failed') {
        updateData.completedAt = new Date();
      }
    }
    
    const [updatedTask] = await db
      .update(downloadTasks)
      .set(updateData)
      .where(eq(downloadTasks.id, id))
      .returning();
    
    return updatedTask;
  }

  async deleteDownloadTask(id: number): Promise<boolean> {
    const [deleted] = await db
      .delete(downloadTasks)
      .where(eq(downloadTasks.id, id))
      .returning({ id: downloadTasks.id });
    return !!deleted;
  }
}

// Initialize database with sample collections
export async function initializeDatabase() {
  const existingCollections = await db.select().from(collections);
  
  if (existingCollections.length === 0) {
    // Add default collections
    await db.insert(collections).values([
      { name: "Educational", description: "Educational videos" },
      { name: "Music Videos", description: "Music videos collection" },
      { name: "Tutorials", description: "Tutorial videos" },
      { name: "Documentaries", description: "Documentary videos" }
    ]);
  }
}

// Use the database storage
export const storage = new DatabaseStorage();
