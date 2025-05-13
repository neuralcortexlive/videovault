import { 
  videos, downloads, apiConfigs, collections, videoCollections, qualityPresets,
  batchDownloads, batchDownloadItems,
  type Video, type InsertVideo, 
  type Download, type InsertDownload, 
  type ApiConfig, type InsertApiConfig,
  type Collection, type InsertCollection,
  type VideoCollection, type InsertVideoCollection,
  type QualityPreset, type InsertQualityPreset,
  type BatchDownload, type InsertBatchDownload,
  type BatchDownloadItem, type InsertBatchDownloadItem
} from "@shared/schema";
import { eq, desc, and, inArray, not, sql } from "drizzle-orm";
import { db } from "./db";

export interface IStorage {
  // Video operations
  getVideo(id: number): Promise<Video | undefined>;
  getVideoByVideoId(videoId: string): Promise<Video | undefined>;
  createVideo(video: InsertVideo): Promise<Video>;
  updateVideo(id: number, video: Partial<Video>): Promise<Video | undefined>;
  listVideos(limit: number, offset: number): Promise<Video[]>;
  
  // Download operations
  getDownload(id: number): Promise<Download | undefined>;
  getDownloadByVideoId(videoId: string): Promise<Download | undefined>;
  createDownload(download: InsertDownload): Promise<Download>;
  updateDownload(id: number, download: Partial<Download>): Promise<Download | undefined>;
  listDownloads(limit: number, offset: number): Promise<Download[]>;
  listInProgressDownloads(): Promise<Download[]>;
  deleteAllDownloads(): Promise<void>; // Para implementar o botão "Clear"
  
  // API Config operations
  getApiConfig(): Promise<ApiConfig | undefined>;
  saveApiConfig(config: InsertApiConfig): Promise<ApiConfig>;
  
  // Collection operations
  getCollection(id: number): Promise<Collection | undefined>;
  createCollection(collection: InsertCollection): Promise<Collection>;
  updateCollection(id: number, collection: Partial<Collection>): Promise<Collection | undefined>;
  deleteCollection(id: number): Promise<boolean>;
  listCollections(): Promise<Collection[]>;
  
  // Video-Collection operations
  addVideoToCollection(videoId: number, collectionId: number): Promise<VideoCollection>;
  removeVideoFromCollection(videoId: number, collectionId: number): Promise<boolean>;
  getVideosInCollection(collectionId: number): Promise<Video[]>;
  
  // Quality Preset operations
  getQualityPreset(id: number): Promise<QualityPreset | undefined>;
  getDefaultQualityPreset(): Promise<QualityPreset | undefined>;
  createQualityPreset(preset: InsertQualityPreset): Promise<QualityPreset>;
  updateQualityPreset(id: number, preset: Partial<QualityPreset>): Promise<QualityPreset | undefined>;
  deleteQualityPreset(id: number): Promise<boolean>;
  listQualityPresets(): Promise<QualityPreset[]>;
  setDefaultQualityPreset(id: number): Promise<boolean>;
  
  // Batch Download operations
  getBatchDownload(id: number): Promise<BatchDownload | undefined>;
  createBatchDownload(batch: InsertBatchDownload): Promise<BatchDownload>;
  updateBatchDownload(id: number, batch: Partial<BatchDownload>): Promise<BatchDownload | undefined>;
  deleteBatchDownload(id: number): Promise<boolean>;
  listBatchDownloads(limit: number, offset: number): Promise<BatchDownload[]>;
  listActiveBatchDownloads(): Promise<BatchDownload[]>;
  
  // Batch Download Items operations
  getBatchDownloadItem(id: number): Promise<BatchDownloadItem | undefined>;
  createBatchDownloadItem(item: InsertBatchDownloadItem): Promise<BatchDownloadItem>;
  updateBatchDownloadItem(id: number, item: Partial<BatchDownloadItem>): Promise<BatchDownloadItem | undefined>;
  getBatchDownloadItems(batchId: number): Promise<BatchDownloadItem[]>;
  deleteBatchDownloadItem(id: number): Promise<boolean>;
  updateBatchDownloadProgress(batchId: number): Promise<void>; // Update batch progress based on items status
}

export class DatabaseStorage implements IStorage {
  // Video operations
  async getVideo(id: number): Promise<Video | undefined> {
    const [video] = await db.select().from(videos).where(eq(videos.id, id));
    return video;
  }

