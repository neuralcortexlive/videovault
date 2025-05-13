import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  VideoIcon, 
  Search, 
  AlertCircle, 
  RefreshCw, 
  FolderPlus, 
  Folder, 
  Plus,
  Pencil,
  Trash
} from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { formatBytes, formatDuration } from "@/lib/utils";
import { 
  useCollections, 
  useCollectionVideos, 
  useCreateCollection, 
  useUpdateCollection, 
  useDeleteCollection,
  useAddVideoToCollection,
  useRemoveVideoFromCollection,
  type Collection
} from "@/hooks/useCollections";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

interface Video {
  id: number;
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  duration: string;
  filepath: string;
  filesize: number;
  quality: string;
  format: string;
  downloaded: boolean;
  downloadedAt: string;
}

// Componente para exibir os formulários de criação e edição de coleções
function CollectionForm({ 
  collection = null, 
  onSubmit, 
  onCancel 
}: { 
  collection?: Collection | null, 
  onSubmit: (data: { name: string, description: string | null }) => void, 
  onCancel: () => void 
}) {
  const [name, setName] = useState(collection?.name || "");
  const [description, setDescription] = useState(collection?.description || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ 
      name, 
      description: description || null 
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="collection-name">Collection Name</Label>
        <Input 
          id="collection-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Collection"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="collection-description">Description (Optional)</Label>
        <Input 
          id="collection-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description of the collection"
        />
      </div>
      
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {collection ? "Update" : "Create"}
        </Button>
      </DialogFooter>
    </form>
  );
}

