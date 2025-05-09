import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Plus, ChevronRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ActiveDownload from "@/components/ActiveDownload";
import CollectionCard from "@/components/CollectionCard";
import VideoCard from "@/components/VideoCard";
import CollectionModal from "@/components/CollectionModal";
import useDownloads from "@/hooks/use-downloads";
import useCollections from "@/hooks/use-collections";
import { useQuery } from "@tanstack/react-query";
import { Video, Collection } from "@shared/schema";

type CollectionStat = {
  collection: Collection;
  videoCount: number;
  watchedPercentage: number;
  firstVideoThumbnail?: string;
};

export default function Home() {
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const { activeDownloads, cancelDownload } = useDownloads();
  const { collections, getCollectionVideos } = useCollections();
  
  // Fetch downloaded videos
  const { data: downloadedVideos = [] } = useQuery<Video[]>({
    queryKey: ['/api/videos/downloaded'],
  });
  
  // Initialize collection stats
  const [collectionStats, setCollectionStats] = useState<CollectionStat[]>([]);
  
  // Update collection stats when collections change
  useEffect(() => {
    const updateCollectionStats = async () => {
      const stats = await Promise.all(collections.map(async (collection) => {
        // Get videos for this collection
        const videos = await getCollectionVideos(collection.id);
        const watchedCount = videos.filter(v => v.isWatched).length;
        const watchedPercentage = videos.length > 0 
          ? Math.round((watchedCount / videos.length) * 100) 
          : 0;
        
        // Get the first video's thumbnail if available
        const firstVideoThumbnail = videos[0]?.thumbnailUrl;
        
        return {
          collection,
          videoCount: videos.length,
          watchedPercentage,
          firstVideoThumbnail
        };
      }));
      
      setCollectionStats(stats);
    };
    
    updateCollectionStats();
  }, [collections, getCollectionVideos]);
  
  return (
    <>
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="mb-6 border-b border-gray-200 w-full justify-start rounded-none h-auto pb-0 bg-transparent">
          <TabsTrigger 
            value="dashboard" 
            className="border-primary text-primary data-[state=active]:border-b-2 border-0 rounded-none data-[state=active]:shadow-none py-2 px-1 data-[state=active]:bg-transparent"
          >
            Painel
          </TabsTrigger>
          <TabsTrigger 
            value="recentDownloads" 
            className="border-transparent text-gray-500 hover:text-gray-700 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary border-0 rounded-none data-[state=active]:shadow-none py-2 px-1 data-[state=active]:bg-transparent"
          >
            Downloads Recentes
          </TabsTrigger>
          <TabsTrigger 
            value="collections" 
            className="border-transparent text-gray-500 hover:text-gray-700 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary border-0 rounded-none data-[state=active]:shadow-none py-2 px-1 data-[state=active]:bg-transparent"
          >
            Coleções
          </TabsTrigger>
          <TabsTrigger 
            value="history" 
            className="border-transparent text-gray-500 hover:text-gray-700 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary border-0 rounded-none data-[state=active]:shadow-none py-2 px-1 data-[state=active]:bg-transparent"
          >
            Histórico
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="space-y-8">
          {/* Active Downloads */}
          <section className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Downloads Ativos</h2>
              <Link href="/downloads">
                <Button variant="ghost" className="text-accent hover:text-blue-700 text-sm font-medium">
                  Ver todos
                </Button>
              </Link>
            </div>
            
            <div className="bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 overflow-hidden">
              {activeDownloads.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <p>Nenhum download ativo. Busque vídeos para baixar.</p>
                </div>
              ) : (
                activeDownloads.slice(0, 2).map(download => (
                  <ActiveDownload 
                    key={download.id} 
                    downloadTask={download}
                    onCancel={cancelDownload.mutate}
                  />
                ))
              )}
            </div>
          </section>
          
          {/* Collections */}
          <section className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Suas Coleções</h2>
              <Button 
                variant="ghost" 
                className="text-accent hover:text-blue-700 text-sm font-medium"
                onClick={() => setShowCollectionModal(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                <span>Nova Coleção</span>
              </Button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {collectionStats.length === 0 ? (
                <div className="col-span-full p-8 text-center text-muted-foreground bg-card/50 backdrop-blur-sm rounded-xl border border-border/50">
                  <p>Nenhuma coleção ainda. Crie sua primeira coleção para organizar seus vídeos.</p>
                  <Button 
                    variant="default" 
                    className="mt-4"
                    onClick={() => setShowCollectionModal(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    <span>Criar Coleção</span>
                  </Button>
                </div>
              ) : (
                collectionStats.map(({ collection, videoCount, watchedPercentage, firstVideoThumbnail }) => (
                  <CollectionCard
                    key={collection.id}
                    collection={{
                      ...collection,
                      thumbnailUrl: firstVideoThumbnail || collection.thumbnailUrl
                    }}
                    videoCount={videoCount}
                    watchedPercentage={watchedPercentage}
                  />
                ))
              )}
            </div>
          </section>
          
          {/* Recently Downloaded Videos */}
          <section className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Vídeos Baixados Recentemente</h2>
              <Link href="/downloads">
                <Button variant="ghost" className="group text-accent hover:text-blue-700 text-sm font-medium">
                  Ver todos
                  <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {downloadedVideos.length === 0 ? (
                <div className="col-span-full p-8 text-center text-muted-foreground bg-card/50 backdrop-blur-sm rounded-xl border border-border/50">
                  <p>Nenhum vídeo baixado ainda. Busque vídeos para baixar.</p>
                  <Link href="/search">
                    <Button variant="default" className="mt-4">
                      Buscar Vídeos
                    </Button>
                  </Link>
                </div>
              ) : (
                downloadedVideos.slice(0, 4).map(video => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    isDownloaded={true}
                  />
                ))
              )}
            </div>
          </section>
        </TabsContent>
        
        <TabsContent value="recentDownloads">
          <div className="p-8 text-center">
            <p className="text-xl font-medium">Veja todos os seus downloads</p>
            <p className="text-muted-foreground mt-2">Acesse a página de Downloads para ver seu histórico completo</p>
            <Link href="/downloads">
              <Button className="mt-4">
                Ir para Downloads
              </Button>
            </Link>
          </div>
        </TabsContent>
        
        <TabsContent value="collections">
          <div className="p-8 text-center">
            <p className="text-xl font-medium">Gerencie suas coleções</p>
            <p className="text-muted-foreground mt-2">Acesse a página de Coleções para ver e gerenciar todas as suas coleções</p>
            <Link href="/collections">
              <Button className="mt-4">
                Ir para Coleções
              </Button>
            </Link>
          </div>
        </TabsContent>
        
        <TabsContent value="history">
          <div className="p-8 text-center">
            <p className="text-xl font-medium">Veja seu histórico de downloads</p>
            <p className="text-muted-foreground mt-2">Acesse a página de Histórico para ver seu histórico completo de downloads</p>
            <Link href="/history">
              <Button className="mt-4">
                Ir para Histórico
              </Button>
            </Link>
          </div>
        </TabsContent>
      </Tabs>
      
      <CollectionModal
        open={showCollectionModal}
        onOpenChange={setShowCollectionModal}
      />
    </>
  );
}