  async getVideoByVideoId(videoId: string): Promise<Video | undefined> {
    const [video] = await db.select().from(videos).where(eq(videos.videoId, videoId));
    return video;
  }

  async createVideo(video: InsertVideo): Promise<Video> {
    const [newVideo] = await db.insert(videos).values(video).returning();
    return newVideo;
  }

  async updateVideo(id: number, videoUpdate: Partial<Video>): Promise<Video | undefined> {
    const [updatedVideo] = await db
      .update(videos)
      .set(videoUpdate)
      .where(eq(videos.id, id))
      .returning();
    return updatedVideo;
  }

  async listVideos(limit: number = 10, offset: number = 0): Promise<Video[]> {
    return await db
      .select()
      .from(videos)
      .orderBy(desc(videos.createdAt))
      .limit(limit)
      .offset(offset);
  }

  // Download operations
  async getDownload(id: number): Promise<Download | undefined> {
    const [download] = await db.select().from(downloads).where(eq(downloads.id, id));
    return download;
  }

  async getDownloadByVideoId(videoId: string): Promise<Download | undefined> {
    const [download] = await db.select().from(downloads).where(eq(downloads.videoId, videoId));
    return download;
  }

  async createDownload(download: InsertDownload): Promise<Download> {
    const [newDownload] = await db.insert(downloads).values(download).returning();
    return newDownload;
  }

  async updateDownload(id: number, downloadUpdate: Partial<Download>): Promise<Download | undefined> {
    const [updatedDownload] = await db
      .update(downloads)
      .set(downloadUpdate)
      .where(eq(downloads.id, id))
      .returning();
    return updatedDownload;
  }

  async listDownloads(limit: number = 10, offset: number = 0): Promise<Download[]> {
    return await db
      .select()
      .from(downloads)
      .orderBy(desc(downloads.startedAt))
      .limit(limit)
      .offset(offset);
  }

  async listInProgressDownloads(): Promise<Download[]> {
    return await db
      .select()
      .from(downloads)
      .where(eq(downloads.status, "downloading"))
      .orderBy(desc(downloads.startedAt));
  }
  
  async deleteAllDownloads(): Promise<void> {
    // Função para implementar o botão "Clear" no histórico de downloads
    await db.delete(downloads);
  }
  
  // Collection operations
  async getCollection(id: number): Promise<Collection | undefined> {
    const [collection] = await db
      .select()
      .from(collections)
      .where(eq(collections.id, id));
    return collection;
  }

  async createCollection(collection: InsertCollection): Promise<Collection> {
    const [newCollection] = await db
      .insert(collections)
      .values(collection)
      .returning();
    return newCollection;
  }

  async updateCollection(id: number, collectionUpdate: Partial<Collection>): Promise<Collection | undefined> {
    const [updatedCollection] = await db
      .update(collections)
      .set(collectionUpdate)
      .where(eq(collections.id, id))
      .returning();
    return updatedCollection;
  }

  async deleteCollection(id: number): Promise<boolean> {
    const deletedCollections = await db
      .delete(collections)
      .where(eq(collections.id, id))
      .returning();
    return deletedCollections.length > 0;
  }

  async listCollections(): Promise<Collection[]> {
    return await db
      .select()
      .from(collections)
      .orderBy(collections.name);
  }

  // Video-Collection operations
  async addVideoToCollection(videoId: number, collectionId: number): Promise<VideoCollection> {
    const [videoCollection] = await db
      .insert(videoCollections)
      .values({ videoId, collectionId })
      .returning();
    return videoCollection;
  }

  async removeVideoFromCollection(videoId: number, collectionId: number): Promise<boolean> {
    const deletedItems = await db
      .delete(videoCollections)
      .where(and(
        eq(videoCollections.videoId, videoId),
        eq(videoCollections.collectionId, collectionId)
      ))
      .returning();
    return deletedItems.length > 0;
  }

  async getVideosInCollection(collectionId: number): Promise<Video[]> {
    // Busca todos os IDs de vídeos na coleção
    const videoIds = await db
      .select({ videoId: videoCollections.videoId })
      .from(videoCollections)
      .where(eq(videoCollections.collectionId, collectionId));
    
    // Se não houver vídeos na coleção, retornar array vazio
    if (videoIds.length === 0) {
      return [];
    }
    
    // Busca os detalhes de todos os vídeos da coleção
    return await db
      .select()
      .from(videos)
      .where(inArray(videos.id, videoIds.map(v => v.videoId)))
      .orderBy(desc(videos.createdAt));
  }

