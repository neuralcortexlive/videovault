import { prisma } from './db';
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
    return await prisma.video.findUnique({ where: { id } });
  }

  async getVideoByYouTubeId(videoId: string): Promise<Video | undefined> {
    return await prisma.video.findUnique({ where: { videoId } });
  }

  async getAllVideos(): Promise<Video[]> {
    return await prisma.video.findMany();
  }

  async createVideo(video: Omit<Video, 'id'>): Promise<Video> {
    return await prisma.video.create({ data: video });
  }

  async updateVideo(id: number, video: Partial<Video>): Promise<Video | undefined> {
    return await prisma.video.update({
      where: { id },
      data: video
    });
  }

  async deleteVideo(id: number): Promise<boolean> {
    try {
      // Delete video collections first
      await prisma.videoCollection.deleteMany({
        where: { videoId: id }
      });
      
      // Then delete the video
      await prisma.video.delete({
        where: { id }
      });
      
      return true;
    } catch (error) {
      return false;
    }
  }

  // Collections
  async getCollection(id: number): Promise<Collection | undefined> {
    return await prisma.collection.findUnique({ where: { id } });
  }

  async getAllCollections(): Promise<Collection[]> {
    return await prisma.collection.findMany();
  }

  async createCollection(collection: Omit<Collection, 'id' | 'createdAt' | 'updatedAt'>): Promise<Collection> {
    return await prisma.collection.create({
      data: collection
    });
  }

  async updateCollection(id: number, collection: Partial<Collection>): Promise<Collection | undefined> {
    return await prisma.collection.update({
      where: { id },
      data: {
        ...collection,
        updatedAt: new Date()
      }
    });
  }

  async deleteCollection(id: number): Promise<boolean> {
    try {
      // Delete video collections first
      await prisma.videoCollection.deleteMany({
        where: { collectionId: id }
      });
      
      // Then delete the collection
      await prisma.collection.delete({
        where: { id }
      });
      
      return true;
    } catch (error) {
      return false;
    }
  }

  // Video Collections
  async getVideoCollections(collectionId: number): Promise<Video[]> {
    const videoCollections = await prisma.videoCollection.findMany({
      where: { collectionId },
      include: { video: true }
    });
    
    return videoCollections.map(vc => vc.video);
  }

  async addVideoToCollection(videoId: number, collectionId: number): Promise<VideoCollection> {
    // Check if it already exists
    const existing = await prisma.videoCollection.findFirst({
      where: {
        videoId,
        collectionId
      }
    });
    
    if (existing) {
      return existing;
    }
    
    return await prisma.videoCollection.create({
      data: {
        videoId,
        collectionId
      }
    });
  }

  async removeVideoFromCollection(videoId: number, collectionId: number): Promise<boolean> {
    try {
      await prisma.videoCollection.deleteMany({
        where: {
          videoId,
          collectionId
        }
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  // Download Tasks
  async getDownloadTask(id: number): Promise<DownloadTask | undefined> {
    return await prisma.downloadTask.findUnique({ where: { id } });
  }

  async getActiveDownloadTasks(): Promise<DownloadTask[]> {
    return await prisma.downloadTask.findMany({
      where: {
        status: {
          in: ['pending', 'downloading']
        }
      },
      orderBy: [
        { progress: 'desc' },
        { createdAt: 'desc' }
      ]
    });
  }

  async getCompletedDownloadTasks(): Promise<DownloadTask[]> {
    return await prisma.downloadTask.findMany({
      where: {
        status: {
          in: ['completed', 'failed']
        }
      },
      orderBy: [
        { completedAt: 'desc' }
      ]
    });
  }

  async createDownloadTask(task: Omit<DownloadTask, 'id' | 'status' | 'progress' | 'createdAt' | 'completedAt'>): Promise<DownloadTask> {
    return await prisma.downloadTask.create({
      data: {
        ...task,
        status: 'pending',
        progress: 0
      }
    });
  }

  async updateDownloadTask(id: number, task: Partial<DownloadTask>): Promise<DownloadTask | undefined> {
    // If status changed to completed or failed, set completedAt
    if (task.status === 'completed' || task.status === 'failed') {
      task.completedAt = new Date();
    }
    
    return await prisma.downloadTask.update({
      where: { id },
      data: task
    });
  }

  async updateDownloadProgress(id: number, progress: Partial<DownloadProgress>): Promise<DownloadTask | undefined> {
    const updateData: any = {};
    
    if (progress.progress !== undefined) {
      updateData.progress = progress.progress;
    }
    
    if (progress.status !== undefined) {
      updateData.status = progress.status;
      
      if (progress.status === 'completed' || progress.status === 'failed') {
        updateData.completedAt = new Date();
      }
    }
    
    return await prisma.downloadTask.update({
      where: { id },
      data: updateData
    });
  }

  async deleteDownloadTask(id: number): Promise<boolean> {
    try {
      await prisma.downloadTask.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Initialize database with sample collections
export async function initializeDatabase() {
  const existingCollections = await prisma.collection.findMany();
  
  if (existingCollections.length === 0) {
    // Add default collections
    await prisma.collection.createMany({
      data: [
        { name: "Educational", description: "Educational videos" },
        { name: "Music Videos", description: "Music videos collection" },
        { name: "Tutorials", description: "Tutorial videos" },
        { name: "Documentaries", description: "Documentary videos" }
      ]
    });
  }
}

// Use the database storage
export const storage = new DatabaseStorage();