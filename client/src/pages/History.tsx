import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, History as HistoryIcon, Calendar, Trash2, Download } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
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
import { useToast } from "@/hooks/use-toast";
import { useClearAllDownloads } from "@/hooks/useCollections";

interface Download {
  id: number;
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  startedAt: string;
  completedAt: string | null;
  status: string;
  progress: number;
  totalSize: number;
  downloadedSize: number;
  error: string | null;
}

export default function History() {
  const { data: downloads, isLoading, error, refetch } = useQuery<Download[]>({
    queryKey: ['/api/downloads'],
    refetchInterval: 3000,
  });
  
  const clearMutation = useClearAllDownloads();
  const { toast } = useToast();
  
  const handleClearAllDownloads = async () => {
    try {
      await clearMutation.mutateAsync();
      toast({
        title: "Sucesso",
        description: "Histórico de downloads limpo com sucesso",
      });
    } catch (error) {
      console.error("Erro ao limpar downloads:", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao limpar histórico de downloads",
        variant: "destructive",
      });
    }
  };

  const handleDeleteDownload = async (downloadId: number) => {
    try {
      const response = await fetch(`/api/downloads/${downloadId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Falha ao deletar download');
      }

      toast({
        title: "Sucesso",
        description: "Download removido com sucesso",
      });
      
      await refetch();
    } catch (error) {
      console.error("Erro ao deletar download:", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao remover download",
        variant: "destructive",
      });
    }
  };
  
  if (isLoading) {
    return (
      <div className="p-4">
        <h2 className="text-2xl font-semibold mb-4">Histórico de Downloads</h2>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-md" />
          ))}
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4">
        <h2 className="text-2xl font-semibold mb-4">Histórico de Downloads</h2>
        <Card className="bg-card p-4">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-xl font-medium mb-2">Erro ao Carregar Histórico</h3>
            <p className="text-muted-foreground text-center mb-4">
              Houve um problema ao buscar seu histórico de downloads. Por favor, tente novamente.
            </p>
            <Button onClick={() => refetch()}>Tentar Novamente</Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const sortedDownloads = downloads ? [...downloads].sort((a, b) => {
    const dateA = new Date(a.startedAt || 0).getTime();
    const dateB = new Date(b.startedAt || 0).getTime();
    return dateB - dateA;
  }) : [];

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };
  
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Histórico de Downloads</h2>
        
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
      
      {sortedDownloads.length > 0 ? (
        <div className="space-y-4">
          {sortedDownloads.map(download => (
            <Card key={download.id} className="bg-card hover:bg-accent transition-colors">
              <CardContent className="p-4 flex items-center space-x-4">
                {download.thumbnail ? (
                  <img 
                    src={download.thumbnail} 
                    alt={download.title} 
                    className="w-16 h-12 object-cover rounded"
                  />
                ) : (
                  <div className="w-16 h-12 bg-accent flex items-center justify-center rounded">
                    <Download className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate">{download.title}</h3>
                  <p className="text-xs text-muted-foreground">{download.channelTitle}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <span>{formatFileSize(download.totalSize || 0)}</span>
                    <span>•</span>
                    <span className={`${
                      download.status === 'completed' ? 'text-green-500' :
                      download.status === 'failed' ? 'text-red-500' :
                      download.status === 'downloading' ? 'text-blue-500' :
                      'text-yellow-500'
                    }`}>
                      {download.status === 'completed' ? 'Concluído' :
                       download.status === 'failed' ? 'Falhou' :
                       download.status === 'downloading' ? 'Baixando' :
                       'Cancelado'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span>
                      {download.startedAt ? formatDistanceToNow(new Date(download.startedAt), { addSuffix: true }) : 'Data desconhecida'}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleDeleteDownload(download.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <HistoryIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-medium mb-2">Nenhum Download</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Seu histórico de downloads aparecerá aqui. Pesquise e baixe vídeos para vê-los em seu histórico.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
