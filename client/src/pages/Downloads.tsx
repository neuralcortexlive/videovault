import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, X, CheckCircle, AlertCircle } from "lucide-react";
import { formatBytes, formatDuration } from "@/lib/utils";

interface DownloadItem {
  id: number;
  videoId: string;
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
      <h2 className="text-2xl font-semibold mb-4">Downloads</h2>
      
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
                        <h3 className="font-medium truncate pr-4">{download.videoId}</h3>
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
