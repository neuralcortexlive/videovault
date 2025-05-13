import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';

export interface Video {
  videoId: string;
  title: string;
  description: string;
  publishedAt: string;
  channelId: string;
  channelTitle: string;
  thumbnail: string;
  duration: string;
  viewCount: number;
  likeCount: number;
  tags?: string[];
}

export interface SearchResponse {
  videos: Video[];
  nextPageToken?: string;
}

export interface ApiConfig {
  youtubeApiKey: string;
}

// Hook to fetch YouTube API configuration
export function useApiConfig() {
  return useQuery<ApiConfig>({
    queryKey: ['/api/config'],
  });
}

// Hook to search YouTube videos
export function useYoutubeSearch(query: string, pageToken?: string) {
  return useQuery<SearchResponse>({
    queryKey: ['/api/search', { q: query, pageToken }],
    enabled: !!query,
  });
}

// Hook to fetch video details by ID
export function useVideoDetails(videoId: string) {
  return useQuery<Video>({
    queryKey: [`/api/videos/${videoId}`],
    enabled: !!videoId,
  });
}

// Hook to save API configuration
export function useSaveApiConfig() {
  return useMutation({
    mutationFn: async (config: { youtubeApiKey: string }) => {
      const response = await apiRequest('POST', '/api/config', config);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/config'] });
    },
  });
}