  // API Config operations
  async getApiConfig(): Promise<ApiConfig | undefined> {
    const [config] = await db.select().from(apiConfigs).orderBy(desc(apiConfigs.updatedAt)).limit(1);
    return config;
  }

  async saveApiConfig(config: InsertApiConfig): Promise<ApiConfig> {
    // Clear existing configs and save the new one
    await db.delete(apiConfigs);
    const [newConfig] = await db.insert(apiConfigs).values(config).returning();
    return newConfig;
  }
  
  // Quality Preset operations
  async getQualityPreset(id: number): Promise<QualityPreset | undefined> {
    const [preset] = await db
      .select()
      .from(qualityPresets)
      .where(eq(qualityPresets.id, id));
    
    return preset;
  }

  async getDefaultQualityPreset(): Promise<QualityPreset | undefined> {
    const [preset] = await db
      .select()
      .from(qualityPresets)
      .where(eq(qualityPresets.isDefault, true));
    
    if (preset) {
      return preset;
    }
    
    // If no default preset exists, return the first one
    const [firstPreset] = await db
      .select()
      .from(qualityPresets)
      .limit(1);
    
    return firstPreset;
  }

  async createQualityPreset(preset: InsertQualityPreset): Promise<QualityPreset> {
    // If this preset is being set as default, clear default flag from other presets
    if (preset.isDefault) {
      await db
        .update(qualityPresets)
        .set({ isDefault: false })
        .where(eq(qualityPresets.isDefault, true));
    }
    
    const [newPreset] = await db
      .insert(qualityPresets)
      .values(preset)
      .returning();
    
    return newPreset;
  }

  async updateQualityPreset(id: number, presetUpdate: Partial<QualityPreset>): Promise<QualityPreset | undefined> {
    // If this preset is being set as default, clear default flag from other presets
    if (presetUpdate.isDefault) {
      await db
        .update(qualityPresets)
        .set({ isDefault: false })
        .where(and(
          eq(qualityPresets.isDefault, true),
          not(eq(qualityPresets.id, id))
        ));
    }
    
    const [updatedPreset] = await db
      .update(qualityPresets)
      .set({ 
        ...presetUpdate,
        updatedAt: new Date() 
      })
      .where(eq(qualityPresets.id, id))
      .returning();
    
    return updatedPreset;
  }

  async deleteQualityPreset(id: number): Promise<boolean> {
    const [preset] = await db
      .select()
      .from(qualityPresets)
      .where(eq(qualityPresets.id, id));
    
    if (!preset) {
      return false;
    }
    
    // If deleting the default preset, set another as default
    if (preset.isDefault) {
      const [anotherPreset] = await db
        .select()
        .from(qualityPresets)
        .where(not(eq(qualityPresets.id, id)))
        .limit(1);
      
      if (anotherPreset) {
        await db
          .update(qualityPresets)
          .set({ isDefault: true })
          .where(eq(qualityPresets.id, anotherPreset.id));
      }
    }
    
    const deletedPresets = await db
      .delete(qualityPresets)
      .where(eq(qualityPresets.id, id))
      .returning();
    
    return deletedPresets.length > 0;
  }

  async listQualityPresets(): Promise<QualityPreset[]> {
    const presets = await db
      .select()
      .from(qualityPresets)
      .orderBy(desc(qualityPresets.isDefault), qualityPresets.name);
    
    return presets;
  }

  async setDefaultQualityPreset(id: number): Promise<boolean> {
    const [preset] = await db
      .select()
      .from(qualityPresets)
      .where(eq(qualityPresets.id, id));
    
    if (!preset) {
      return false;
    }
    
    // Clear default flag from all presets
    await db
      .update(qualityPresets)
      .set({ isDefault: false });
    
    // Set default flag for selected preset
    const [updatedPreset] = await db
      .update(qualityPresets)
      .set({ 
        isDefault: true,
        updatedAt: new Date() 
      })
      .where(eq(qualityPresets.id, id))
      .returning();
    
    return !!updatedPreset;
  }
  
