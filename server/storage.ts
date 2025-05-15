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
  deleteAllDownloads(): Promise<void>;
  deleteDownload(id: number): Promise<boolean>;
  
  // API Config operations
  getApiConfig(): Promise<ApiConfig | undefined>;
  saveApiConfig(config: InsertApiConfig): Promise<ApiConfig>;
  getApiConfigs(): Promise<ApiConfig[]>;
  deleteAllApiConfigs(): Promise<void>;
  
  // Collection operations
  getCollection(id: number): Promise<Collection | undefined>;
  createCollection(collection: InsertCollection): Promise<Collection>;
  updateCollection(id: number, collection: Partial<Collection>): Promise<Collection | undefined>;
  deleteCollection(id: number): Promise<boolean>;
  listCollections(): Promise<Collection[]>;
  deleteAllCollections(): Promise<void>;
  
  // Video-Collection operations
  addVideoToCollection(videoId: number, collectionId: number): Promise<VideoCollection>;
  removeVideoFromCollection(videoId: number, collectionId: number): Promise<boolean>;
  getVideosInCollection(collectionId: number): Promise<Video[]>;
  getVideoCollections(): Promise<VideoCollection[]>;
  deleteAllVideoCollections(): Promise<void>;
  
  // Quality Preset operations
  getQualityPreset(id: number): Promise<QualityPreset | undefined>;
  getDefaultQualityPreset(): Promise<QualityPreset | undefined>;
  createQualityPreset(preset: InsertQualityPreset): Promise<QualityPreset>;
  updateQualityPreset(id: number, preset: Partial<QualityPreset>): Promise<QualityPreset | undefined>;
  deleteQualityPreset(id: number): Promise<boolean>;
  listQualityPresets(): Promise<QualityPreset[]>;
  setDefaultQualityPreset(id: number): Promise<boolean>;
  getQualityPresets(): Promise<QualityPreset[]>;
  deleteAllQualityPresets(): Promise<void>;
  
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
  updateBatchDownloadProgress(batchId: number): Promise<void>;
  deleteDownloadedVideos(): Promise<void>;
  deleteAllBatchDownloadItems(): Promise<void>;
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

  async updateVideo(id: number, video: Partial<Video>): Promise<Video | undefined> {
    const [updatedVideo] = await db
      .update(videos)
      .set(video)
      .where(eq(videos.id, id))
      .returning();
    return updatedVideo;
  }

  async listVideos(limit: number = 10, offset: number = 0): Promise<Video[]> {
    return await db
      .select()
      .from(videos)
      .where(eq(videos.downloaded, true))
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

  async updateDownload(id: number, download: Partial<Download>): Promise<Download | undefined> {
    const [updatedDownload] = await db
      .update(downloads)
      .set(download)
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
    try {
      console.log("Iniciando deleteAllDownloads");
      
      // Primeiro atualiza o status de todos os downloads ativos para "cancelled"
      console.log("Atualizando status dos downloads ativos para cancelled");
      await db
        .update(downloads)
        .set({ status: "cancelled" })
        .where(eq(downloads.status, "downloading"));

      // Então exclui todos os downloads
      console.log("Excluindo todos os downloads do banco de dados");
      await db.delete(downloads);
      
      console.log("deleteAllDownloads concluído com sucesso");
    } catch (error) {
      console.error("Erro ao excluir downloads:", error);
      throw error;
    }
  }
  
  async deleteDownload(id: number): Promise<boolean> {
    try {
      const result = await db.delete(downloads).where(eq(downloads.id, id));
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error("Erro ao deletar download:", error);
      return false;
    }
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

  async updateCollection(id: number, collection: Partial<Collection>): Promise<Collection | undefined> {
    const [updatedCollection] = await db
      .update(collections)
      .set(collection)
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

  async deleteAllCollections(): Promise<void> {
    // Primeiro remove todas as relações de vídeos com coleções
    await db.delete(videoCollections);
    // Então remove todas as coleções
    await db.delete(collections);
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

  async updateQualityPreset(id: number, preset: Partial<QualityPreset>): Promise<QualityPreset | undefined> {
    // If this preset is being set as default, clear default flag from other presets
    if (preset.isDefault) {
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
        ...preset,
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

  async updateBatchDownload(id: number, batch: Partial<BatchDownload>): Promise<BatchDownload | undefined> {
    const [updatedBatch] = await db
      .update(batchDownloads)
      .set({ 
        ...batch,
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

  async updateBatchDownloadItem(id: number, item: Partial<BatchDownloadItem>): Promise<BatchDownloadItem | undefined> {
    const [updatedItem] = await db
      .update(batchDownloadItems)
      .set({ 
        ...item,
        updatedAt: new Date() 
      })
      .where(eq(batchDownloadItems.id, id))
      .returning();
    
    // If status changed to completed or failed, update batch progress
    if (item.status === 'completed' || item.status === 'failed') {
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

  async deleteDownloadedVideos(): Promise<void> {
    await db.delete(videos).where(eq(videos.downloaded, true));
  }

  // Video Collections
  async getVideoCollections(): Promise<VideoCollection[]> {
    return await db
      .select()
      .from(videoCollections)
      .orderBy(desc(videoCollections.addedAt));
  }

  async deleteAllVideoCollections(): Promise<void> {
    await db.delete(videoCollections);
  }

  // Quality Presets
  async getQualityPresets(): Promise<QualityPreset[]> {
    return await db
      .select()
      .from(qualityPresets)
      .orderBy(desc(qualityPresets.createdAt));
  }

  async deleteAllQualityPresets(): Promise<void> {
    await db.delete(qualityPresets);
  }

  // Batch Download Items
  async deleteAllBatchDownloadItems(): Promise<void> {
    await db.delete(batchDownloadItems);
  }

  // API Configs
  async getApiConfigs(): Promise<ApiConfig[]> {
    return await db
      .select()
      .from(apiConfigs)
      .orderBy(desc(apiConfigs.updatedAt));
  }

  async deleteAllApiConfigs(): Promise<void> {
    await db.delete(apiConfigs);
  }
}

export const storage = new DatabaseStorage();
