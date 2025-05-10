import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Play, MoreVertical } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Collection } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import CollectionModal from "./CollectionModal";
import { Button } from "@/components/ui/button";

// Função para gerar slug a partir do nome
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

interface CollectionCardProps {
  collection: Collection;
  videoCount: number;
  watchedPercentage: number;
}

export default function CollectionCard({ 
  collection, 
  videoCount, 
  watchedPercentage 
}: CollectionCardProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [showEditModal, setShowEditModal] = useState(false);
  
  const thumbnailUrl = collection.thumbnailUrl || 
    `https://source.unsplash.com/random/500x250/?video,${collection.name.toLowerCase()}`;
  
  const formattedUpdatedDate = collection.updatedAt 
    ? formatDistanceToNow(new Date(collection.updatedAt), { addSuffix: true })
    : '';

  const handlePlay = () => {
    setLocation(`/collections/${generateSlug(collection.name)}`);
  };

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleDelete = async () => {
    try {
      await apiRequest('DELETE', `/api/collections/${collection.id}`);
      
      toast({
        title: "Coleção Excluída",
        description: `${collection.name} foi excluída.`
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/collections'] });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao excluir coleção. Por favor, tente novamente.",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <div className="bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 overflow-hidden hover:border-border/80 transition-all duration-200">
        <div className="relative">
          <img 
            src={thumbnailUrl} 
            alt={`Coleção ${collection.name}`} 
            className="w-full h-32 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent backdrop-blur-[2px]"></div>
          <div className="absolute bottom-0 left-0 p-4 text-white">
            <h3 className="font-medium text-lg">{collection.name}</h3>
            <p className="text-sm opacity-90">{videoCount} vídeos</p>
          </div>
        </div>
        
        <div className="p-4">
          <div className="flex justify-between items-center text-sm text-muted-foreground mb-3">
            <span>Atualizado {formattedUpdatedDate}</span>
            <span className="flex items-center">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-4 w-4 mr-1" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              {watchedPercentage}%
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handlePlay}
              className="text-accent hover:text-blue-700"
            >
              <Play className="h-4 w-4 mr-1" />
              Abrir
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleEdit}>
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleDelete}
                  className="text-destructive"
                >
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <CollectionModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        mode="edit"
        collection={collection}
      />
    </>
  );
}