  // Batch Download operations
  async getBatchDownload(id: number): Promise<BatchDownload | undefined> {
    const [batch] = await db
      .select()
      .from(batchDownloads)
      .where(eq(batchDownloads.id, id));
    
    return batch;
  }

  async createBatchDownload(batch: InsertBatchDownload): Promise<BatchDownload> {
    const [newBatch] = await db
      .insert(batchDownloads)
      .values(batch)
      .returning();
    
    return newBatch;
  }

  async updateBatchDownload(id: number, batchUpdate: Partial<BatchDownload>): Promise<BatchDownload | undefined> {
    const [updatedBatch] = await db
      .update(batchDownloads)
      .set({ 
        ...batchUpdate,
        updatedAt: new Date() 
      })
      .where(eq(batchDownloads.id, id))
      .returning();
    
    return updatedBatch;
  }

  async deleteBatchDownload(id: number): Promise<boolean> {
    // Note: This will automatically delete all batch items due to the cascade relationship
    const result = await db
      .delete(batchDownloads)
      .where(eq(batchDownloads.id, id))
      .returning();
    
    return result.length > 0;
  }

  async listBatchDownloads(limit: number = 10, offset: number = 0): Promise<BatchDownload[]> {
    const batches = await db
      .select()
      .from(batchDownloads)
      .orderBy(desc(batchDownloads.createdAt))
      .limit(limit)
      .offset(offset);
    
    return batches;
  }

  async listActiveBatchDownloads(): Promise<BatchDownload[]> {
    const batches = await db
      .select()
      .from(batchDownloads)
      .where(
        sql`${batchDownloads.status} IN ('pending', 'in-progress')`
      )
      .orderBy(desc(batchDownloads.createdAt));
    
    return batches;
  }
  
  // Batch Download Items operations
  async getBatchDownloadItem(id: number): Promise<BatchDownloadItem | undefined> {
    const [item] = await db
      .select()
      .from(batchDownloadItems)
      .where(eq(batchDownloadItems.id, id));
    
    return item;
  }

  async createBatchDownloadItem(item: InsertBatchDownloadItem): Promise<BatchDownloadItem> {
    const [newItem] = await db
      .insert(batchDownloadItems)
      .values(item)
      .returning();
    
    // Update batch totalVideos count
    await db
      .update(batchDownloads)
      .set({ 
        totalVideos: sql`${batchDownloads.totalVideos} + 1`,
        updatedAt: new Date()
      })
      .where(eq(batchDownloads.id, newItem.batchId));
    
    return newItem;
  }

  async updateBatchDownloadItem(id: number, itemUpdate: Partial<BatchDownloadItem>): Promise<BatchDownloadItem | undefined> {
    const [updatedItem] = await db
      .update(batchDownloadItems)
      .set({ 
        ...itemUpdate,
        updatedAt: new Date() 
      })
      .where(eq(batchDownloadItems.id, id))
      .returning();
    
    // If status changed to completed or failed, update batch progress
    if (itemUpdate.status === 'completed' || itemUpdate.status === 'failed') {
      await this.updateBatchDownloadProgress(updatedItem.batchId);
    }
    
    return updatedItem;
  }

  async getBatchDownloadItems(batchId: number): Promise<BatchDownloadItem[]> {
    const items = await db
      .select()
      .from(batchDownloadItems)
      .where(eq(batchDownloadItems.batchId, batchId))
      .orderBy(batchDownloadItems.order);
    
    return items;
  }

  async deleteBatchDownloadItem(id: number): Promise<boolean> {
    const [item] = await db
      .select()
      .from(batchDownloadItems)
      .where(eq(batchDownloadItems.id, id));
    
    if (!item) {
      return false;
    }
    
    const batchId = item.batchId;
    
    const result = await db
      .delete(batchDownloadItems)
      .where(eq(batchDownloadItems.id, id))
      .returning();
    
    if (result.length > 0) {
      // Update batch totalVideos count
      await db
        .update(batchDownloads)
        .set({ 
          totalVideos: sql`${batchDownloads.totalVideos} - 1`,
          updatedAt: new Date()
        })
        .where(eq(batchDownloads.id, batchId));
      
      // Update batch progress counts
      await this.updateBatchDownloadProgress(batchId);
      
      return true;
    }
    
    return false;
  }

