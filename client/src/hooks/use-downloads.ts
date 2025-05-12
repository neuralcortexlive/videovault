import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { DownloadTask, DownloadOptions } from "@shared/schema";
import useWebSocket from "./use-websocket";
import { useEffect, useState } from "react";

export default function useDownloads() {
  const { toast } = useToast();
  const socket = useWebSocket();
  const [activeDownloads, setActiveDownloads] = useState<DownloadTask[]>([]);
  
  // Listen for active downloads via WebSocket
  useEffect(() => {
    if (!socket) return;
    
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === "activeDownloads") {
          setActiveDownloads(data.data);
        } else if (data.type === "downloadProgress") {
          // Update the specific download task with new progress
          setActiveDownloads(prev => prev.map(task => {
            if (task.id === data.data.taskId) {
              return {
                ...task,
                progress: data.data.progress,
                status: data.data.status
              };
            }
            return task;
          }));
          
          // If status is completed or failed, refresh the downloads
          if (data.data.status === "completed" || data.data.status === "failed") {
            queryClient.invalidateQueries({ queryKey: ['/api/downloads/active'] });
            queryClient.invalidateQueries({ queryKey: ['/api/downloads/history'] });
            // Forçar atualização imediata do histórico
            refetchHistory();
          }
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };
    
    socket.addEventListener("message", handleMessage);
    
    return () => {
      socket.removeEventListener("message", handleMessage);
    };
  }, [socket]);
  
  // Get active downloads
  const { data: apiActiveDownloads = [] } = useQuery<DownloadTask[]>({
    queryKey: ['/api/downloads/active'],
    refetchInterval: 5000, // Refresh every 5 seconds as fallback
  });
  
  // Combine WebSocket updates with API data
  useEffect(() => {
    if (apiActiveDownloads.length > 0 && activeDownloads.length === 0) {
      setActiveDownloads(apiActiveDownloads);
    }
  }, [apiActiveDownloads, activeDownloads.length]);
  
  // Get download history
  const { 
    data: downloadHistory = [], 
    isLoading: isLoadingHistory,
    isError: isErrorHistory,
    refetch: refetchHistory 
  } = useQuery<DownloadTask[]>({
    queryKey: ['/api/downloads/history'],
  });
  
  // Clear history mutation
  const clearHistory = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', '/api/downloads/history');
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to clear history');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Histórico Limpo",
        description: "O histórico de downloads foi limpo com sucesso."
      });
      
      // Force refresh of history
      queryClient.invalidateQueries({ queryKey: ['/api/downloads/history'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível limpar o histórico de downloads.",
        variant: "destructive"
      });
    }
  });
  
  // Start download mutation
  const startDownload = useMutation({
    mutationFn: async (options: DownloadOptions) => {
      return await apiRequest('POST', '/api/youtube/download', options);
    },
    onSuccess: () => {
      toast({
        title: "Download Started",
        description: "Your video download has been started."
      });
      
      // Force refresh of active downloads
      queryClient.invalidateQueries({ queryKey: ['/api/downloads/active'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start download. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Cancel download mutation
  const cancelDownload = useMutation({
    mutationFn: async (taskId: number) => {
      return await apiRequest('DELETE', `/api/youtube/download/${taskId}`);
    },
    onSuccess: (_, taskId) => {
      // Remove from local state immediately
      setActiveDownloads(prev => prev.filter(task => task.id !== taskId));
      
      toast({
        title: "Download Canceled",
        description: "The download has been canceled."
      });
      
      // Force refresh of active downloads and history
      queryClient.invalidateQueries({ queryKey: ['/api/downloads/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/downloads/history'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to cancel download. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  return {
    activeDownloads,
    downloadHistory,
    isLoadingHistory,
    isErrorHistory,
    refetchHistory,
    startDownload,
    cancelDownload,
    clearHistory
  };
}
