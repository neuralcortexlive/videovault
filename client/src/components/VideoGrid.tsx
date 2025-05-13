import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { alertDialog, AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Search, AlertCircle } from "lucide-react";
import VideoCard from "@/components/VideoCard";
import DownloadModal from "@/components/DownloadModal";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";

interface VideoGridProps {
  searchTerm: string;
}

interface Video {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  publishedAt: string;
  viewCount: number;
  duration: string;
}

interface SearchResponse {
  videos: Video[];
  nextPageToken?: string;
}

export default function VideoGrid({ searchTerm }: VideoGridProps) {
  const { toast } = useToast();
  const [sortBy, setSortBy] = useState("date");
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  
  // Reset pagination when search term changes
  useEffect(() => {
    if (searchTerm) {
      console.log("Search term changed to:", searchTerm);
      queryClient.resetQueries({ queryKey: ['/api/search'] });
    }
  }, [searchTerm]);
  
  const { data, isLoading, error, refetch } = useQuery<SearchResponse>({
    queryKey: ['/api/search', { q: searchTerm }],
    enabled: !!searchTerm
  });
  
  const handleDownload = async (videoId: string) => {
    try {
      setSelectedVideoId(videoId);
      setIsDownloadModalOpen(true);
      
      const response = await apiRequest('POST', '/api/downloads', {
        videoId,
        format: 'mp4',
        quality: 'best',
        saveMetadata: true
      });
      
      if (!response.ok) {
        throw new Error('Failed to start download');
      }

      // Don't close the modal - it will show progress
      queryClient.invalidateQueries({ queryKey: ['/api/downloads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/downloads/active'] });
      
    } catch (err) {
      console.error('Download failed:', err);
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: "There was a problem starting the download. Please try again.",
      });
      setIsDownloadModalOpen(false);
    }
  };
  
  const handleCloseDownloadModal = () => {
    setIsDownloadModalOpen(false);
    setSelectedVideoId(null);
  };
  
  // No search term entered yet
  if (!searchTerm) {
    return (
      <div className="px-4 py-8 text-center">
        <div className="inline-flex justify-center items-center w-24 h-24 rounded-full bg-card mb-4">
          <Search className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-medium mb-2">Search for Videos</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Enter a search term above to find YouTube videos. You can download and manage them in your library.
        </p>
      </div>
    );
  }
  
  // Loading state
  if (isLoading) {
    return (
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Searching...</h2>
          <Skeleton className="h-8 w-40" />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="bg-card rounded-lg overflow-hidden shadow-md">
              <Skeleton className="w-full aspect-video" />
              <div className="p-3">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <div className="flex justify-between mt-2">
                  <Skeleton className="h-3 w-1/3" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
              <div className="p-2 border-t border-border flex justify-between">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="px-4 py-8 text-center">
        <div className="inline-flex justify-center items-center w-24 h-24 rounded-full bg-card mb-4">
          <AlertCircle className="h-10 w-10 text-destructive" />
        </div>
        <h3 className="text-xl font-medium mb-2">Search Error</h3>
        <p className="text-muted-foreground max-w-md mx-auto mb-4">
          There was a problem searching for videos. This might be due to an invalid API key or network issues.
        </p>
        <Button onClick={() => refetch()}>Try Again</Button>
      </div>
    );
  }
  
  // No results
  if (data?.videos.length === 0) {
    return (
      <div className="px-4 py-8 text-center">
        <div className="inline-flex justify-center items-center w-24 h-24 rounded-full bg-card mb-4">
          <Search className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-medium mb-2">No videos found</h3>
        <p className="text-muted-foreground max-w-md mx-auto mb-4">
          Try searching for something else or check your API key configuration.
        </p>
        <Button onClick={() => refetch()}>Try Again</Button>
      </div>
    );
  }
  
  // Results found
  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Search Results</h2>
        <div className="flex items-center text-sm text-muted-foreground">
          <span>Sorted by: </span>
          <Select
            value={sortBy}
            onValueChange={setSortBy}
          >
            <SelectTrigger className="ml-1 border-none bg-transparent h-8 w-32">
              <SelectValue placeholder="Upload Date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Upload Date</SelectItem>
              <SelectItem value="views">View Count</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {data?.videos.map((video) => (
          <VideoCard 
            key={video.videoId} 
            video={video} 
            onDownload={handleDownload} 
          />
        ))}
      </div>
      
      {selectedVideoId && (
        <DownloadModal
          isOpen={isDownloadModalOpen}
          onClose={handleCloseDownloadModal}
          videoId={selectedVideoId}
        />
      )}
    </div>
  );
}