  async updateBatchDownloadProgress(batchId: number): Promise<void> {
    // Get all items for this batch
    const items = await db
      .select()
      .from(batchDownloadItems)
      .where(eq(batchDownloadItems.batchId, batchId));
    
    // Count completed and failed items
    const completedVideos = items.filter(item => item.status === 'completed').length;
    const failedVideos = items.filter(item => item.status === 'failed').length;
    const totalVideos = items.length;
    
    // Determine overall batch status
    let status = 'pending';
    let completedAt = null;
    
    if (totalVideos === 0) {
      status = 'pending';
    } else if (completedVideos + failedVideos === totalVideos) {
      status = failedVideos === totalVideos ? 'failed' : 'completed';
      completedAt = new Date();
    } else if (completedVideos + failedVideos > 0) {
      status = 'in-progress';
    }
    
    // Update batch
    await db
      .update(batchDownloads)
      .set({ 
        completedVideos,
        failedVideos,
        totalVideos,
        status,
        completedAt,
        updatedAt: new Date()
      })
      .where(eq(batchDownloads.id, batchId));
  }
}

export class MemStorage implements IStorage {
  private videos: Map<number, Video>;
  private downloads: Map<number, Download>;
  private apiConfig?: ApiConfig;
  private collections: Map<number, Collection>;
  private videoCollections: Map<string, VideoCollection>;
  private qualityPresets: Map<number, QualityPreset>;
  private batchDownloads: Map<number, BatchDownload>;
  private batchDownloadItems: Map<number, BatchDownloadItem>;
  private currentVideoId: number;
  private currentDownloadId: number;
  private currentApiConfigId: number;
  private currentCollectionId: number;
  private currentPresetId: number;
  private currentBatchId: number;
  private currentBatchItemId: number;

  constructor() {
    this.videos = new Map();
    this.downloads = new Map();
    this.collections = new Map();
    this.videoCollections = new Map();
    this.qualityPresets = new Map();
    this.batchDownloads = new Map();
    this.batchDownloadItems = new Map();
    this.currentVideoId = 1;
    this.currentDownloadId = 1;
    this.currentApiConfigId = 1;
    this.currentCollectionId = 1;
    this.currentPresetId = 1;
    this.currentBatchId = 1;
    this.currentBatchItemId = 1;
  }

  // Video operations
  async getVideo(id: number): Promise<Video | undefined> {
    return this.videos.get(id);
  }

  async getVideoByVideoId(videoId: string): Promise<Video | undefined> {
    return Array.from(this.videos.values()).find(
      (video) => video.videoId === videoId,
    );
  }

  async createVideo(video: InsertVideo): Promise<Video> {
    const id = this.currentVideoId++;
    const now = new Date();
    const newVideo: Video = { 
      ...video, 
      id, 
      createdAt: now 
    };
    this.videos.set(id, newVideo);
    return newVideo;
  }

  async updateVideo(id: number, videoUpdate: Partial<Video>): Promise<Video | undefined> {
    const existingVideo = this.videos.get(id);
    if (!existingVideo) return undefined;
    
    const updatedVideo = { ...existingVideo, ...videoUpdate };
    this.videos.set(id, updatedVideo);
    return updatedVideo;
  }

  async listVideos(limit: number = 10, offset: number = 0): Promise<Video[]> {
    return Array.from(this.videos.values())
      .sort((a, b) => {
        const dateA = a.createdAt?.getTime() || 0;
        const dateB = b.createdAt?.getTime() || 0;
        return dateB - dateA;
      })
      .slice(offset, offset + limit);
  }

  // Download operations
  async getDownload(id: number): Promise<Download | undefined> {
    return this.downloads.get(id);
  }

  async getDownloadByVideoId(videoId: string): Promise<Download | undefined> {
    return Array.from(this.downloads.values()).find(
      (download) => download.videoId === videoId,
    );
  }

  async createDownload(download: InsertDownload): Promise<Download> {
    const id = this.currentDownloadId++;
    const now = new Date();
    const newDownload: Download = { 
      ...download, 
      id, 
      startedAt: now,
      completedAt: null 
    };
    this.downloads.set(id, newDownload);
    return newDownload;
  }

  async updateDownload(id: number, downloadUpdate: Partial<Download>): Promise<Download | undefined> {
    const existingDownload = this.downloads.get(id);
    if (!existingDownload) return undefined;
    
    const updatedDownload = { ...existingDownload, ...downloadUpdate };
    this.downloads.set(id, updatedDownload);
    return updatedDownload;
  }

