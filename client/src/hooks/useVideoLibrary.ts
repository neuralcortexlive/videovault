import { useQuery } from '@tanstack/react-query';

export interface Video {
  id: number;
  videoId: string;
  title: string;
  channelTitle: string;
  description: string;
  thumbnail: string;
  duration: string;
  publishedAt: Date;
  viewCount: number;
  likeCount: number;
  filepath: string;
  filesize: number;
  quality: string;
  format: string;
  downloaded: boolean;
  downloadedAt: Date;
  metadata: any;
  createdAt: Date;
}

// Hook to fetch all videos in the library
export function useVideoLibrary(limit: number = 20, offset: number = 0) {
  return useQuery<Video[]>({
    queryKey: ['/api/library', { limit, offset }],
  });
}

// Hook to fetch a specific video by ID
export function useVideoById(id: number) {
  return useQuery<Video>({
    queryKey: [`/api/library/${id}`],
    enabled: !!id,
  });
}

// Hook to search videos in the library
export function useSearchLibrary(searchTerm: string) {
  return useQuery<Video[]>({
    queryKey: ['/api/library'],
    select: (videos) => {
      if (!searchTerm) return videos;
      
      const term = searchTerm.toLowerCase();
      return videos.filter(
        video => 
          video.title.toLowerCase().includes(term) || 
          video.channelTitle.toLowerCase().includes(term) ||
          video.description?.toLowerCase().includes(term)
      );
    },
  });
}

// Hook to get downloaded videos
export function useDownloadedVideos() {
  return useQuery<Video[]>({
    queryKey: ['/api/library'],
    select: (videos) => videos.filter(video => video.downloaded),
  });
}
