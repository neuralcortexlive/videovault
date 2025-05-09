import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ActiveDownload from "@/components/ActiveDownload";
import VideoCard from "@/components/VideoCard";
import useDownloads from "@/hooks/use-downloads";
import { useQuery } from "@tanstack/react-query";
import { Video } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function Downloads() {
  const { activeDownloads, downloadHistory, cancelDownload } = useDownloads();
  
  // Get downloaded videos
  const { data: downloadedVideos = [], isLoading } = useQuery<Video[]>({
    queryKey: ['/api/videos/downloaded'],
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Downloads</h1>
      
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="mb-6 border-b border-gray-200 w-full justify-start rounded-none h-auto pb-0 bg-transparent">
          <TabsTrigger 
            value="active" 
            className="border-primary text-primary data-[state=active]:border-b-2 border-0 rounded-none data-[state=active]:shadow-none py-2 px-1 data-[state=active]:bg-transparent"
          >
            Downloads Ativos
          </TabsTrigger>
          <TabsTrigger 
            value="completed" 
            className="border-transparent text-gray-500 hover:text-gray-700 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary border-0 rounded-none data-[state=active]:shadow-none py-2 px-1 data-[state=active]:bg-transparent"
          >
            Downloads Concluídos
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="active">
          <div className="bg-card rounded-lg shadow overflow-hidden mb-6">
            {activeDownloads.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <p>Nenhum download ativo. Busque vídeos para baixar.</p>
              </div>
            ) : (
              activeDownloads.map(download => (
                <ActiveDownload 
                  key={download.id} 
                  downloadTask={download}
                  onCancel={cancelDownload.mutate}
                />
              ))
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="completed">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array(8).fill(0).map((_, i) => (
                <div key={i} className="bg-card rounded-lg shadow overflow-hidden">
                  <Skeleton className="w-full h-40" />
                  <div className="p-3">
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-4/5 mb-4" />
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-3 w-1/3" />
                      <div className="flex space-x-1">
                        <Skeleton className="h-5 w-5" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : downloadedVideos.length === 0 ? (
            <div className="bg-card rounded-lg shadow p-8 text-center">
              <h3 className="text-xl font-medium mb-2">Nenhum vídeo baixado</h3>
              <p className="text-muted-foreground">
                Busque vídeos e baixe-os para vê-los aqui.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {downloadedVideos.map(video => (
                <VideoCard
                  key={video.id}
                  video={video}
                  isDownloaded={true}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}