  async listDownloads(limit: number = 10, offset: number = 0): Promise<Download[]> {
    return Array.from(this.downloads.values())
      .sort((a, b) => {
        const dateA = a.startedAt?.getTime() || 0;
        const dateB = b.startedAt?.getTime() || 0;
        return dateB - dateA;
      })
      .slice(offset, offset + limit);
  }

  async listInProgressDownloads(): Promise<Download[]> {
    return Array.from(this.downloads.values())
      .filter((download) => download.status === "downloading")
      .sort((a, b) => {
        const dateA = a.startedAt?.getTime() || 0;
        const dateB = b.startedAt?.getTime() || 0;
        return dateB - dateA;
      });
  }

  // API Config operations
  async getApiConfig(): Promise<ApiConfig | undefined> {
    return this.apiConfig;
  }

  async saveApiConfig(config: InsertApiConfig): Promise<ApiConfig> {
    const id = this.currentApiConfigId;
    const now = new Date();
    this.apiConfig = { 
      ...config, 
      id, 
      updatedAt: now 
    };
    return this.apiConfig;
  }

  // Collection operations (stubs for compatibility)
  async getCollection(id: number): Promise<Collection | undefined> {
    return this.collections.get(id);
  }

  async createCollection(collection: InsertCollection): Promise<Collection> {
    const id = this.currentCollectionId++;
    const now = new Date();
    const newCollection: Collection = { 
      ...collection, 
      id, 
      createdAt: now,
      updatedAt: now
    };
    this.collections.set(id, newCollection);
    return newCollection;
  }

  async updateCollection(id: number, collectionUpdate: Partial<Collection>): Promise<Collection | undefined> {
    const existingCollection = this.collections.get(id);
    if (!existingCollection) return undefined;
    
    const updatedCollection = { 
      ...existingCollection, 
      ...collectionUpdate,
      updatedAt: new Date()
    };
    this.collections.set(id, updatedCollection);
    return updatedCollection;
  }

  async deleteCollection(id: number): Promise<boolean> {
    if (!this.collections.has(id)) return false;
    return this.collections.delete(id);
  }

