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
};

export default function Home() {
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const { activeDownloads, cancelDownload } = useDownloads();
  const { collections } = useCollections();
  
  // Get downloaded videos
  const { data: downloadedVideos = [] } = useQuery<Video[]>({
    queryKey: ['/api/videos/downloaded'],
  });
  
  // Initialize collection stats
  const [collectionStats, setCollectionStats] = useState<CollectionStat[]>([]);
  
  // Update collection stats when collections change
  useEffect(() => {
    const stats = collections.map(collection => {
      return {
        collection,
        videoCount: 0,
        watchedPercentage: 0
      };
    });
    setCollectionStats(stats);
  }, [collections]);
  
  return (
    <>
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="mb-6 border-b border-gray-200 w-full justify-start rounded-none h-auto pb-0 bg-transparent">
          <TabsTrigger 
            value="dashboard" 
            className="border-primary text-primary data-[state=active]:border-b-2 border-0 rounded-none data-[state=active]:shadow-none py-2 px-1 data-[state=active]:bg-transparent"
          >
            Dashboard
          </TabsTrigger>
          <TabsTrigger 
            value="recentDownloads" 
            className="border-transparent text-gray-500 hover:text-gray-700 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary border-0 rounded-none data-[state=active]:shadow-none py-2 px-1 data-[state=active]:bg-transparent"
          >
            Recent Downloads
          </TabsTrigger>
          <TabsTrigger 
            value="collections" 
            className="border-transparent text-gray-500 hover:text-gray-700 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary border-0 rounded-none data-[state=active]:shadow-none py-2 px-1 data-[state=active]:bg-transparent"
          >
            Collections
          </TabsTrigger>
          <TabsTrigger 
            value="history" 
            className="border-transparent text-gray-500 hover:text-gray-700 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary border-0 rounded-none data-[state=active]:shadow-none py-2 px-1 data-[state=active]:bg-transparent"
          >
            History
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="space-y-8">
          {/* Active Downloads */}
          <section className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Active Downloads</h2>
              <Link href="/downloads">
                <Button variant="ghost" className="text-accent hover:text-blue-700 text-sm font-medium">
                  View all
                </Button>
              </Link>
            </div>
            
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {activeDownloads.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <p>No active downloads. Search for videos to download.</p>
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
              <h2 className="text-lg font-bold">Your Collections</h2>
              <Button 
                variant="ghost" 
                className="text-accent hover:text-blue-700 text-sm font-medium"
                onClick={() => setShowCollectionModal(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                <span>New Collection</span>
              </Button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {collectionStats.length === 0 ? (
                <div className="col-span-full p-8 text-center text-gray-500 bg-white rounded-lg shadow">
                  <p>No collections yet. Create your first collection to organize your videos.</p>
                  <Button 
                    variant="default" 
                    className="mt-4"
                    onClick={() => setShowCollectionModal(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    <span>Create Collection</span>
                  </Button>
                </div>
              ) : (
                collectionStats.map(({ collection, videoCount, watchedPercentage }) => (
                  <CollectionCard
                    key={collection.id}
                    collection={collection}
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
              <h2 className="text-lg font-bold">Recently Downloaded Videos</h2>
              <Link href="/downloads">
                <Button variant="ghost" className="group text-accent hover:text-blue-700 text-sm font-medium">
                  View all
                  <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {downloadedVideos.length === 0 ? (
                <div className="col-span-full p-8 text-center text-gray-500 bg-white rounded-lg shadow">
                  <p>No downloaded videos yet. Search for videos to download.</p>
                  <Link href="/search">
                    <Button variant="default" className="mt-4">
                      Search Videos
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
            <p className="text-xl font-medium">View all your downloads</p>
            <p className="text-gray-500 mt-2">Go to the Downloads page to see your full download history</p>
            <Link href="/downloads">
              <Button className="mt-4">
                Go to Downloads
              </Button>
            </Link>
          </div>
        </TabsContent>
        
        <TabsContent value="collections">
          <div className="p-8 text-center">
            <p className="text-xl font-medium">Manage your collections</p>
            <p className="text-gray-500 mt-2">Go to the Collections page to see and manage all your collections</p>
            <Link href="/collections">
              <Button className="mt-4">
                Go to Collections
              </Button>
            </Link>
          </div>
        </TabsContent>
        
        <TabsContent value="history">
          <div className="p-8 text-center">
            <p className="text-xl font-medium">View your download history</p>
            <p className="text-gray-500 mt-2">Go to the History page to see your complete download history</p>
            <Link href="/history">
              <Button className="mt-4">
                Go to History
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
