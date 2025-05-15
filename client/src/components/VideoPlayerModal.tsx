import { Dialog, DialogContent } from "@/components/ui/dialog";

interface VideoPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoId: string;
}

export default function VideoPlayerModal({ isOpen, onClose, videoId }: VideoPlayerModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-card max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <div className="aspect-video w-full">
          <video
            src={`/api/stream/${videoId}`}
            controls
            className="w-full h-full"
            autoPlay
          />
        </div>
      </DialogContent>
    </Dialog>
  );
} 