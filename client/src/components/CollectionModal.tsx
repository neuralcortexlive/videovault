import { useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Collection } from "@shared/schema";

interface CollectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collection?: Collection;
  videoId?: string;
  mode?: 'create' | 'edit' | 'addVideo';
}

// Form schema
const formSchema = z.object({
  name: z.string().min(1, "Collection name is required"),
  description: z.string().optional(),
  thumbnailUrl: z.string().url().optional().or(z.literal("")),
});

export default function CollectionModal({
  open,
  onOpenChange,
  collection,
  videoId,
  mode = 'create'
}: CollectionModalProps) {
  const { toast } = useToast();
  
  // Create form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: collection?.name || "",
      description: collection?.description || "",
      thumbnailUrl: collection?.thumbnailUrl || "",
    },
  });
  
  // Reset form when modal opens/collection changes
  useEffect(() => {
    if (open && collection) {
      form.reset({
        name: collection.name,
        description: collection.description || "",
        thumbnailUrl: collection.thumbnailUrl || "",
      });
    } else if (open && !collection) {
      form.reset({
        name: "",
        description: "",
        thumbnailUrl: "",
      });
    }
  }, [open, collection, form]);
  
  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (mode === 'edit' && collection) {
        // Update existing collection
        await apiRequest('PUT', `/api/collections/${collection.id}`, values);
        
        toast({
          title: "Collection Updated",
          description: `${values.name} has been updated.`
        });
      } else if (mode === 'addVideo' && videoId) {
        // First create collection if it doesn't exist
        let collectionId: number;
        
        if (!collection) {
          const newCollection = await apiRequest('POST', '/api/collections', values);
          collectionId = newCollection.id;
          
          toast({
            title: "Collection Created",
            description: `${values.name} has been created.`
          });
        } else {
          collectionId = collection.id;
        }
        
        // Add video to collection
        await apiRequest('POST', `/api/collections/${collectionId}/videos`, { videoId });
        
        toast({
          title: "Video Added",
          description: `Video has been added to ${values.name}.`
        });
      } else {
        // Create new collection
        await apiRequest('POST', '/api/collections', values);
        
        toast({
          title: "Collection Created",
          description: `${values.name} has been created.`
        });
      }
      
      // Invalidate collections query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/collections'] });
      
      // Close modal
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save collection. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Determine title and description based on mode
  const modalTitle = mode === 'edit' ? "Edit Collection" : 
                    mode === 'addVideo' ? "Add to Collection" : 
                    "Create New Collection";
  
  const modalDescription = mode === 'edit' ? "Update your collection details." : 
                          mode === 'addVideo' ? "Add this video to a collection." : 
                          "Create a new collection to organize your videos.";
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{modalTitle}</DialogTitle>
          <DialogDescription>{modalDescription}</DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Collection Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter collection name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter collection description (optional)" 
                      {...field} 
                      value={field.value || ""} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="thumbnailUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Thumbnail URL</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter thumbnail URL (optional)" 
                      {...field} 
                      value={field.value || ""} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary hover:bg-red-700">
                {mode === 'edit' ? "Update" : 
                 mode === 'addVideo' ? "Add to Collection" : 
                 "Create Collection"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
