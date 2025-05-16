export interface Video {
  id: number;
  videoId: string;
  title: string;
  channelTitle: string;
  description: string | null;
  thumbnail: string | null;
  duration: string | null;
  publishedAt: Date | null;
  viewCount: number | null;
  likeCount: number | null;
  downloaded: boolean;
  deleted: boolean;
  deletedAt: Date | null;
  filepath: string | null;
  createdAt: Date;
  updatedAt: Date;
} 