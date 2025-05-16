import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

export function useDeleteVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (videoId: number) => {
      const response = await axios.delete(`/api/library/${videoId}`);
      return response.data;
    },
    onSuccess: () => {
      // Invalidar as queries relacionadas à biblioteca
      queryClient.invalidateQueries({ queryKey: ["library"] });
      queryClient.invalidateQueries({ queryKey: ["downloadedVideos"] });
    },
    onError: (error: any) => {
      console.error("Erro ao deletar vídeo:", error);
      throw new Error(error.response?.data?.error || "Falha ao deletar vídeo");
    }
  });
} 