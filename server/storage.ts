import {
  videos, Video, InsertVideo,
  collections, Collection, InsertCollection,
  videoCollections, VideoCollection, InsertVideoCollection,
  downloadTasks, DownloadTask, InsertDownloadTask,
  DownloadProgress
} from "@shared/schema";

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

export const storage = new MemStorage();
