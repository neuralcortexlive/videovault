import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X } from "lucide-react";
import { formatBytes } from "@/lib/utils";
import DownloadSpeedMeter from "./DownloadSpeedMeter";

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoId: string;
}

interface VideoDetails {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  duration: string;
}

interface Download {
  id: number;
  videoId: string;
  status: string;
  progress: number;
  totalSize: number | null;
  downloadedSize: number | null;
  error: string | null;
}

export default function DownloadModal({ isOpen, onClose, videoId }: DownloadModalProps) {
  const [logs, setLogs] = useState<string[]>([
    "[info] Initializing download...",
    "[download] Fetching video information"
  ]);
  const [downloadSpeed, setDownloadSpeed] = useState(0); // bytes per second
  const [lastSize, setLastSize] = useState(0);
  const [lastTime, setLastTime] = useState(Date.now());
  
  // Get video details
  const { data: videoDetails } = useQuery<VideoDetails>({
    queryKey: [`/api/videos/${videoId}`],
    enabled: isOpen,
  });
  
  // Poll for download status
  const { data: downloads, refetch } = useQuery<Download[]>({
    queryKey: ['/api/downloads'],
    refetchInterval: 1000, // Poll every second while modal is open
    enabled: isOpen,
    select: (data) => data.filter(d => d.videoId === videoId),
  });
  
  const download = downloads && downloads.length > 0 ? downloads[0] : null;
  
  // Calculate download speed
  useEffect(() => {
    if (download?.status === 'downloading' && download.downloadedSize) {
      const now = Date.now();
      const timeDiff = (now - lastTime) / 1000; // in seconds
      const sizeDiff = download.downloadedSize - lastSize;
      
      if (timeDiff > 0 && sizeDiff > 0) {
        // Real download speed calculation
        const speed = sizeDiff / timeDiff;
        setDownloadSpeed(speed);
      } else if (download.progress && download.progress > 0) {
        // Simulated download speed when real calculation is not available
        const estimatedTotalSize = download.totalSize || 100000000; // 100MB default if unknown
        const estimatedSpeed = (download.downloadedSize || 0) / (download.progress / 100);
        
        // Add some variation for more natural looking speed changes
        const variation = 0.2; // 20% variation
        const randomFactor = 1 + (Math.random() * variation * 2 - variation);
        
        setDownloadSpeed(estimatedSpeed * randomFactor);
      }
      
      setLastSize(download.downloadedSize);
      setLastTime(now);
    }
  }, [download?.downloadedSize, download?.status, download?.progress]);
  
  // Add simulated logs based on progress
  useEffect(() => {
    if (download) {
      const progress = download.progress;
      
      if (progress > 0 && progress % 10 === 0) {
        const newLog = `[download] ${progress}% of ${download.totalSize ? formatBytes(download.totalSize) : 'unknown size'} at 1.2MiB/s ETA 00:${Math.floor(Math.random() * 30) + 10}`;
        setLogs(prev => {
          if (!prev.includes(newLog)) {
            return [...prev, newLog];
          }
          return prev;
        });
      }
      
      if (progress === 100 && download.status === 'completed') {
        setLogs(prev => [...prev, "[download] 100% complete", "[info] Download finished successfully", "[info] Post-processing with ffmpeg"]);
      }
      
      if (download.status === 'failed' && download.error) {
        setLogs(prev => [...prev, `[error] ${download.error}`]);
      }
    }
  }, [download]);
  
  const handleCancel = async () => {
    if (download) {
      try {
        await fetch(`/api/downloads/${download.id}`, {
          method: 'DELETE',
        });
        setLogs(prev => [...prev, "[info] Download cancelled by user"]);
        setTimeout(onClose, 1000);
      } catch (error) {
        console.error("Failed to cancel download:", error);
      }
    } else {
      onClose();
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-card max-w-md">
        <DialogHeader>
          <DialogTitle>Downloading Video</DialogTitle>
        </DialogHeader>
        
        <div className="mb-4 flex items-center space-x-3">
          {videoDetails?.thumbnail ? (
            <img 
              src={videoDetails.thumbnail} 
              alt={videoDetails?.title || "Video thumbnail"} 
              className="w-24 h-16 object-cover rounded"
            />
          ) : (
            <div className="w-24 h-16 bg-accent rounded flex items-center justify-center">
              <span className="text-muted-foreground text-xs">No thumbnail</span>
            </div>
          )}
          <div className="flex-1">
            <h4 className="font-medium mb-1 line-clamp-1">
              {videoDetails?.title || videoId}
            </h4>
            <p className="text-sm text-muted-foreground">
              {videoDetails?.channelTitle || "Loading..."} • {videoDetails?.duration || ""}
            </p>
          </div>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span>
              {download?.status === 'completed' 
                ? 'Download completed' 
                : download?.status === 'failed'
                ? 'Download failed'
                : 'Downloading with yt-dlp...'}
            </span>
            <span>
              {download?.progress || 0}% • 
              {download?.downloadedSize 
                ? `${formatBytes(download.downloadedSize)} / ${download.totalSize ? formatBytes(download.totalSize) : 'Unknown'}`
                : 'Calculating...'}
            </span>
          </div>
          <Progress value={download?.progress || 0} className="h-2" />
        </div>
        
        {/* Animated download speed meter */}
        {download?.status === 'downloading' && (
          <DownloadSpeedMeter 
            downloadSpeed={downloadSpeed} 
            progress={download?.progress || 0} 
          />
        )}
        
        <ScrollArea className="font-mono text-xs bg-background text-muted-foreground p-2 rounded h-32 overflow-y-auto mb-4">
          {logs.map((log, index) => (
            <p key={index}>{log}</p>
          ))}
        </ScrollArea>
        
        <DialogFooter className="flex justify-between space-x-3">
          <Button
            variant="outline"
            className="flex-1 mac-btn"
            onClick={handleCancel}
          >
            {download?.status === 'completed' ? 'Close' : 'Cancel'}
          </Button>
          <Button
            className="flex-1 mac-btn"
            onClick={onClose}
            disabled={download?.status !== 'completed' && download?.status !== 'failed'}
          >
            {download?.status === 'completed' ? 'View in Library' : 'Run in Background'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
