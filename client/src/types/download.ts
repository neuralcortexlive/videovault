export interface Download {
  id: number;
  videoId: string;
  title: string;
  status: string;
  progress: number;
  totalSize: number | null;
  downloadedSize: number | null;
  error: string | null;
  format: string | null;
  startedAt: string;
  completedAt: string | null;
} 