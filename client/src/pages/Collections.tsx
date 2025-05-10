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

// Função para gerar slug a partir do nome
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

interface CollectionsProps {
  id?: string;
}

export default function Collections({ id }: CollectionsProps) {
  const [, navigate] = useLocation();
  const [matchedRoute] = useRoute("/collections/:slug");
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
  
  // Encontrar a coleção pelo slug
  const selectedCollection = collections.find(c => generateSlug(c.name) === id);
  const collectionId = selectedCollection?.id;
  const isViewingCollection = !!id;
  
  // Get videos in the current collection
  const { 
    data: collectionVideos = [] as Video[], 
    isLoading: isLoadingVideos 
  } = useQuery<Video[]>({ 
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
    if (selectedCollection) {
      try {
        await deleteCollection.mutateAsync(generateSlug(selectedCollection.name));
        setShowDeleteDialog(false);
        setSelectedCollection(null);
      } catch (error) {
        console.error("Error deleting collection:", error);
      }
    }
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
                Voltar para Coleções
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
                Editar
              </Button>
              <Button 
                variant="outline" 
                className="text-destructive hover:text-destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            </div>
          </div>
          
          {selectedCollection?.description && (
            <p className="text-muted-foreground mb-4">{selectedCollection.description}</p>
          )}
          
          {isLoadingVideos ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-lg" />
              ))}
            </div>
          ) : collectionVideos.length === 0 ? (
            <div className="text-center py-12 bg-card/50 backdrop-blur-sm rounded-xl border border-border/50">
              <h3 className="text-lg font-medium text-foreground">Nenhum vídeo nesta coleção</h3>
              <p className="text-muted-foreground mt-2">Procure por vídeos e adicione-os a esta coleção</p>
              <Button 
                className="mt-4"
                onClick={() => navigate("/search")}
              >
                Buscar Vídeos
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {collectionVideos.map(video => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          )}
        </div>
      ) : (
        // Collections list view
        <div>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Coleções</h1>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Coleção
            </Button>
          </div>
          
          {isLoadingCollections ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-lg" />
              ))}
            </div>
          ) : collections.length === 0 ? (
            <div className="text-center py-12 bg-card/50 backdrop-blur-sm rounded-xl border border-border/50">
              <h3 className="text-lg font-medium text-foreground">Nenhuma coleção ainda</h3>
              <p className="text-muted-foreground mt-2">Crie sua primeira coleção para organizar seus vídeos</p>
              <Button 
                className="mt-4"
                onClick={() => setShowCreateModal(true)}
              >
                Criar Coleção
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {collections.map(collection => {
                const stats = collectionStats.find(s => s.collection.id === collection.id);
                return (
                  <CollectionCard
                    key={collection.id}
                    collection={collection}
                    videoCount={stats?.videoCount || 0}
                    watchedPercentage={stats?.watchedPercentage || 0}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      <CollectionModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
      />

      <CollectionModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        mode="edit"
        collection={selectedCollection}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Coleção</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta coleção? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCollection}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
