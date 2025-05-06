import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, TrashIcon, Edit } from "lucide-react";
import CollectionCard from "@/components/CollectionCard";
import VideoCard from "@/components/VideoCard";
import CollectionModal from "@/components/CollectionModal";
import useCollections from "@/hooks/use-collections";
import { Skeleton } from "@/components/ui/skeleton";
import { Video } from "@shared/schema";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CollectionsProps {
  id?: string;
}

export default function Collections({ id }: CollectionsProps) {
  const [, navigate] = useLocation();
  const [matchedRoute] = useRoute("/collections/:id");
  const { 
    collections, 
    isLoadingCollections, 
    getCollectionVideos,
    deleteCollection,
    getCollection,
    updateCollection,
  } = useCollections();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const collectionId = id ? parseInt(id) : undefined;
  const isViewingCollection = !!collectionId;
  
  // Get the current collection if viewing a specific one
  const selectedCollection = collectionId 
    ? collections.find(c => c.id === collectionId) 
    : undefined;
  
  // Get videos in the current collection
  const { 
    data: collectionVideos = [], 
    isLoading: isLoadingVideos 
  } = useQuery({ 
    ...getCollectionVideos(collectionId || 0),
    enabled: !!collectionId
  });
  
  // Set up state for collection stats
  const [collectionStats, setCollectionStats] = useState<Array<{
    collection: typeof collections[0],
    videoCount: number,
    watchedPercentage: number
  }>>([]);
  
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
  
  // Handle editing collection
  const handleEditCollection = () => {
    setShowEditModal(true);
  };
  
  // Handle deleting collection
  const handleDeleteCollection = async () => {
    if (collectionId) {
      await deleteCollection.mutateAsync(collectionId);
      navigate("/collections");
    }
    setShowDeleteDialog(false);
  };
  
  return (
    <>
      {isViewingCollection ? (
        // Single collection view
        <div>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                className="mr-2"
                onClick={() => navigate("/collections")}
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Collections
              </Button>
              <h1 className="text-2xl font-bold">{selectedCollection?.name}</h1>
            </div>
            <div className="flex">
              <Button 
                variant="outline" 
                className="mr-2"
                onClick={handleEditCollection}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button 
                variant="outline" 
                className="text-destructive hover:text-destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
          
          {selectedCollection?.description && (
            <p className="text-gray-500 mb-4">{selectedCollection.description}</p>
          )}
          
          {isLoadingVideos ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow overflow-hidden">
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
          ) : collectionVideos.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <h3 className="text-xl font-medium mb-2">No videos in this collection</h3>
              <p className="text-gray-500 mb-4">
                Search for videos and add them to this collection.
              </p>
              <Link href="/search">
                <Button>
                  Search Videos
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {collectionVideos.map((video: Video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  isDownloaded={video.isDownloaded}
                  showCollectionButton={false}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        // Collections list view
        <div>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Collections</h1>
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="bg-primary hover:bg-red-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              New Collection
            </Button>
          </div>
          
          {isLoadingCollections ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow overflow-hidden">
                  <Skeleton className="w-full h-32" />
                  <div className="p-3">
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-4/5 mb-4" />
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-3 w-1/3" />
                      <div className="flex space-x-1">
                        <Skeleton className="h-5 w-5" />
                        <Skeleton className="h-5 w-5" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : collectionStats.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <h3 className="text-xl font-medium mb-2">No collections</h3>
              <p className="text-gray-500 mb-4">
                Create your first collection to organize your videos.
              </p>
              <Button 
                onClick={() => setShowCreateModal(true)}
                className="bg-primary hover:bg-red-700"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Collection
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {collectionStats.map(({ collection, videoCount, watchedPercentage }) => (
                <CollectionCard
                  key={collection.id}
                  collection={collection}
                  videoCount={videoCount}
                  watchedPercentage={watchedPercentage}
                />
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Create Collection Modal */}
      <CollectionModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
      />
      
      {/* Edit Collection Modal */}
      <CollectionModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        mode="edit"
        collection={selectedCollection}
      />
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this collection. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteCollection}
              className="bg-destructive hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
