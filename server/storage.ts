import { supabase } from './db';
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
    const { data } = await supabase.from('videos').select('*').eq('id', id).single();
    return data || undefined;
  }

  async getVideoByYouTubeId(videoId: string): Promise<Video | undefined> {
    const { data } = await supabase.from('videos').select('*').eq('video_id', videoId).single();
    return data || undefined;
  }

  async getAllVideos(): Promise<Video[]> {
    const { data } = await supabase.from('videos').select('*');
    return data || [];
  }

  async createVideo(video: Omit<Video, 'id'>): Promise<Video> {
    const { data, error } = await supabase.from('videos').insert([video]).select().single();
    if (error) throw error;
    return data;
  }

  async updateVideo(id: number, video: Partial<Video>): Promise<Video | undefined> {
    const { data } = await supabase.from('videos').update(video).eq('id', id).select().single();
    return data || undefined;
  }

  async deleteVideo(id: number): Promise<boolean> {
    try {
      // Delete video collections first
      await supabase.from('video_collections').delete().eq('video_id', id);
      
      // Then delete the video
      const { error } = await supabase.from('videos').delete().eq('id', id);
      return !error;
    } catch (error) {
      return false;
    }
  }

  // Collections
  async getCollection(id: number): Promise<Collection | undefined> {
    const { data } = await supabase.from('collections').select('*').eq('id', id).single();
    return data || undefined;
  }

  async getAllCollections(): Promise<Collection[]> {
    const { data } = await supabase.from('collections').select('*');
    return data || [];
  }

  async createCollection(collection: Omit<Collection, 'id' | 'createdAt' | 'updatedAt'>): Promise<Collection> {
    const { data, error } = await supabase.from('collections').insert([collection]).select().single();
    if (error) throw error;
    return data;
  }

  async updateCollection(id: number, collection: Partial<Collection>): Promise<Collection | undefined> {
    const { data } = await supabase
      .from('collections')
      .update({ ...collection, updated_at: new Date() })
      .eq('id', id)
      .select()
      .single();
    return data || undefined;
  }

  async deleteCollection(id: number): Promise<boolean> {
    try {
      // Delete video collections first
      await supabase.from('video_collections').delete().eq('collection_id', id);
      
      // Then delete the collection
      const { error } = await supabase.from('collections').delete().eq('id', id);
      return !error;
    } catch (error) {
      return false;
    }
  }

  // Video Collections
  async getVideoCollections(collectionId: number): Promise<Video[]> {
    const { data } = await supabase
      .from('video_collections')
      .select('videos(*)')
      .eq('collection_id', collectionId);
    
    return (data || []).map(vc => vc.videos);
  }

  async addVideoToCollection(videoId: number, collectionId: number): Promise<VideoCollection> {
    // Check if it already exists
    const { data: existing } = await supabase
      .from('video_collections')
      .select('*')
      .eq('video_id', videoId)
      .eq('collection_id', collectionId)
      .single();
    
    if (existing) return existing;
    
    const { data, error } = await supabase
      .from('video_collections')
      .insert([{ video_id: videoId, collection_id: collectionId }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async removeVideoFromCollection(videoId: number, collectionId: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('video_collections')
        .delete()
        .eq('video_id', videoId)
        .eq('collection_id', collectionId);
      
      return !error;
    } catch (error) {
      return false;
    }
  }

  // Download Tasks
  async getDownloadTask(id: number): Promise<DownloadTask | undefined> {
    const { data } = await supabase.from('download_tasks').select('*').eq('id', id).single();
    return data || undefined;
  }

  async getActiveDownloadTasks(): Promise<DownloadTask[]> {
    const { data } = await supabase
      .from('download_tasks')
      .select('*')
      .in('status', ['pending', 'downloading'])
      .order('progress', { ascending: false })
      .order('created_at', { ascending: false });
    
    return data || [];
  }

  async getCompletedDownloadTasks(): Promise<DownloadTask[]> {
    const { data } = await supabase
      .from('download_tasks')
      .select('*')
      .in('status', ['completed', 'failed'])
      .order('completed_at', { ascending: false });
    
    return data || [];
  }

  async createDownloadTask(task: Omit<DownloadTask, 'id' | 'status' | 'progress' | 'createdAt' | 'completedAt'>): Promise<DownloadTask> {
    const { data, error } = await supabase
      .from('download_tasks')
      .insert([{ ...task, status: 'pending', progress: 0 }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateDownloadTask(id: number, task: Partial<DownloadTask>): Promise<DownloadTask | undefined> {
    // If status changed to completed or failed, set completedAt
    if (task.status === 'completed' || task.status === 'failed') {
      task.completedAt = new Date();
    }
    
    const { data } = await supabase
      .from('download_tasks')
      .update(task)
      .eq('id', id)
      .select()
      .single();
    
    return data || undefined;
  }

  async updateDownloadProgress(id: number, progress: Partial<DownloadProgress>): Promise<DownloadTask | undefined> {
    const updateData: any = {};
    
    if (progress.progress !== undefined) {
      updateData.progress = progress.progress;
    }
    
    if (progress.status !== undefined) {
      updateData.status = progress.status;
      
      if (progress.status === 'completed' || progress.status === 'failed') {
        updateData.completed_at = new Date();
      }
    }
    
    const { data } = await supabase
      .from('download_tasks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    return data || undefined;
  }

  async deleteDownloadTask(id: number): Promise<boolean> {
    try {
      const { error } = await supabase.from('download_tasks').delete().eq('id', id);
      return !error;
    } catch (error) {
      return false;
    }
  }
}

// Initialize database with sample collections
export async function initializeDatabase() {
  const { data: existingCollections } = await supabase.from('collections').select('*');
  
  if (!existingCollections?.length) {
    // Add default collections
    await supabase.from('collections').insert([
      { name: "Educational", description: "Educational videos" },
      { name: "Music Videos", description: "Music videos collection" },
      { name: "Tutorials", description: "Tutorial videos" },
      { name: "Documentaries", description: "Documentary videos" }
    ]);
  }
}

// Use the database storage
export const storage = new DatabaseStorage();