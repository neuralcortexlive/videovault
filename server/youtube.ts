import axios from 'axios';
import { storage } from './storage';

const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3';

// YouTube API response types
interface YouTubeSearchResult {
  kind: string;
  etag: string;
  id: {
    kind: string;
    videoId: string;
  };
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    channelTitle: string;
    thumbnails: {
      default: { url: string; width: number; height: number };
      medium: { url: string; width: number; height: number };
      high: { url: string; width: number; height: number };
    };
  };
}

interface YouTubeSearchResponse {
  kind: string;
  etag: string;
  nextPageToken?: string;
  regionCode?: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
  items: YouTubeSearchResult[];
}

interface YouTubeVideoResponse {
  kind: string;
  etag: string;
  items: YouTubeVideoResult[];
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
}

interface YouTubeVideoResult {
  kind: string;
  etag: string;
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
      standard?: { url: string; width: number; height: number };
      maxres?: { url: string; width: number; height: number };
    };
    channelTitle: string;
    tags?: string[];
    categoryId: string;
  };
  contentDetails: {
    duration: string;
    dimension: string;
    definition: string;
    caption: string;
    licensedContent: boolean;
    contentRating: {};
  };
  statistics: {
    viewCount: string;
    likeCount: string;
    favoriteCount: string;
    commentCount: string;
  };
}

export interface VideoDetails {
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
  downloaded?: boolean;
  downloadedAt?: string;
}

export async function searchYouTubeVideos(
  query: string,
  apiKey: string,
  maxResults: number = 25,
  pageToken?: string
): Promise<{ videos: VideoDetails[]; nextPageToken?: string }> {
  try {
    const searchResponse = await axios.get<YouTubeSearchResponse>(
      `${YOUTUBE_API_BASE_URL}/search`,
      {
        params: {
          part: 'snippet',
          q: query,
          type: 'video',
          maxResults,
          pageToken,
          key: apiKey,
          order: 'date', // Sort by date (newest first)
        },
      }
    );

    if (!searchResponse.data.items.length) {
      return { videos: [] };
    }

    // Get video IDs from search results
    const videoIds = searchResponse.data.items.map(
      (item) => item.id.videoId
    ).join(',');

    // Get video details
    const videoResponse = await axios.get<YouTubeVideoResponse>(
      `${YOUTUBE_API_BASE_URL}/videos`,
      {
        params: {
          part: 'snippet,contentDetails,statistics',
          id: videoIds,
          key: apiKey,
        },
      }
    );

    // Map video details to our format
    const videos = await Promise.all(videoResponse.data.items.map(async (item) => {
      const videoDetails = mapVideoDetails(item);
      
      // Verificar se o vídeo já foi baixado
      const storedVideo = await storage.getVideoByVideoId(videoDetails.videoId);
      if (storedVideo) {
        videoDetails.downloaded = storedVideo.downloaded || false;
        videoDetails.downloadedAt = storedVideo.downloadedAt?.toISOString();
      }
      
      return videoDetails;
    }));

    return {
      videos,
      nextPageToken: searchResponse.data.nextPageToken,
    };
  } catch (error) {
    console.error('Error searching YouTube videos:', error);
    throw error;
  }
}

export async function getVideoDetails(
  videoId: string,
  apiKey: string
): Promise<VideoDetails> {
  try {
    const response = await axios.get<YouTubeVideoResponse>(
      `${YOUTUBE_API_BASE_URL}/videos`,
      {
        params: {
          part: 'snippet,contentDetails,statistics',
          id: videoId,
          key: apiKey,
        },
      }
    );

    if (!response.data.items.length) {
      throw new Error(`Video with ID ${videoId} not found`);
    }

    return mapVideoDetails(response.data.items[0]);
  } catch (error) {
    console.error('Error fetching video details:', error);
    throw error;
  }
}

function mapVideoDetails(videoItem: YouTubeVideoResult): VideoDetails {
  return {
    videoId: videoItem.id,
    title: videoItem.snippet.title,
    description: videoItem.snippet.description,
    publishedAt: videoItem.snippet.publishedAt,
    channelId: videoItem.snippet.channelId,
    channelTitle: videoItem.snippet.channelTitle,
    thumbnail: videoItem.snippet.thumbnails.high?.url || videoItem.snippet.thumbnails.medium?.url || videoItem.snippet.thumbnails.default?.url,
    duration: videoItem.contentDetails.duration,
    viewCount: parseInt(videoItem.statistics.viewCount, 10) || 0,
    likeCount: parseInt(videoItem.statistics.likeCount, 10) || 0,
    tags: videoItem.snippet.tags,
  };
}
