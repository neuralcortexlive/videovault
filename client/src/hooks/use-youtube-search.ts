import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
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
  const [query, setQuery] = useState<string>("");
  const [order, setOrder] = useState<string>("date");
  const { toast } = useToast();
  
  // Search query with better direct fetching approach
  const { 
    data,
    isLoading,
    isError,
    refetch 
  } = useQuery<SearchResponse>({
    queryKey: [`/api/youtube/search`, query, order],
    queryFn: async () => {
      console.log(`Executing search query function with query="${query}" and order="${order}"`);
      
      if (!query) {
        console.log("Empty query, returning empty results");
        return { 
          items: [], 
          pageInfo: { totalResults: 0, resultsPerPage: 0 } 
        };
      }
      
      try {
        console.log("Making search API request...");
        const searchUrl = `/api/youtube/search?query=${encodeURIComponent(query)}&order=${order}`;
        console.log("Fetch URL:", searchUrl);
        
        const response = await fetch(searchUrl);
        const responseText = await response.text();
        
        // Debug the raw response
        console.log(`API response status: ${response.status}`);
        console.log("Response length:", responseText.length);
        
        if (!response.ok) {
          let errorMessage = `API error: ${response.status} ${response.statusText}`;
          
          try {
            const errorData = JSON.parse(responseText);
            if (errorData.message) {
              errorMessage = errorData.message;
            }
            
            // Check for specific error types
            if (errorMessage.includes('API key')) {
              toast({
                title: "YouTube API Key Error",
                description: "The YouTube API key has expired or is invalid. Please contact the administrator.",
                variant: "destructive"
              });
              throw new Error("YouTube API key error: " + errorMessage);
            }
            
            if (errorMessage.includes('quota')) {
              toast({
                title: "API Quota Exceeded",
                description: "The YouTube API quota has been exceeded. Please try again tomorrow.",
                variant: "destructive"
              });
              throw new Error("YouTube API quota exceeded: " + errorMessage);
            }
          } catch (parseError) {
            // If we can't parse the error, use the default message
            console.error("Failed to parse API error response:", parseError);
          }
          
          // Show a toast and throw the error
          toast({
            title: "Search Error",
            description: errorMessage,
            variant: "destructive"
          });
          
          throw new Error(errorMessage);
        }
        
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (err) {
          console.error("Failed to parse response as JSON:", err);
          console.log("Response body:", responseText.substring(0, 500));
          toast({
            title: "Search Error",
            description: "Invalid response from search API",
            variant: "destructive"
          });
          throw new Error("Invalid JSON response from search API");
        }
        
        console.log(`Search returned ${data.items?.length || 0} results`);
        return data;
      } catch (error) {
        console.error("Search query error:", error);
        
        // If the error wasn't already handled with a toast above
        if (error instanceof Error && !error.message.includes('API key') && !error.message.includes('quota')) {
          toast({
            title: "Search Error",
            description: error.message || "Failed to search videos",
            variant: "destructive"
          });
        }
        
        throw error;
      }
    },
    enabled: false, // Don't run automatically
    staleTime: 1000 * 60 * 5, // Results remain fresh for 5 minutes
    retry: 2, // Retry failed requests twice
  });
  
  // Search function - improved with synchronous state update
  const search = useCallback((searchQuery: string, orderBy: string = "date") => {
    console.log(`Search function called with query="${searchQuery}" and order="${orderBy}"`);
    
    if (!searchQuery.trim()) {
      console.log("Empty search query, aborting");
      return;
    }
    
    // Update state immediately
    const trimmedQuery = searchQuery.trim();
    setQuery(trimmedQuery);
    setOrder(orderBy);
    
    // Use a direct fetch instead of refetch to ensure we're using the latest values
    (async () => {
      try {
        console.log(`Directly fetching search results for "${trimmedQuery}"`);
        
        const searchUrl = `/api/youtube/search?query=${encodeURIComponent(trimmedQuery)}&order=${orderBy}`;
        console.log("Direct fetch URL:", searchUrl);
        
        const response = await fetch(searchUrl);
        const responseText = await response.text();
        
        console.log(`Direct fetch response status: ${response.status}`);
        
        if (response.ok) {
          try {
            const data = JSON.parse(responseText);
            console.log(`Direct fetch returned ${data.items?.length || 0} results`);
            
            // Update query cache directly
            queryClient.setQueryData([`/api/youtube/search`, trimmedQuery, orderBy], data);
          } catch (parseErr) {
            console.error("Failed to parse direct fetch response:", parseErr);
            toast({
              title: "Search Error",
              description: "Failed to parse search results",
              variant: "destructive"
            });
          }
        } else {
          console.error(`Direct fetch error: ${response.status} ${response.statusText}`);
          
          // Try to parse the error response
          try {
            const errorData = JSON.parse(responseText);
            const errorMessage = errorData.message || `Failed to search: ${response.statusText}`;
            
            toast({
              title: "Search Error",
              description: errorMessage,
              variant: "destructive"
            });
          } catch (parseError) {
            toast({
              title: "Search Error",
              description: `Failed to search: ${response.statusText}`,
              variant: "destructive"
            });
          }
        }
      } catch (err) {
        console.error("Direct fetch error:", err);
        toast({
          title: "Search Error",
          description: err instanceof Error ? err.message : "Failed to search videos",
          variant: "destructive"
        });
      }
    })();
  }, [toast]);
  
  // Load more results with enhanced error handling
  const loadMore = useCallback(async (nextPageToken: string) => {
    console.log(`Loading more results with pageToken=${nextPageToken}`);
    
    try {
      if (!query || !nextPageToken) {
        console.error("Cannot load more results: missing query or page token");
        return null;
      }
      
      const searchUrl = `/api/youtube/search?query=${encodeURIComponent(query)}&order=${order}&pageToken=${nextPageToken}`;
      console.log("Loading more from URL:", searchUrl);
      
      const response = await fetch(searchUrl);
      
      if (!response.ok) {
        console.error(`Error loading more results: ${response.status} ${response.statusText}`);
        throw new Error(`Failed to load more results: ${response.statusText}`);
      }
      
      // Parse response with better error handling
      let responseText = "";
      try {
        responseText = await response.text();
        const newData = JSON.parse(responseText);
        console.log(`Loaded ${newData.items?.length || 0} additional results`);
        
        // Merge the new data with existing data
        queryClient.setQueryData([`/api/youtube/search`, query, order], (oldData: any) => {
          if (!oldData) return newData;
          
          return {
            ...newData,
            items: [...(oldData.items || []), ...(newData.items || [])],
          };
        });
        
        return newData.nextPageToken || null;
      } catch (parseError) {
        console.error("Failed to parse load more response:", parseError);
        console.log("Response text:", responseText.substring(0, 200));
        throw new Error("Invalid response when loading more results");
      }
    } catch (error) {
      console.error("Load more error:", error);
      toast({
        title: "Error",
        description: error instanceof Error 
          ? error.message 
          : "Failed to load more results. Please try again.",
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