// Componente principal da biblioteca
export default function Library() {
  const [searchFilter, setSearchFilter] = useState("");
  const [activeTab, setActiveTab] = useState("all-videos");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [collectionToEdit, setCollectionToEdit] = useState<Collection | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<number | null>(null);
  
  const { toast } = useToast();
  
  // Consultas para dados
  const { data: videos, isLoading: isVideosLoading, error: videosError, refetch: refetchVideos } = useQuery<Video[]>({
    queryKey: ['/api/library'],
  });
  
  const { data: collections, isLoading: isCollectionsLoading } = useCollections();
  const { data: collectionVideos, isLoading: isCollectionVideosLoading } = useCollectionVideos(selectedCollection || 0);
  
  // Mutations
  const createCollectionMutation = useCreateCollection();
  const updateCollectionMutation = useUpdateCollection();
  const deleteCollectionMutation = useDeleteCollection();
  const addToCollectionMutation = useAddVideoToCollection();
  const removeFromCollectionMutation = useRemoveVideoFromCollection();
  
  // Filtragem de vídeos
  const filteredVideos = videos?.filter(video => 
    video.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
    video.channelTitle.toLowerCase().includes(searchFilter.toLowerCase())
  );
  
  // Manipuladores de eventos para coleções
  const handleCreateCollection = async (data: { name: string, description: string | null }) => {
    try {
      await createCollectionMutation.mutateAsync(data);
      setIsCreateDialogOpen(false);
      toast({
        title: "Collection Created",
        description: `Collection "${data.name}" has been created successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create collection. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleEditCollection = async (data: { name: string, description: string | null }) => {
    if (!collectionToEdit) return;
    
    try {
      await updateCollectionMutation.mutateAsync({
        id: collectionToEdit.id,
        data
      });
      setIsEditDialogOpen(false);
      setCollectionToEdit(null);
      toast({
        title: "Collection Updated",
        description: `Collection "${data.name}" has been updated successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update collection. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleDeleteCollection = async (id: number) => {
    try {
      await deleteCollectionMutation.mutateAsync(id);
      if (selectedCollection === id) {
        setSelectedCollection(null);
        setActiveTab("all-videos");
      }
      toast({
        title: "Collection Deleted",
        description: "Collection has been deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete collection. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleAddToCollection = async (videoId: number, collectionId: number) => {
    try {
      await addToCollectionMutation.mutateAsync({ videoId, collectionId });
      toast({
        title: "Video Added",
        description: "Video added to collection successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add video to collection. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleRemoveFromCollection = async (videoId: number, collectionId: number) => {
    try {
      await removeFromCollectionMutation.mutateAsync({ videoId, collectionId });
      toast({
        title: "Video Removed",
        description: "Video removed from collection successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove video from collection. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const streamVideo = (videoId: string) => {
    window.open(`/api/stream/${videoId}`, '_blank');
  };
  
  // Loading state
  if (isVideosLoading || isCollectionsLoading) {
    return (
      <div className="p-4">
        <h2 className="text-2xl font-semibold mb-4">Video Library</h2>
        <div className="mb-4">
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="bg-card">
              <CardContent className="p-0">
                <Skeleton className="w-full h-40" />
                <div className="p-3">
                  <Skeleton className="h-5 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  
  if (videosError) {
    return (
      <div className="p-4">
        <h2 className="text-2xl font-semibold mb-4">Video Library</h2>
        <Card className="bg-card p-4">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-xl font-medium mb-2">Error Loading Library</h3>
            <p className="text-muted-foreground text-center mb-4">
              There was a problem fetching your video library. Please try again.
            </p>
            <Button onClick={() => refetchVideos()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Video Library</h2>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="flex items-center gap-1">
              <FolderPlus className="h-4 w-4" />
              <span>New Collection</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Collection</DialogTitle>
              <DialogDescription>
                Create a new collection to organize your videos.
              </DialogDescription>
            </DialogHeader>
            <CollectionForm 
              onSubmit={handleCreateCollection} 
              onCancel={() => setIsCreateDialogOpen(false)} 
            />
          </DialogContent>
        </Dialog>
      </div>
      
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Collection</DialogTitle>
            <DialogDescription>
              Update your collection details.
            </DialogDescription>
          </DialogHeader>
          <CollectionForm 
            collection={collectionToEdit} 
            onSubmit={handleEditCollection} 
            onCancel={() => setIsEditDialogOpen(false)} 
          />
        </DialogContent>
      </Dialog>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent space-x-2">
          <TabsTrigger 
            value="all-videos" 
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-t-md rounded-b-none border-b-2 data-[state=active]:border-primary data-[state=inactive]:border-transparent px-4 py-2"
            onClick={() => setSelectedCollection(null)}
          >
            All Videos
          </TabsTrigger>
          
          {collections && collections.map(collection => (
            <TabsTrigger 
              key={collection.id}
              value={`collection-${collection.id}`}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-t-md rounded-b-none border-b-2 data-[state=active]:border-primary data-[state=inactive]:border-transparent px-4 py-2 flex items-center gap-2"
              onClick={() => setSelectedCollection(collection.id)}
            >
              <Folder className="h-4 w-4" />
              <span>{collection.name}</span>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-6 w-6 ml-1 opacity-70 hover:opacity-100">
                    <div className="w-4 h-0.5 bg-current" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    setCollectionToEdit(collection);
                    setIsEditDialogOpen(true);
                  }}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-destructive focus:text-destructive" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCollection(collection.id);
                    }}
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TabsTrigger>
          ))}
        </TabsList>
        
        <div className="mt-4 relative">
          <Input
            className="bg-card border-none pl-10"
            placeholder="Search your library..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
          {searchFilter && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-2 top-1.5 h-7 w-7"
              onClick={() => setSearchFilter("")}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <TabsContent value="all-videos" className="pt-4">
          {videos && videos.length > 0 ? (
            <>
              {filteredVideos && filteredVideos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredVideos.map(video => (
                    <Card key={video.id} className="bg-card overflow-hidden video-card">
                      <div className="relative">
                        {video.thumbnail ? (
                          <img 
                            src={video.thumbnail} 
                            alt={video.title} 
                            className="w-full aspect-video object-cover"
                          />
                        ) : (
                          <div className="w-full aspect-video bg-accent flex items-center justify-center">
                            <VideoIcon className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                        {video.duration && (
                          <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 px-1 rounded text-xs">
                            {formatDuration(video.duration)}
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className="font-medium text-sm line-clamp-2">{video.title}</h3>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs text-muted-foreground">{video.channelTitle}</span>
                          <Badge variant="outline" className="text-xs">
                            {video.quality || video.format}
                          </Badge>
                        </div>
                      </div>
                      <div className="p-2 border-t border-border flex justify-between">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-muted-foreground">
                              <FolderPlus className="h-4 w-4 mr-1" />
                              <span>Add to</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {collections && collections.length > 0 ? (
                              collections.map(collection => (
                                <DropdownMenuItem 
                                  key={collection.id}
                                  onClick={() => handleAddToCollection(video.id, collection.id)}
                                >
                                  <Folder className="h-4 w-4 mr-2" />
                                  {collection.name}
                                </DropdownMenuItem>
                              ))
                            ) : (
                              <DropdownMenuItem disabled>
                                No collections yet
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="text-primary mac-btn p-0"
                          onClick={() => streamVideo(video.videoId)}
                        >
                          Play Video
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="bg-card">
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <Search className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-medium mb-2">No Matching Videos</h3>
                    <p className="text-muted-foreground text-center">
                      No videos match your search for "{searchFilter}". Try different keywords.
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card className="bg-card">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <VideoIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-medium mb-2">Your Library is Empty</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  You haven't downloaded any videos yet. Search and download videos to add them to your library.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {collections && collections.map(collection => (
          <TabsContent 
            key={collection.id} 
            value={`collection-${collection.id}`}
            className="pt-4"
          >
            {selectedCollection === collection.id && (
              <>
                {isCollectionVideosLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <Card key={i} className="bg-card">
                        <CardContent className="p-0">
                          <Skeleton className="w-full h-40" />
                          <div className="p-3">
                            <Skeleton className="h-5 w-full mb-2" />
                            <Skeleton className="h-4 w-2/3" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <>
                    {collectionVideos && collectionVideos.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {collectionVideos
                          .filter(video => 
                            video.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
                            video.channelTitle.toLowerCase().includes(searchFilter.toLowerCase())
                          )
                          .map(video => (
                            <Card key={video.id} className="bg-card overflow-hidden video-card">
                              <div className="relative">
                                {video.thumbnail ? (
                                  <img 
                                    src={video.thumbnail} 
                                    alt={video.title} 
                                    className="w-full aspect-video object-cover"
                                  />
                                ) : (
                                  <div className="w-full aspect-video bg-accent flex items-center justify-center">
                                    <VideoIcon className="h-12 w-12 text-muted-foreground" />
                                  </div>
                                )}
                                {video.duration && (
                                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 px-1 rounded text-xs">
                                    {formatDuration(video.duration)}
                                  </div>
                                )}
                              </div>
                              <div className="p-3">
                                <h3 className="font-medium text-sm line-clamp-2">{video.title}</h3>
                                <div className="flex justify-between items-center mt-2">
                                  <span className="text-xs text-muted-foreground">{video.channelTitle}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {video.quality || video.format}
                                  </Badge>
                                </div>
                              </div>
                              <div className="p-2 border-t border-border flex justify-between">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="text-destructive"
                                  onClick={() => handleRemoveFromCollection(video.id, collection.id)}
                                >
                                  <Trash className="h-4 w-4 mr-1" />
                                  <span>Remove</span>
                                </Button>
                                <Button 
                                  variant="link" 
                                  size="sm" 
                                  className="text-primary mac-btn p-0"
                                  onClick={() => streamVideo(video.videoId)}
                                >
                                  Play Video
                                </Button>
                              </div>
                            </Card>
                          ))}
                      </div>
                    ) : (
                      <Card className="bg-card">
                        <CardContent className="flex flex-col items-center justify-center py-12">
                          <Folder className="h-12 w-12 text-muted-foreground mb-4" />
                          <h3 className="text-xl font-medium mb-2">Collection is Empty</h3>
                          <p className="text-muted-foreground text-center max-w-md">
                            This collection doesn't have any videos yet. Add videos from the All Videos tab.
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
