import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Video } from "@/types/video";

export interface Collection {
  id: number;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCollectionData {
  name: string;
  description?: string | null;
}

export interface UpdateCollectionData {
  name?: string;
  description?: string | null;
}

// Hook para listar todas as coleções
export function useCollections() {
  return useQuery({
    queryKey: ["/api/collections"],
    queryFn: async () => {
      const response = await fetch("/api/collections");
      if (!response.ok) {
        throw new Error("Failed to fetch collections");
      }
      return response.json() as Promise<Collection[]>;
    }
  });
}

// Hook para criar uma nova coleção
export function useCreateCollection() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateCollectionData) => {
      const response = await fetch("/api/collections", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error("Failed to create collection");
      }
      
      return await response.json() as Collection;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
    }
  });
}

// Hook para atualizar uma coleção
export function useUpdateCollection() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number, data: UpdateCollectionData }) => {
      const response = await fetch(`/api/collections/${id}`, {
        method: "PUT",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error("Failed to update collection");
      }
      
      return await response.json() as Collection;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
    }
  });
}

// Hook para excluir uma coleção
export function useDeleteCollection() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/collections/${id}`, {
        method: "DELETE"
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete collection");
      }
      
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
    }
  });
}

// Hook para obter vídeos de uma coleção
export function useCollectionVideos(collectionId: number) {
  return useQuery({
    queryKey: ["/api/collections", collectionId, "videos"],
    queryFn: async () => {
      const response = await fetch(`/api/collections/${collectionId}/videos`);
      if (!response.ok) {
        throw new Error("Failed to fetch collection videos");
      }
      return response.json();
    },
    enabled: !!collectionId // Só executa se collectionId for válido
  });
}

// Hook para adicionar um vídeo a uma coleção
export function useAddVideoToCollection() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ videoId, collectionId }: { videoId: number, collectionId: number }) => {
      const response = await fetch(`/api/collections/${collectionId}/videos/${videoId}`, {
        method: "POST"
      });
      
      if (!response.ok) {
        throw new Error("Failed to add video to collection");
      }
      
      return await response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/collections", variables.collectionId, "videos"] 
      });
    }
  });
}

// Hook para remover um vídeo de uma coleção
export function useRemoveVideoFromCollection() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ videoId, collectionId }: { videoId: number, collectionId: number }) => {
      const response = await fetch(`/api/collections/${collectionId}/videos/${videoId}`, {
        method: "DELETE"
      });
      
      if (!response.ok) {
        throw new Error("Failed to remove video from collection");
      }
      
      return { videoId, collectionId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/collections", variables.collectionId, "videos"] 
      });
    }
  });
}

// Hook para limpar todos os downloads (botão "Clear")
export function useClearAllDownloads() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/downloads/all", {
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Falha ao limpar histórico de downloads");
      }
      
      return true;
    },
    onSuccess: () => {
      // Invalida todas as queries relacionadas a downloads
      queryClient.invalidateQueries({ queryKey: ["/api/downloads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/downloads/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/library"] });
    },
    onError: (error: Error) => {
      console.error("Erro ao limpar downloads:", error);
      throw error;
    }
  });
}

// Hook para obter todos os vídeos em coleções
export function useAllCollectionVideos() {
  return useQuery<Video[]>({
    queryKey: ["/api/collections/videos"],
    queryFn: async () => {
      const response = await fetch("/api/collections/videos");
      if (!response.ok) {
        throw new Error("Failed to fetch all collection videos");
      }
      return response.json();
    }
  });
}