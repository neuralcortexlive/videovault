import { pgTable, text, serial, integer, boolean, timestamp, json, primaryKey, jsonb, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  videoId: text("video_id").notNull().unique(),
  title: text("title").notNull(),
  channelTitle: text("channel_title").notNull(),
  description: text("description"),
  thumbnail: text("thumbnail"),
  duration: text("duration"),
  publishedAt: timestamp("published_at"),
  viewCount: integer("view_count"),
  likeCount: integer("like_count"),
  filepath: text("filepath"),
  filesize: integer("filesize"),
  quality: text("quality"),
  format: text("format"),
  downloaded: boolean("downloaded").default(false),
  downloadedAt: timestamp("downloaded_at"),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const videosRelations = relations(videos, ({ many }) => ({
  videoCollections: many(videoCollections)
}));

export const insertVideoSchema = createInsertSchema(videos).omit({
  id: true,
  createdAt: true,
});

export type InsertVideo = z.infer<typeof insertVideoSchema>;
export type Video = typeof videos.$inferSelect;

export const downloads = pgTable("downloads", {
  id: serial("id").primaryKey(),
  videoId: text("video_id").notNull(),
  status: text("status").notNull().default("pending"),
  progress: integer("progress").default(0),
  totalSize: doublePrecision("total_size"),
  downloadedSize: doublePrecision("downloaded_size"),
  error: text("error"),
  format: text("format"),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertDownloadSchema = createInsertSchema(downloads).omit({
  id: true,
  startedAt: true,
  completedAt: true,
});

export type InsertDownload = z.infer<typeof insertDownloadSchema>;
export type Download = typeof downloads.$inferSelect;

export const apiConfigs = pgTable("api_configs", {
  id: serial("id").primaryKey(),
  youtubeApiKey: text("youtube_api_key"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertApiConfigSchema = createInsertSchema(apiConfigs).omit({
  id: true,
  updatedAt: true,
});

export type InsertApiConfig = z.infer<typeof insertApiConfigSchema>;
export type ApiConfig = typeof apiConfigs.$inferSelect;

// Collections table (para organizar vídeos)
export const collections = pgTable("collections", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const collectionsRelations = relations(collections, ({ many }) => ({
  videoCollections: many(videoCollections)
}));

export const insertCollectionSchema = createInsertSchema(collections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCollection = z.infer<typeof insertCollectionSchema>;
export type Collection = typeof collections.$inferSelect;

// Tabela de associação entre vídeos e coleções
export const videoCollections = pgTable("video_collections", {
  videoId: integer("video_id").notNull().references(() => videos.id, { onDelete: 'cascade' }),
  collectionId: integer("collection_id").notNull().references(() => collections.id, { onDelete: 'cascade' }),
  addedAt: timestamp("added_at").defaultNow(),
}, (t) => ({
  pk: primaryKey({ columns: [t.videoId, t.collectionId] })
}));

export const videoCollectionsRelations = relations(videoCollections, ({ one }) => ({
  video: one(videos, {
    fields: [videoCollections.videoId],
    references: [videos.id]
  }),
  collection: one(collections, {
    fields: [videoCollections.collectionId],
    references: [collections.id]
  })
}));

export const insertVideoCollectionSchema = createInsertSchema(videoCollections).omit({
  addedAt: true
});

export type InsertVideoCollection = z.infer<typeof insertVideoCollectionSchema>;
export type VideoCollection = typeof videoCollections.$inferSelect;

// Quality Presets table for user-defined download settings
export const qualityPresets = pgTable("quality_presets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  format: text("format"),  // mp4, webm, etc.
  videoQuality: text("video_quality"), // e.g., 1080p, 720p, best, etc.
  audioQuality: text("audio_quality"), // e.g., best, 128K, etc.
  audioOnly: boolean("audio_only").default(false),
  videoOnly: boolean("video_only").default(false),
  extractSubtitles: boolean("extract_subtitles").default(false),
  additionalFlags: jsonb("additional_flags"), // For advanced users to store custom ytdlp flags
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertQualityPresetSchema = createInsertSchema(qualityPresets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertQualityPreset = z.infer<typeof insertQualityPresetSchema>;
export type QualityPreset = typeof qualityPresets.$inferSelect;

// Batch downloads table for managing multiple downloads as a group
export const batchDownloads = pgTable("batch_downloads", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("pending"), // pending, in-progress, completed, failed
  totalVideos: integer("total_videos").default(0),
  completedVideos: integer("completed_videos").default(0),
  failedVideos: integer("failed_videos").default(0),
  qualityPresetId: integer("quality_preset_id").references(() => qualityPresets.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const batchDownloadsRelations = relations(batchDownloads, ({ one, many }) => ({
  qualityPreset: one(qualityPresets, {
    fields: [batchDownloads.qualityPresetId],
    references: [qualityPresets.id]
  }),
  batchItems: many(batchDownloadItems)
}));

export const insertBatchDownloadSchema = createInsertSchema(batchDownloads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
  totalVideos: true,
  completedVideos: true,
  failedVideos: true,
});

export type InsertBatchDownload = z.infer<typeof insertBatchDownloadSchema>;
export type BatchDownload = typeof batchDownloads.$inferSelect;

// Batch download items table to track individual videos in a batch
export const batchDownloadItems = pgTable("batch_download_items", {
  id: serial("id").primaryKey(),
  batchId: integer("batch_id").notNull().references(() => batchDownloads.id, { onDelete: 'cascade' }),
  videoId: text("video_id").notNull(),
  title: text("title").notNull(),
  downloadId: integer("download_id").references(() => downloads.id),
  status: text("status").notNull().default("pending"), // pending, in-progress, completed, failed
  order: integer("order").default(0), // Position in the batch queue
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const batchDownloadItemsRelations = relations(batchDownloadItems, ({ one }) => ({
  batchDownload: one(batchDownloads, {
    fields: [batchDownloadItems.batchId],
    references: [batchDownloads.id]
  }),
  download: one(downloads, {
    fields: [batchDownloadItems.downloadId],
    references: [downloads.id]
  })
}));

export const insertBatchDownloadItemSchema = createInsertSchema(batchDownloadItems).omit({
  id: true,
  downloadId: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertBatchDownloadItem = z.infer<typeof insertBatchDownloadItemSchema>;
export type BatchDownloadItem = typeof batchDownloadItems.$inferSelect;