  async listCollections(): Promise<Collection[]> {
    return Array.from(this.collections.values())
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  // Video-Collection operations
  async addVideoToCollection(videoId: number, collectionId: number): Promise<VideoCollection> {
    const key = `${videoId}-${collectionId}`;
    const now = new Date();
    const videoCollection: VideoCollection = {
      videoId,
      collectionId,
      addedAt: now
    };
    this.videoCollections.set(key, videoCollection);
    return videoCollection;
  }

  async removeVideoFromCollection(videoId: number, collectionId: number): Promise<boolean> {
    const key = `${videoId}-${collectionId}`;
    if (!this.videoCollections.has(key)) return false;
    return this.videoCollections.delete(key);
  }

  async getVideosInCollection(collectionId: number): Promise<Video[]> {
    const videoIds = Array.from(this.videoCollections.values())
      .filter(vc => vc.collectionId === collectionId)
      .map(vc => vc.videoId);
    
    if (videoIds.length === 0) return [];
    
    return Array.from(this.videos.values())
      .filter(video => videoIds.includes(video.id))
      .sort((a, b) => {
        const dateA = a.createdAt?.getTime() || 0;
        const dateB = b.createdAt?.getTime() || 0;
        return dateB - dateA;
      });
  }

  // Quality Preset operations
  async getQualityPreset(id: number): Promise<QualityPreset | undefined> {
    return this.qualityPresets.get(id);
  }

  async getDefaultQualityPreset(): Promise<QualityPreset | undefined> {
    const defaultPreset = Array.from(this.qualityPresets.values())
      .find(preset => preset.isDefault);
    
    if (defaultPreset) return defaultPreset;
    
    // If no default, return the first one
    if (this.qualityPresets.size > 0) {
      return Array.from(this.qualityPresets.values())[0];
    }
    
    return undefined;
  }

  async createQualityPreset(preset: InsertQualityPreset): Promise<QualityPreset> {
    const id = this.currentPresetId++;
    const now = new Date();
    
    // If this is set as default, clear other defaults
    if (preset.isDefault) {
      for (const existingPreset of this.qualityPresets.values()) {
        if (existingPreset.isDefault) {
          this.qualityPresets.set(existingPreset.id, {
            ...existingPreset,
            isDefault: false,
            updatedAt: now
          });
        }
      }
    }
    
    const newPreset: QualityPreset = {
      ...preset,
      id,
      createdAt: now,
      updatedAt: now
    };
    
    this.qualityPresets.set(id, newPreset);
    return newPreset;
  }

  async updateQualityPreset(id: number, presetUpdate: Partial<QualityPreset>): Promise<QualityPreset | undefined> {
    const existingPreset = this.qualityPresets.get(id);
    if (!existingPreset) return undefined;
    
    const now = new Date();
    
    // If this is being set as default, clear other defaults
    if (presetUpdate.isDefault) {
      for (const existingPreset of this.qualityPresets.values()) {
        if (existingPreset.isDefault && existingPreset.id !== id) {
          this.qualityPresets.set(existingPreset.id, {
            ...existingPreset,
            isDefault: false,
            updatedAt: now
          });
        }
      }
    }
    
    const updatedPreset = {
      ...existingPreset,
      ...presetUpdate,
      updatedAt: now
    };
    
    this.qualityPresets.set(id, updatedPreset);
    return updatedPreset;
  }

  async deleteQualityPreset(id: number): Promise<boolean> {
    const preset = this.qualityPresets.get(id);
    if (!preset) return false;
    
    // If deleting the default preset, set another as default
    if (preset.isDefault && this.qualityPresets.size > 1) {
      const anotherPreset = Array.from(this.qualityPresets.values())
        .find(p => p.id !== id);
      
      if (anotherPreset) {
        this.qualityPresets.set(anotherPreset.id, {
          ...anotherPreset,
          isDefault: true,
          updatedAt: new Date()
        });
      }
    }
    
    return this.qualityPresets.delete(id);
  }

  async listQualityPresets(): Promise<QualityPreset[]> {
    return Array.from(this.qualityPresets.values())
      .sort((a, b) => {
        // Default preset comes first
        if (a.isDefault && !b.isDefault) return -1;
        if (!a.isDefault && b.isDefault) return 1;
        // Then sort by name
        return a.name.localeCompare(b.name);
      });
  }

  async setDefaultQualityPreset(id: number): Promise<boolean> {
    const preset = this.qualityPresets.get(id);
    if (!preset) return false;
    
    const now = new Date();
    
    // Clear all defaults
    for (const existingPreset of this.qualityPresets.values()) {
      if (existingPreset.isDefault) {
        this.qualityPresets.set(existingPreset.id, {
          ...existingPreset,
          isDefault: false,
          updatedAt: now
        });
      }
    }
    
    // Set new default
    this.qualityPresets.set(id, {
      ...preset,
      isDefault: true,
      updatedAt: now
    });
    
    return true;
  }
  
  // Other required methods
  async deleteAllDownloads(): Promise<void> {
    this.downloads.clear();
  }
  
  // Batch Download operations
  
  async getBatchDownload(id: number): Promise<BatchDownload | undefined> {
    return this.batchDownloads.get(id);
  }

  async createBatchDownload(batch: InsertBatchDownload): Promise<BatchDownload> {
    const id = this.currentBatchId++;
    const now = new Date();
    const newBatch: BatchDownload = {
      ...batch,
      id,
      totalVideos: 0,
      completedVideos: 0,
      failedVideos: 0,
      status: "pending",
      createdAt: now,
      updatedAt: now,
      completedAt: null
    };
    this.batchDownloads.set(id, newBatch);
    return newBatch;
  }

  async updateBatchDownload(id: number, batchUpdate: Partial<BatchDownload>): Promise<BatchDownload | undefined> {
    const existingBatch = this.batchDownloads.get(id);
    if (!existingBatch) return undefined;
    
    const updatedBatch = {
      ...existingBatch,
      ...batchUpdate,
      updatedAt: new Date()
    };
    this.batchDownloads.set(id, updatedBatch);
    return updatedBatch;
  }

  async deleteBatchDownload(id: number): Promise<boolean> {
    if (!this.batchDownloads.has(id)) return false;
    
    // Delete associated batch items
    for (const [itemId, item] of this.batchDownloadItems.entries()) {
      if (item.batchId === id) {
        this.batchDownloadItems.delete(itemId);
      }
    }
    
    return this.batchDownloads.delete(id);
  }

  async listBatchDownloads(limit: number = 10, offset: number = 0): Promise<BatchDownload[]> {
    return Array.from(this.batchDownloads.values())
      .sort((a, b) => {
        const dateA = a.createdAt?.getTime() || 0;
        const dateB = b.createdAt?.getTime() || 0;
        return dateB - dateA;
      })
      .slice(offset, offset + limit);
  }

  async listActiveBatchDownloads(): Promise<BatchDownload[]> {
    return Array.from(this.batchDownloads.values())
      .filter(batch => batch.status === 'pending' || batch.status === 'in-progress')
      .sort((a, b) => {
        const dateA = a.createdAt?.getTime() || 0;
        const dateB = b.createdAt?.getTime() || 0;
        return dateB - dateA;
      });
  }
  
  // Batch Download Items operations
  async getBatchDownloadItem(id: number): Promise<BatchDownloadItem | undefined> {
    return this.batchDownloadItems.get(id);
  }

  async createBatchDownloadItem(item: InsertBatchDownloadItem): Promise<BatchDownloadItem> {
    const id = this.currentBatchItemId++;
    const now = new Date();
    const newItem: BatchDownloadItem = {
      ...item,
      id,
      downloadId: null,
      status: "pending",
      createdAt: now,
      updatedAt: now,
      error: null
    };
    this.batchDownloadItems.set(id, newItem);
    
    // Update batch totalVideos
    const batch = this.batchDownloads.get(item.batchId);
    if (batch) {
      this.batchDownloads.set(item.batchId, {
        ...batch,
        totalVideos: batch.totalVideos + 1,
        updatedAt: now
      });
    }
    
    return newItem;
  }

  async updateBatchDownloadItem(id: number, itemUpdate: Partial<BatchDownloadItem>): Promise<BatchDownloadItem | undefined> {
    const existingItem = this.batchDownloadItems.get(id);
    if (!existingItem) return undefined;
    
    const now = new Date();
    const updatedItem = {
      ...existingItem,
      ...itemUpdate,
      updatedAt: now
    };
    this.batchDownloadItems.set(id, updatedItem);
    
    // If status changed to completed or failed, update batch progress
    if (itemUpdate.status === 'completed' || itemUpdate.status === 'failed') {
      await this.updateBatchDownloadProgress(existingItem.batchId);
    }
    
    return updatedItem;
  }

  async getBatchDownloadItems(batchId: number): Promise<BatchDownloadItem[]> {
    return Array.from(this.batchDownloadItems.values())
      .filter(item => item.batchId === batchId)
      .sort((a, b) => a.order - b.order);
  }

  async deleteBatchDownloadItem(id: number): Promise<boolean> {
    const item = this.batchDownloadItems.get(id);
    if (!item) return false;
    
    const batchId = item.batchId;
    const deleted = this.batchDownloadItems.delete(id);
    
    if (deleted) {
      // Update batch counts
      const batch = this.batchDownloads.get(batchId);
      if (batch) {
        this.batchDownloads.set(batchId, {
          ...batch,
          totalVideos: batch.totalVideos - 1,
          updatedAt: new Date()
        });
        
        await this.updateBatchDownloadProgress(batchId);
      }
    }
    
    return deleted;
  }

  async updateBatchDownloadProgress(batchId: number): Promise<void> {
    const batch = this.batchDownloads.get(batchId);
    if (!batch) return;
    
    const items = Array.from(this.batchDownloadItems.values())
      .filter(item => item.batchId === batchId);
    
    const completedVideos = items.filter(item => item.status === 'completed').length;
    const failedVideos = items.filter(item => item.status === 'failed').length;
    const totalVideos = items.length;
    
    let status = 'pending';
    let completedAt = null;
    
    if (totalVideos === 0) {
      status = 'pending';
    } else if (completedVideos + failedVideos === totalVideos) {
      status = failedVideos === totalVideos ? 'failed' : 'completed';
      completedAt = new Date();
    } else if (completedVideos + failedVideos > 0) {
      status = 'in-progress';
    }
    
    this.batchDownloads.set(batchId, {
      ...batch,
      completedVideos,
      failedVideos,
      totalVideos,
      status,
      completedAt,
      updatedAt: new Date()
    });
  }
}

// Use a database storage implementation if DATABASE_URL exists, otherwise use memory storage
export const storage = process.env.DATABASE_URL 
  ? new DatabaseStorage() 
  : new MemStorage();
