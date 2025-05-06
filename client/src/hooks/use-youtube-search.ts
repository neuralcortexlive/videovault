import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { YouTubeSearchResult } from "@shared/schema";

type SearchResponse = {
  items: YouTubeSearchResult[];
  nextPageToken?: string;
  prevPageToken?: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
};

export default function useYouTubeSearch() {
  const [query, setQuery] = useState("");
  const [order, setOrder] = useState<string>("date");
  const { toast } = useToast();
  
  // Search query
  const { 
    data,
    isLoading,
    isError,
    refetch 
  } = useQuery<SearchResponse>({
    queryKey: [`/api/youtube/search?query=${query}&order=${order}`],
    enabled: false,
  });
  
  // Search function
  const search = useCallback((searchQuery: string, orderBy: string = "date") => {
    setQuery(searchQuery);
    setOrder(orderBy);
    
    // Invalidate previous search results
    queryClient.invalidateQueries({ 
      queryKey: [`/api/youtube/search`] 
    });
    
    // Manually trigger the query
    refetch();
  }, [refetch]);
  
  // Load more results
  const loadMore = useCallback(async (nextPageToken: string) => {
    try {
      const response = await fetch(`/api/youtube/search?query=${query}&order=${order}&pageToken=${nextPageToken}`);
      if (!response.ok) {
        throw new Error("Failed to load more results");
      }
      
      const newData = await response.json();
      
      // Merge the new data with existing data
      queryClient.setQueryData([`/api/youtube/search?query=${query}&order=${order}`], (oldData: any) => {
        if (!oldData) return newData;
        
        return {
          ...newData,
          items: [...oldData.items, ...newData.items],
        };
      });
      
      return newData.nextPageToken;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load more results. Please try again.",
        variant: "destructive"
      });
      return null;
    }
  }, [query, order, toast]);
  
  return {
    search,
    loadMore,
    results: data?.items || [],
    nextPageToken: data?.nextPageToken,
    prevPageToken: data?.prevPageToken,
    totalResults: data?.pageInfo?.totalResults || 0,
    isLoading,
    isError,
    setOrder,
    currentOrder: order,
  };
}
