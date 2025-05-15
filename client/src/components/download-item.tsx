import { DownloadAnimation } from './ui/download-animation';
import { Button } from './ui/button';
import { Trash2 } from 'lucide-react';

interface DownloadItemProps {
  download: {
    id: string;
    title: string;
    progress?: number;
    status: string;
  };
  onDelete: (id: string) => void;
}

export function DownloadItem({ download, onDelete }: DownloadItemProps) {
  const progress = download.progress || 0;
  const isComplete = download.status === 'completed';

  return (
    <div className="flex items-center gap-4 p-4 bg-card rounded-lg border">
      <DownloadAnimation progress={progress} isComplete={isComplete} />
      <div className="flex-1">
        <h3 className="font-medium">{download.title}</h3>
        <p className="text-sm text-muted-foreground">
          {download.status === 'completed' ? 'Download concluído' : `${progress}% concluído`}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(download.id)}
        className="text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
} 