import { useState } from "react";
import { Play, Download, CheckCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { parseDuration, formatViewCount } from "@/lib/utils";
import VideoDetailModal from "@/components/VideoDetailModal";
import { Badge } from "@/components/ui/badge";
import { useDeleteVideo } from "@/hooks/useDeleteVideo";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

export interface VideoCardProps {
  video: {
    id: number;
    videoId: string;
    title: string;
    channelTitle: string;
    thumbnail: string;
    publishedAt: string;
    viewCount: number;
    duration: string;
    downloaded?: boolean;
    deleted?: boolean;
  };
  onDownload: (videoId: string) => void;
  onSelect?: (video: any) => void;
}

export default function VideoCard({ video, onDownload, onSelect }: VideoCardProps) {
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const deleteVideo = useDeleteVideo();
  
  const formattedDuration = parseDuration(video.duration);
  const formattedViewCount = formatViewCount(video.viewCount);
  const publishedTimeAgo = formatDistanceToNow(new Date(video.publishedAt), { addSuffix: true });
  
  const handleDelete = async () => {
    try {
      await deleteVideo.mutateAsync(video.id);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Erro ao deletar vídeo:", error);
    }
  };

  return (
    <>
      <div className={`bg-card rounded-lg overflow-hidden shadow-md video-card flex flex-col h-full relative group ${video.deleted ? 'opacity-50' : ''}`}>
        <div className="relative">
          <img 
            src={video.thumbnail} 
            alt={video.title} 
            className="w-full aspect-video object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = `https://via.placeholder.com/480x360/1A1A1A/8E8E93?text=No+Thumbnail`;
            }}
          />
          {formattedDuration && (
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 px-1 rounded text-xs">
              {formattedDuration}
            </div>
          )}
          {video.downloaded && !video.deleted && (
            <div className="absolute top-2 right-2 bg-green-500 bg-opacity-90 px-2 py-1 rounded text-xs text-white flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              <span>Baixado</span>
            </div>
          )}
          {video.deleted && (
            <div className="absolute top-2 right-2 bg-red-500 bg-opacity-90 px-2 py-1 rounded text-xs text-white flex items-center gap-1">
              <Trash2 className="h-3 w-3" />
              <span>Deletado</span>
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
          <div className="flex gap-2">
            <Button 
              variant="default" 
              size="sm" 
              className="text-xs"
              onClick={() => onDownload(video.videoId)}
              disabled={video.downloaded || video.deleted}
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

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar Vídeo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar este vídeo? Esta ação irá:
              <ul className="list-disc list-inside mt-2">
                <li>Remover o arquivo de vídeo do seu computador</li>
                <li>Remover o arquivo de metadados</li>
                <li>Marcar o vídeo como deletado na biblioteca</li>
              </ul>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
