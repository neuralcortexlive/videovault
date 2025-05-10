export interface Video {
  id: number;
  videoId: string;
  title: string;
  description: string | null;
  channelTitle: string | null;
  thumbnailUrl: string | null;
  publishedAt: string | null;
  duration: string | null;
  viewCount: string | null;
  isDownloaded: boolean;
  isWatched: boolean;
  fileSize: number | null;
  filePath: string | null;
  format: string | null;
  quality: string | null;
  metadata: unknown;
  createdAt: Date | null;
  updatedAt: Date | null;
  downloadedAt: Date | null;
} 