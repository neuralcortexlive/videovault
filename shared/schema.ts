import { z } from "zod";

// Video schema
export const insertVideoSchema = z.object({
  videoId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  channelTitle: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  publishedAt: z.string().optional(),
  duration: z.string().optional(),
  viewCount: z.string().optional(),
  downloadPath: z.string().optional(),
  format: z.string().optional().default("mp4"),
  quality: z.string().optional(),
  fileSize: z.number().optional(),
  isDownloaded: z.boolean().optional().default(false),
  isWatched: z.boolean().optional().default(false),
  downloadedAt: z.date().optional(),
  metadata: z.any().optional()
});

// Collection schema
export const insertCollectionSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  thumbnailUrl: z.string().optional()
});

// Download task schema
export const insertDownloadTaskSchema = z.object({
  videoId: z.string(),
  title: z.string(),
  format: z.string().optional().default("mp4"),
  quality: z.string().optional(),
  collectionId: z.number().optional()
});

// Types from Prisma schema
export type Video = {
  id: number;
  videoId: string;
  title: string;
  description?: string | null;
  channelTitle?: string | null;
  thumbnailUrl?: string | null;
  publishedAt?: string | null;
  duration?: string | null;
  viewCount?: string | null;
  downloadPath?: string | null;
  format?: string | null;
  quality?: string | null;
  fileSize?: number | null;
  isDownloaded: boolean;
  isWatched: boolean;
  downloadedAt?: Date | null;
  metadata?: any | null;
};

export type Collection = {
  id: number;
  name: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type VideoCollection = {
  id: number;
  videoId: number;
  collectionId: number;
};

export type DownloadTask = {
  id: number;
  videoId: string;
  title: string;
  status: string;
  progress: number;
  format?: string | null;
  quality?: string | null;
  errorMessage?: string | null;
  createdAt: Date;
  completedAt?: Date | null;
  fileSize?: number | null;
  filePath?: string | null;
  collectionId?: number | null;
};

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