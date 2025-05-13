import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Download, Plus, Play, Pause } from "lucide-react";
import { Video, YouTubeSearchResult } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import DownloadModal from "./DownloadModal";
import CollectionModal from "./CollectionModal";
import VideoPlayer from "./VideoPlayer";

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
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  
  const isYouTubeResult = 'snippet' in video;
  
  const videoId = isYouTubeResult ? video.id.videoId : video.videoId;
  const title = isYouTubeResult ? video.snippet.title : video.title;
  const channelTitle = isYouTubeResult ? video.snippet.channelTitle : video.channelTitle || '';
  const thumbnailUrl = isYouTubeResult 
    ? video.snippet.thumbnails.high.url 
    : video.thumbnailUrl || '';
  const publishedAt = isYouTubeResult ? video.snippet.publishedAt : video.publishedAt;
  
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

  const durationMinutes = Math.floor(Math.random() * 20) + 5;
  const durationSeconds = Math.floor(Math.random() * 60);
  const durationFormatted = `${durationMinutes}:${durationSeconds.toString().padStart(2, '0')}`;

  return (
    <>
      <div className="bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 overflow-hidden hover:border-border/80 transition-all duration-200">
        <div className="relative">
          <img 
            src={thumbnailUrl} 
            alt={`${title} thumbnail`} 
            className="w-full h-40 object-cover"
          />
          
          <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-0.5 rounded-md backdrop-blur-sm">
            {durationFormatted}
          </span>
          
          {isDownloaded && (
            <div className="absolute top-2 left-2 bg-emerald-500/90 text-white text-xs px-2 py-0.5 rounded-md backdrop-blur-sm">
              DOWNLOADED
            </div>
          )}
          
          {isDownloading && (
            <div className="absolute top-2 left-2 bg-blue-500/90 text-white text-xs px-2 py-0.5 rounded-md backdrop-blur-sm">
              DOWNLOADING
            </div>
          )}
          
          <button 
            className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black/60 backdrop-blur-sm transition-opacity duration-200"
            onClick={() => {
              if (onPlay) {
                onPlay();
              } else {
                setShowVideoPlayer(true);
              }
            }}
          >
            <Play className="text-white h-12 w-12" />
          </button>
        </div>
        
        <div className="p-4">
          <h3 className="font-medium text-sm line-clamp-2 h-10 text-foreground/90">{title}</h3>
          
          <div className="flex justify-between items-center mt-2">
            <div className="text-muted-foreground text-xs">
              {channelTitle} {formattedDate ? `• ${formattedDate}` : ''}
            </div>
            
            <div className="flex space-x-1">
              {isDownloading ? (
                <button 
                  title="Cancel download" 
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                  onClick={handleCancelDownload}
                >
                  <Pause className="h-5 w-5" />
                </button>
              ) : isDownloaded ? (
                <button 
                  title="Reproduzir vídeo local" 
                  className="text-emerald-400 hover:text-emerald-300 transition-colors"
                  onClick={() => {
                    if (onPlay) {
                      onPlay();
                    }
                  }}
                >
                  <Play className="h-5 w-5" />
                </button>
              ) : (
                <button 
                  title="Download" 
                  className="text-muted-foreground hover:text-primary transition-colors"
                  onClick={handleDownload}
                >
                  <Download className="h-5 w-5" />
                </button>
              )}
              
              {showCollectionButton && (
                <button 
                  title="Add to collection" 
                  className="text-muted-foreground hover:text-primary transition-colors"
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

      {showVideoPlayer && (
        <VideoPlayer
          videoId={videoId}
          onClose={() => setShowVideoPlayer(false)}
        />
      )}
    </>
  );
}