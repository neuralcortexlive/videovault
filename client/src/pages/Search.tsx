import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import VideoCard from "@/components/VideoCard";
import useYouTubeSearch from "@/hooks/use-youtube-search";
import { Skeleton } from "@/components/ui/skeleton";

export default function Search() {
  const { 
    results, 
    nextPageToken, 
    isLoading, 
    loadMore,
    setOrder,
    currentOrder
  } = useYouTubeSearch();
  
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  const handleLoadMore = async () => {
    if (!nextPageToken) return;
    
    setIsLoadingMore(true);
    await loadMore(nextPageToken);
    setIsLoadingMore(false);
  };
  
  const handleSortChange = (value: string) => {
    setOrder(value);
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">YouTube Search Results</h2>
        <div className="flex items-center">
          <span className="text-sm text-gray-500 mr-2">Sort:</span>
          <Select value={currentOrder} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Newest first" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Newest first</SelectItem>
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="viewCount">Most viewed</SelectItem>
              <SelectItem value="title">Title (A-Z)</SelectItem>
              <SelectItem value="rating">Rating</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow overflow-hidden">
              <Skeleton className="w-full h-40" />
              <div className="p-3">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-4/5 mb-4" />
                <div className="flex justify-between items-center">
                  <Skeleton className="h-3 w-1/3" />
                  <div className="flex space-x-1">
                    <Skeleton className="h-5 w-5" />
                    <Skeleton className="h-5 w-5" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h3 className="text-xl font-medium mb-2">No results found</h3>
          <p className="text-gray-500">
            Try searching for something else or change your sort order.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {results.map((video) => (
              <VideoCard key={video.id.videoId} video={video} />
            ))}
          </div>
          
          {nextPageToken && (
            <div className="mt-6 text-center">
              <Button 
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="px-4 py-2 bg-accent text-white rounded-full text-sm font-medium hover:bg-blue-700"
              >
                {isLoadingMore ? "Loading..." : "Load More Results"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
