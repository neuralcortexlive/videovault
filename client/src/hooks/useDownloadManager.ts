import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';

export interface Download {
  id: number;
  videoId: string;
  status: string;
  progress: number;
  totalSize: number | null;
  downloadedSize: number | null;
  error: string | null;
  format: string;
  startedAt: string;
  completedAt: string | null;
}

export interface DownloadOptions {
  videoId: string;
  format?: string;
  quality?: string;
  audioOnly?: boolean;
  saveMetadata?: boolean;
}

// Hook to fetch all downloads
export function useDownloads() {
  return useQuery<Download[]>({
    queryKey: ['/api/downloads'],
    refetchInterval: 5000, // Refetch every 5 seconds
  });
}

// Hook to fetch active (in-progress) downloads
export function useActiveDownloads() {
  return useQuery<Download[]>({
    queryKey: ['/api/downloads/active'],
    refetchInterval: 2000, // Refetch more frequently for active downloads
  });
}

// Hook to fetch a specific download by video ID
export function useDownloadByVideoId(videoId: string) {
  return useQuery<Download | undefined>({
    queryKey: ['/api/downloads', { videoId }],
    select: (downloads: Download[]) => 
      downloads.find(download => download.videoId === videoId),
    enabled: !!videoId,
  });
}

// Hook to start a new download
export function useStartDownload() {
  return useMutation({
    mutationFn: async (options: DownloadOptions) => {
      const response = await apiRequest('POST', '/api/downloads', options);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/downloads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/downloads/active'] });
    },
  });
}

// Hook to cancel a download
export function useCancelDownload() {
  return useMutation({
    mutationFn: async (downloadId: number) => {
      const response = await apiRequest('DELETE', `/api/downloads/${downloadId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/downloads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/downloads/active'] });
    },
  });
}
