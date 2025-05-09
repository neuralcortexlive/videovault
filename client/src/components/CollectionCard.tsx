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
    setLocation(`/collections/${collection.id}`);
  };

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleDelete = async () => {
    try {
      await apiRequest('DELETE', `/api/collections/${collection.id}`);
      
      toast({
        title: "Collection Deleted",
        description: `${collection.name} has been deleted.`
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/collections'] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete collection. Please try again.",
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
            alt={`${collection.name} collection`} 
            className="w-full h-32 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent backdrop-blur-[2px]"></div>
          <div className="absolute bottom-0 left-0 p-4 text-white">
            <h3 className="font-medium text-lg">{collection.name}</h3>
            <p className="text-sm opacity-90">{videoCount} videos</p>
          </div>
        </div>
        
        <div className="p-4">
          <div className="flex justify-between items-center text-sm text-muted-foreground mb-3">
            <span>Updated {formattedUpdatedDate}</span>
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
          
          <div className="flex space-x-2">
            <button 
              className="flex-1 py-2 px-4 rounded-lg bg-primary/10 text-primary text-sm hover:bg-primary/20 transition-colors flex items-center justify-center"
              onClick={handlePlay}
            >
              <Play className="h-4 w-4 mr-2" />
              Play
            </button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <MoreVertical className="h-5 w-5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={handleEdit}>Edit</DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive" 
                  onClick={handleDelete}
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <CollectionModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        collection={collection}
        mode="edit"
      />
    </>
  );
}