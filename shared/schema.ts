import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Video schema
export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  videoId: text("video_id").notNull().unique(), // YouTube video ID
  title: text("title").notNull(),
  description: text("description"),
  channelTitle: text("channel_title"),
  thumbnailUrl: text("thumbnail_url"),
  publishedAt: text("published_at"),
  duration: text("duration"),
  viewCount: text("view_count"),
  downloadPath: text("download_path"),
  format: text("format").default("mp4"),
  quality: text("quality"),
  fileSize: integer("file_size"),
  isDownloaded: boolean("is_downloaded").default(false),
  isWatched: boolean("is_watched").default(false),
  downloadedAt: timestamp("downloaded_at"),
  metadata: jsonb("metadata"),
});

// Collection schema
export const collections = pgTable("collections", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  thumbnailUrl: text("thumbnail_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Video to collection mapping (many-to-many)
export const videoCollections = pgTable("video_collections", {
  id: serial("id").primaryKey(),
  videoId: integer("video_id").notNull().references(() => videos.id),
  collectionId: integer("collection_id").notNull().references(() => collections.id),
});

// Download task schema
export const downloadTasks = pgTable("download_tasks", {
  id: serial("id").primaryKey(),
  videoId: text("video_id").notNull(), // YouTube video ID
  title: text("title").notNull(),
  status: text("status").default("pending"), // pending, downloading, completed, failed
  progress: integer("progress").default(0),
  format: text("format").default("mp4"),
  quality: text("quality"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  fileSize: integer("file_size"),
  collectionId: integer("collection_id").references(() => collections.id),
});

// Insert schemas
export const insertVideoSchema = createInsertSchema(videos).omit({ 
  id: true 
});

export const insertCollectionSchema = createInsertSchema(collections).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertVideoCollectionSchema = createInsertSchema(videoCollections).omit({ 
  id: true 
});

export const insertDownloadTaskSchema = createInsertSchema(downloadTasks).omit({ 
  id: true, 
  progress: true, 
  status: true, 
  createdAt: true, 
  completedAt: true, 
  errorMessage: true 
});

// Types
export type Video = typeof videos.$inferSelect;
export type InsertVideo = z.infer<typeof insertVideoSchema>;

export type Collection = typeof collections.$inferSelect;
export type InsertCollection = z.infer<typeof insertCollectionSchema>;

export type VideoCollection = typeof videoCollections.$inferSelect;
export type InsertVideoCollection = z.infer<typeof insertVideoCollectionSchema>;

export type DownloadTask = typeof downloadTasks.$inferSelect;
export type InsertDownloadTask = z.infer<typeof insertDownloadTaskSchema>;

// YouTube API response types
export type YouTubeSearchResult = {
  id: {
    videoId: string;
  };
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: {
      default: { url: string; width: number; height: number };
      medium: { url: string; width: number; height: number };
      high: { url: string; width: number; height: number };
    };
    channelTitle: string;
    liveBroadcastContent: string;
  };
};

export type YouTubeVideoDetails = {
  id: string;
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: {
      default: { url: string; width: number; height: number };
      medium: { url: string; width: number; height: number };
      high: { url: string; width: number; height: number };
    };
    channelTitle: string;
    tags: string[];
    categoryId: string;
  };
  contentDetails: {
    duration: string;
    dimension: string;
    definition: string;
    caption: string;
    licensedContent: boolean;
    regionRestriction?: {
      allowed: string[];
      blocked: string[];
    };
  };
  statistics: {
    viewCount: string;
    likeCount: string;
    dislikeCount: string;
    favoriteCount: string;
    commentCount: string;
  };
};

export type DownloadFormat = {
  itag: number;
  qualityLabel?: string;
  bitrate?: number;
  audioBitrate?: number;
  container: string;
  codecs: string;
  hasVideo: boolean;
  hasAudio: boolean;
  quality: string;
  resolution?: string;
};

export type DownloadOptions = {
  videoId: string;
  format?: string;
  quality?: string;
  collectionId?: number;
};

export type DownloadProgress = {
  taskId: number;
  videoId: string;
  progress: number;
  status: string;
  speed?: string;
  eta?: string;
  size?: {
    total: number;
    transferred: number;
    totalMb?: string;
    transferredMb?: string;
  };
};
