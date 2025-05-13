import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, History as HistoryIcon, Calendar, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useClearAllDownloads } from "@/hooks/useCollections";

interface Video {
  id: number;
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  createdAt: string;
}

export default function History() {
  const { data: videos, isLoading, error, refetch } = useQuery<Video[]>({
    queryKey: ['/api/library'],
  });
  
  const clearMutation = useClearAllDownloads();
  const { toast } = useToast();
  
  const handleClearAllDownloads = async () => {
    try {
      await clearMutation.mutateAsync();
      toast({
        title: "Downloads cleared",
        description: "All download history has been cleared successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear download history. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  if (isLoading) {
    return (
      <div className="p-4">
        <h2 className="text-2xl font-semibold mb-4">History</h2>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-md" />
          ))}
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4">
        <h2 className="text-2xl font-semibold mb-4">History</h2>
        <Card className="bg-card p-4">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-xl font-medium mb-2">Error Loading History</h3>
            <p className="text-muted-foreground text-center mb-4">
              There was a problem fetching your video history. Please try again.
            </p>
            <Button onClick={() => refetch()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const sortedVideos = videos ? [...videos].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ) : [];
  
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">History</h2>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" className="flex items-center gap-1">
              <Trash2 className="h-4 w-4" />
              <span>Clear All</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear Download History</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all download history. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleClearAllDownloads}>
                Clear All
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      
      {sortedVideos.length > 0 ? (
        <div className="space-y-4">
          {sortedVideos.map(video => (
            <Card key={video.id} className="bg-card hover:bg-accent transition-colors">
              <CardContent className="p-4 flex items-center space-x-4">
                {video.thumbnail ? (
                  <img 
                    src={video.thumbnail} 
                    alt={video.title} 
                    className="w-16 h-12 object-cover rounded"
                  />
                ) : (
                  <div className="w-16 h-12 bg-accent flex items-center justify-center rounded">
                    <HistoryIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate">{video.title}</h3>
                  <p className="text-xs text-muted-foreground">{video.channelTitle}</p>
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3 mr-1" />
                  <span>{formatDistanceToNow(new Date(video.createdAt), { addSuffix: true })}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <HistoryIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-medium mb-2">No History</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Your video history will show up here. Search and download videos to see them in your history.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
