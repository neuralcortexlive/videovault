import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ActiveDownload from "@/components/ActiveDownload";
import useDownloads from "@/hooks/use-downloads";

export default function Downloads() {
  const { activeDownloads, cancelDownload } = useDownloads();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Downloads</h1>
      
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
    </div>
  );
}