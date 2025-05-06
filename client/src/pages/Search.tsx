import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Search as SearchIcon } from "lucide-react";

export default function Search() {
  const { 
    search,
    results, 
    nextPageToken, 
    isLoading, 
    loadMore,
    setOrder,
    currentOrder
  } = useYouTubeSearch();
  
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const handleLoadMore = async () => {
    if (!nextPageToken) return;
    
    setIsLoadingMore(true);
    await loadMore(nextPageToken);
    setIsLoadingMore(false);
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    console.log("Searching for:", searchQuery);
    // Force a delay to ensure the state is updated
    setTimeout(() => {
      search(searchQuery, currentOrder);
    }, 100);
  };
  
  const handleSortChange = (value: string) => {
    setOrder(value);
    
    // If we have a search query, rerun the search with the new order
    if (searchQuery.trim()) {
      console.log("Re-searching with new order:", value);
      // Force a delay to ensure the state is updated
      setTimeout(() => {
        search(searchQuery, value);
      }, 100);
    }
  };
  
  return (
    <div>
      <div className="flex flex-col space-y-4 mb-6">
        <h2 className="text-2xl font-bold">Search YouTube</h2>
        
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="flex-1 relative">
            <Input 
              type="text" 
              placeholder="Search for videos..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <SearchIcon className="h-5 w-5" />
            </div>
          </div>
          <Button 
            type="submit"
            disabled={isLoading || !searchQuery.trim()} 
            className="bg-primary hover:bg-primary/90 text-white"
          >
            {isLoading ? "Searching..." : "Search"}
          </Button>
        </form>
      </div>
      
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Results</h2>
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
