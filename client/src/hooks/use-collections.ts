import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Collection, Video } from "@shared/schema";

export default function useCollections() {
  const { toast } = useToast();
  
  // Get all collections
  const { 
    data: collections = [], 
    isLoading: isLoadingCollections,
    isError: isErrorCollections 
  } = useQuery<Collection[]>({
    queryKey: ['/api/collections'],
  });
  
  // Get collection by ID - this is a query creator, not a direct hook
  const getCollection = (id: number) => {
    const queryKey = [`/api/collections/${id}`];
    const queryFn = async () => {
      const response = await fetch(`/api/collections/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch collection");
      }
      return await response.json();
    };
    
    return { queryKey, queryFn };
  };
  
  // Get videos in a collection - this is a query creator, not a direct hook
  const getCollectionVideos = (collectionId: number) => {
    const queryKey = [`/api/collections/${collectionId}/videos`];
    
    return { queryKey };
  };
  
  // Create collection mutation
  const createCollection = useMutation({
    mutationFn: async (collection: { name: string; description?: string; thumbnailUrl?: string }) => {
      return await apiRequest('POST', '/api/collections', collection);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/collections'] });
      toast({
        title: "Collection Created",
        description: "Your collection has been created successfully."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create collection. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Update collection mutation
  const updateCollection = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Collection> }) => {
      return await apiRequest('PUT', `/api/collections/${id}`, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/collections'] });
      queryClient.invalidateQueries({ queryKey: [`/api/collections/${variables.id}`] });
      toast({
        title: "Collection Updated",
        description: "Your collection has been updated successfully."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update collection. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Delete collection mutation
  const deleteCollection = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/collections/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/collections'] });
      toast({
        title: "Collection Deleted",
        description: "Your collection has been deleted successfully."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete collection. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Add video to collection mutation
  const addVideoToCollection = useMutation({
    mutationFn: async ({ collectionId, videoId }: { collectionId: number; videoId: string }) => {
      return await apiRequest('POST', `/api/collections/${collectionId}/videos`, { videoId });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/collections/${variables.collectionId}/videos`] });
      toast({
        title: "Video Added",
        description: "The video has been added to your collection."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add video to collection. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Remove video from collection mutation
  const removeVideoFromCollection = useMutation({
    mutationFn: async ({ collectionId, videoId }: { collectionId: number; videoId: number }) => {
      return await apiRequest('DELETE', `/api/collections/${collectionId}/videos/${videoId}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/collections/${variables.collectionId}/videos`] });
      toast({
        title: "Video Removed",
        description: "The video has been removed from your collection."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove video from collection. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  return {
    collections,
    isLoadingCollections,
    isErrorCollections,
    getCollection,
    getCollectionVideos,
    createCollection,
    updateCollection,
    deleteCollection,
    addVideoToCollection,
    removeVideoFromCollection
  };
}
