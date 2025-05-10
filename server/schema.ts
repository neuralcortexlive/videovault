import { pgTable, serial, text, boolean, integer, jsonb, timestamp } from "drizzle-orm/pg-core";

export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  videoId: text("video_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  channelTitle: text("channel_title"),
  thumbnailUrl: text("thumbnail_url"),
  publishedAt: text("published_at"),
  duration: text("duration"),
  viewCount: text("view_count"),
  isDownloaded: boolean("is_downloaded").notNull().default(false),
  isWatched: boolean("is_watched").notNull().default(false),
  fileSize: integer("file_size"),
  filePath: text("file_path"),
  format: text("format"),
  quality: text("quality"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  downloadedAt: timestamp("downloaded_at")
}); 