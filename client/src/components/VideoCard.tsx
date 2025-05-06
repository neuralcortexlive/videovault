import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Download, Plus, Play, Pause } from "lucide-react";
import { Video, YouTubeSearchResult } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import DownloadModal from "./DownloadModal";
import CollectionModal from "./CollectionModal";

interface VideoCardProps {
  video: Video | YouTubeSearchResult;
  isDownloaded?: boolean;
  isDownloading?: boolean;
  onPlay?: () => void;
  showCollectionButton?: boolean;
}

export default function VideoCard({ 
  video, 
  isDownloaded = false, 
  isDownloading = false,
  onPlay,
  showCollectionButton = true
}: VideoCardProps) {
  const { toast } = useToast();
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  
  const isYouTubeResult = 'snippet' in video;
  
  // Extract video data based on the type
  const videoId = isYouTubeResult ? video.id.videoId : video.videoId;
  const title = isYouTubeResult ? video.snippet.title : video.title;
  const channelTitle = isYouTubeResult ? video.snippet.channelTitle : video.channelTitle || '';
  const thumbnailUrl = isYouTubeResult 
    ? video.snippet.thumbnails.high.url 
    : video.thumbnailUrl || '';
  const publishedAt = isYouTubeResult ? video.snippet.publishedAt : video.publishedAt;
  
  // Format the published date if available
  const formattedDate = publishedAt ? formatDistanceToNow(new Date(publishedAt), { addSuffix: true }) : '';

  const handleDownload = () => {
    setShowDownloadModal(true);
  };

  const handleAddToCollection = () => {
    setShowCollectionModal(true);
  };

  const handleCancelDownload = async () => {
    try {
      await apiRequest('DELETE', `/api/youtube/download/${video.id}`);
      toast({
        title: "Download Canceled",
        description: "The download has been canceled successfully."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel download. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Calculate a fake duration for demo (would normally come from the API)
  const durationMinutes = Math.floor(Math.random() * 20) + 5;
  const durationSeconds = Math.floor(Math.random() * 60);
  const durationFormatted = `${durationMinutes}:${durationSeconds.toString().padStart(2, '0')}`;

  return (
    <>
      <div className="bg-white rounded-lg shadow overflow-hidden video-card-hover transition-all duration-200">
        <div className="relative">
          <img 
            src={thumbnailUrl} 
            alt={`${title} thumbnail`} 
            className="w-full h-40 object-cover"
          />
          
          <span className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white text-xs px-1 rounded">
            {durationFormatted}
          </span>
          
          {isDownloaded && (
            <div className="absolute top-2 left-2 bg-[#00A551] text-white text-xs px-1 py-0.5 rounded-sm">
              DOWNLOADED
            </div>
          )}
          
          {isDownloading && (
            <div className="absolute top-2 left-2 bg-accent text-white text-xs px-1 py-0.5 rounded-sm">
              DOWNLOADING
            </div>
          )}
          
          <button 
            className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black bg-opacity-50 transition-opacity duration-200"
            onClick={() => {
              console.log("Play button clicked for video:", videoId);
              if (onPlay) {
                onPlay();
              } else {
                // If no onPlay prop, open YouTube video in a new tab
                window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
              }
            }}
          >
            <Play className="text-white h-12 w-12" />
          </button>
        </div>
        
        <div className="p-3">
          <h3 className="font-medium text-sm line-clamp-2 h-10">{title}</h3>
          
          <div className="flex justify-between items-center mt-2">
            <div className="text-gray-500 text-xs">
              {channelTitle} {formattedDate ? `• ${formattedDate}` : ''}
            </div>
            
            <div className="flex space-x-1">
              {isDownloading ? (
                <button 
                  title="Cancel download" 
                  className="text-accent"
                  onClick={handleCancelDownload}
                >
                  <Pause className="h-5 w-5" />
                </button>
              ) : isDownloaded ? (
                <button 
                  title="Play downloaded version" 
                  className="text-[#00A551]"
                  onClick={() => {
                    console.log("Small play button clicked for video:", videoId);
                    if (onPlay) {
                      onPlay();
                    } else {
                      // If no onPlay prop, open YouTube video in a new tab
                      window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
                    }
                  }}
                >
                  <Play className="h-5 w-5" />
                </button>
              ) : (
                <button 
                  title="Download" 
                  className="text-gray-500 hover:text-primary"
                  onClick={handleDownload}
                >
                  <Download className="h-5 w-5" />
                </button>
              )}
              
              {showCollectionButton && (
                <button 
                  title="Add to collection" 
                  className="text-gray-500 hover:text-accent"
                  onClick={handleAddToCollection}
                >
                  <Plus className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <DownloadModal
        open={showDownloadModal}
        onOpenChange={setShowDownloadModal}
        videoId={videoId}
        title={title}
        thumbnailUrl={thumbnailUrl}
        channelTitle={channelTitle}
      />

      <CollectionModal
        open={showCollectionModal}
        onOpenChange={setShowCollectionModal}
        videoId={videoId}
      />
    </>
  );
}
