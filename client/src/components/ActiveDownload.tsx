import { formatDistanceToNow } from "date-fns";
import { DownloadTask } from "@shared/schema";
import { Pause, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import useWebSocket from "@/hooks/use-websocket";
import { useEffect, useState } from "react";

interface ActiveDownloadProps {
  downloadTask: DownloadTask;
  onCancel: (taskId: number) => void;
}

export default function ActiveDownload({ downloadTask, onCancel }: ActiveDownloadProps) {
  const { toast } = useToast();
  const [progress, setProgress] = useState(downloadTask.progress);
  const [transferredBytes, setTransferredBytes] = useState<string | undefined>();
  const [totalBytes, setTotalBytes] = useState<string | undefined>();
  const [speed, setSpeed] = useState<string | undefined>();
  const [remainingTime, setRemainingTime] = useState<string | undefined>();
  
  const socket = useWebSocket();
  
  useEffect(() => {
    if (!socket) return;
    
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === "downloadProgress" && data.data.taskId === downloadTask.id) {
          setProgress(data.data.progress);
          
          if (data.data.size) {
            setTransferredBytes(data.data.size.transferredMb);
            setTotalBytes(data.data.size.totalMb);
          }
          
          if (data.data.speed) {
            setSpeed(data.data.speed);
          }
          
          if (data.data.eta) {
            setRemainingTime(data.data.eta);
          }
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };
    
    socket.addEventListener("message", handleMessage);
    
    return () => {
      socket.removeEventListener("message", handleMessage);
    };
  }, [socket, downloadTask.id]);
  
  const handleCancel = async () => {
    try {
      await apiRequest('DELETE', `/api/youtube/download/${downloadTask.id}`);
      onCancel(downloadTask.id);
      
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
  
  const thumbnailUrl = `https://i.ytimg.com/vi/${downloadTask.videoId}/hqdefault.jpg`;
  
  const formattedDate = downloadTask.createdAt 
    ? formatDistanceToNow(new Date(downloadTask.createdAt), { addSuffix: true })
    : '';
  
  return (
    <div className="p-4 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-4">
        <img 
          src={thumbnailUrl} 
          alt={downloadTask.title} 
          className="w-32 h-18 object-cover rounded-lg"
        />
        
        <div className="flex-1">
          <div className="flex justify-between items-start mb-1">
            <h3 className="font-medium text-foreground/90">{downloadTask.title}</h3>
            <div className={`text-${progress === 100 ? 'emerald' : 'blue'}-400 text-sm font-medium flex items-center`}>
              <span>{progress}%</span>
              <button 
                className="ml-2 text-muted-foreground hover:text-primary transition-colors"
                onClick={handleCancel}
              >
                <Pause className="h-4 w-4" />
              </button>
              <button 
                className="ml-1 text-muted-foreground hover:text-primary transition-colors"
                onClick={handleCancel}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          <div className="text-muted-foreground text-sm mb-2">
            Started {formattedDate}
          </div>
          
          <div className="w-full bg-muted/50 rounded-full h-2 mb-1 overflow-hidden">
            <div 
              className={`${progress === 100 ? 'bg-emerald-500' : 'bg-blue-500'} h-2 rounded-full progress-bar`} 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {transferredBytes && totalBytes 
                ? `${transferredBytes} / ${totalBytes}` 
                : 'Calculating size...'}
            </span>
            <span>
              {speed && remainingTime 
                ? `${speed} - ${remainingTime}` 
                : 'Preparing download...'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}