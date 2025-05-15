import { useState } from "react";
import { Play, Download, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { parseDuration, formatViewCount } from "@/lib/utils";
import VideoDetailModal from "@/components/VideoDetailModal";
import { Badge } from "@/components/ui/badge";

export interface VideoCardProps {
  video: {
    videoId: string;
    title: string;
    channelTitle: string;
    thumbnail: string;
    publishedAt: string;
    viewCount: number;
    duration: string;
    downloaded?: boolean;
    downloadedAt?: string;
  };
  onDownload: (videoId: string) => void;
}

export default function VideoCard({ video, onDownload }: VideoCardProps) {
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  const formattedDuration = parseDuration(video.duration);
  const formattedViewCount = formatViewCount(video.viewCount);
  const publishedTimeAgo = formatDistanceToNow(new Date(video.publishedAt), { addSuffix: true });
  
  return (
    <>
      <div className="bg-card rounded-lg overflow-hidden shadow-md video-card flex flex-col h-full">
        <div className="relative">
          <img 
            src={video.thumbnail} 
            alt={video.title} 
            className="w-full aspect-video object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null; // Prevent infinite loop
              target.src = `https://via.placeholder.com/480x360/1A1A1A/8E8E93?text=No+Thumbnail`;
            }}
          />
          {formattedDuration && (
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 px-1 rounded text-xs">
              {formattedDuration}
            </div>
          )}
          {video.downloaded && (
            <div className="absolute top-2 right-2 bg-green-500 bg-opacity-90 px-2 py-1 rounded text-xs text-white flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              <span>Baixado</span>
            </div>
          )}
        </div>
        <div className="flex flex-col flex-1 p-3">
          <h3 className="font-medium text-sm line-clamp-2">{video.title}</h3>
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-muted-foreground">
              {video.channelTitle} • {formattedViewCount}
            </span>
            <span className="text-xs text-muted-foreground">{publishedTimeAgo}</span>
          </div>
        </div>
        <div className="p-2 border-t border-border flex justify-between mt-auto">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mac-btn flex items-center space-x-1 text-muted-foreground hover:text-foreground"
            onClick={() => setIsDetailModalOpen(true)}
          >
            <Play className="h-3.5 w-3.5 mr-1" />
            <span>Preview</span>
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            className="text-xs"
            onClick={() => onDownload(video.videoId)}
            disabled={video.downloaded}
          >
            {video.downloaded ? (
              <>
                <CheckCircle className="h-4 w-4 mr-1" />
                Já Baixado
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-1" />
                Baixar
              </>
            )}
          </Button>
        </div>
      </div>
      
      <VideoDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        videoId={video.videoId}
        onDownload={() => {
          onDownload(video.videoId);
          setIsDetailModalOpen(false);
        }}
      />
    </>
  );
}
