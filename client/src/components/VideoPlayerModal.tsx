import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Video } from "@shared/schema";
import NativeVideoPlayer from "@/components/NativeVideoPlayer";

interface VideoPlayerModalProps {
  video: Video | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function VideoPlayerModal({ video, open, onOpenChange }: VideoPlayerModalProps) {
  if (!video) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full p-4 bg-card">
        <div className="bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 overflow-hidden">
          <NativeVideoPlayer video={video} />
          <div className="p-4">
            <h3 className="font-medium">{video.title}</h3>
            <p className="text-sm text-muted-foreground">{video.channelTitle || 'Sem canal'}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 