import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Collection, Video } from "@shared/schema";

// Função para gerar slug a partir do nome
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

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
  
  // Get collection by slug - this is a query creator, not a direct hook
  const getCollection = (slug: string) => {
    const queryKey = [`/api/collections/${slug}`];
    const queryFn = async () => {
      const response = await fetch(`/api/collections/${slug}`);
      if (!response.ok) {
        throw new Error("Falha ao buscar coleção");
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
        title: "Coleção Criada",
        description: "Sua coleção foi criada com sucesso."
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao criar coleção. Por favor, tente novamente.",
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
        title: "Coleção Atualizada",
        description: "Sua coleção foi atualizada com sucesso."
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao atualizar coleção. Por favor, tente novamente.",
        variant: "destructive"
      });
    }
  });
  
  // Delete collection mutation
  const deleteCollection = useMutation({
    mutationFn: async (slug: string) => {
      return await apiRequest('DELETE', `/api/collections/${slug}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/collections'] });
      toast({
        title: "Coleção Excluída",
        description: "Sua coleção foi excluída com sucesso."
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao excluir coleção. Por favor, tente novamente.",
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
