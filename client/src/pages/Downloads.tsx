import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, X, CheckCircle, AlertCircle, Trash2 } from "lucide-react";
import { formatBytes, formatDuration } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DownloadItem {
  id: number;
  videoId: string;
  title: string;
  status: string;
  progress: number;
  totalSize: number | null;
  downloadedSize: number | null;
  error: string | null;
  format: string;
  startedAt: string;
  completedAt: string | null;
}

export default function Downloads() {
  const { data: downloads, isLoading, error, refetch } = useQuery<DownloadItem[]>({
    queryKey: ['/api/downloads'],
    refetchInterval: 3000, // Poll for updates every 3 seconds
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const clearAllMutation = useMutation({
    mutationFn: async () => {
      console.log("Iniciando chamada à API para limpar downloads");
      const response = await fetch("/api/downloads/all", {
        method: "DELETE",
      });
      
      console.log("Resposta da API recebida:", response.status);
      if (!response.ok) {
        const error = await response.json();
        console.error("Erro retornado pela API:", error);
        throw new Error(error.error || "Falha ao limpar histórico de downloads");
      }
      
      return true;
    },
    onSuccess: () => {
      console.log("Mutação concluída com sucesso");
      queryClient.invalidateQueries({ queryKey: ["/api/downloads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/downloads/active"] });
      toast({
        title: "Sucesso",
        description: "Histórico de downloads limpo com sucesso",
      });
    },
    onError: (error: Error) => {
      console.error("Erro na mutação:", error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao limpar histórico de downloads",
        variant: "destructive",
      });
    }
  });

  const handleClearAllDownloads = async () => {
    try {
      console.log("Iniciando limpeza de todos os downloads");
      await clearAllMutation.mutateAsync();
      console.log("Limpeza de downloads concluída com sucesso");
    } catch (error) {
      console.error("Erro detalhado ao limpar downloads:", error);
      // Error is handled in the mutation
    }
  };

  const cancelDownload = async (id: number) => {
    try {
      await fetch(`/api/downloads/${id}`, {
        method: 'DELETE',
      });
      refetch();
    } catch (error) {
      console.error("Failed to cancel download:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <h2 className="text-2xl font-semibold mb-4">Downloads</h2>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-16 w-24 rounded" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-full mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <h2 className="text-2xl font-semibold mb-4">Downloads</h2>
        <Card className="bg-card p-4">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-xl font-medium mb-2">Error Loading Downloads</h3>
            <p className="text-muted-foreground text-center mb-4">
              There was a problem fetching your downloads. Please try again.
            </p>
            <Button onClick={() => refetch()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Downloads</h2>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" className="flex items-center gap-1">
              <Trash2 className="h-4 w-4" />
              <span>Limpar Tudo</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Limpar Histórico de Downloads</AlertDialogTitle>
              <AlertDialogDescription>
                Isso irá excluir permanentemente todo o histórico de downloads. Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleClearAllDownloads}>
                Limpar Tudo
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      
      {downloads && downloads.length > 0 ? (
        <div className="space-y-4">
          {downloads.map((download) => (
            <Card key={download.id} className="bg-card overflow-hidden">
              <CardContent className="p-0">
                <div className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-24 bg-accent rounded flex items-center justify-center">
                      {download.status === 'downloading' ? (
                        <Download className="h-8 w-8 text-primary animate-pulse" />
                      ) : download.status === 'completed' ? (
                        <CheckCircle className="h-8 w-8 text-green-500" />
                      ) : (
                        <AlertCircle className="h-8 w-8 text-yellow-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium truncate pr-4">{download.title}</h3>
                        <Badge variant={
                          download.status === 'completed' ? 'default' : 
                          download.status === 'downloading' ? 'secondary' : 'outline'
                        }>
                          {download.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground mt-1">
                        <span>Format: {download.format}</span>
                        <span>
                          {download.totalSize ? formatBytes(download.totalSize) : 'Unknown size'}
                        </span>
                      </div>
                      {download.status === 'downloading' && (
                        <div className="mt-2">
                          <div className="flex justify-between text-xs mb-1">
                            <span>{download.progress}%</span>
                            {download.downloadedSize && download.totalSize && (
                              <span>
                                {formatBytes(download.downloadedSize)} / {formatBytes(download.totalSize)}
                              </span>
                            )}
                          </div>
                          <Progress value={download.progress} className="h-1" />
                        </div>
                      )}
                      {download.error && (
                        <p className="text-destructive text-sm mt-2">Error: {download.error}</p>
                      )}
                    </div>
                  </div>
                </div>
                {download.status === 'downloading' && (
                  <div className="bg-background px-4 py-2 border-t border-border flex justify-end">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mac-btn"
                      onClick={() => cancelDownload(download.id)}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Download className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-medium mb-2">No Downloads</h3>
            <p className="text-muted-foreground text-center max-w-md">
              You haven't downloaded any videos yet. Search for videos to start downloading.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
