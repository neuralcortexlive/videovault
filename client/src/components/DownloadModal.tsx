import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { Collection, DownloadFormat } from "@shared/schema";

interface DownloadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoId: string;
  title: string;
  thumbnailUrl: string;
  channelTitle: string;
}

export default function DownloadModal({
  open,
  onOpenChange,
  videoId,
  title,
  thumbnailUrl,
  channelTitle
}: DownloadModalProps) {
  const { toast } = useToast();
  const [selectedQuality, setSelectedQuality] = useState<string>("");
  const [selectedCollection, setSelectedCollection] = useState<string>("");
  const [autoMerge, setAutoMerge] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { data: collections = [] } = useQuery<Collection[]>({
    queryKey: ['/api/collections'],
    enabled: open
  });
  
  const { data: formatData, isLoading: isLoadingFormats } = useQuery<{ formats: DownloadFormat[] }>({
    queryKey: [`/api/youtube/formats/${videoId}`],
    enabled: open && !!videoId,
  });
  
  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setSelectedQuality("");
      setSelectedCollection("");
      setAutoMerge(true);
    }
  }, [open]);
  
  // Set default quality when formats load
  useEffect(() => {
    if (formatData?.formats && formatData.formats.length > 0) {
      // Find the highest quality format that has both video and audio
      const highestQualityFormat = formatData.formats
        .filter(format => format.hasVideo && format.qualityLabel)
        .sort((a, b) => {
          const getHeight = (label?: string) => {
            if (!label) return 0;
            const match = label.match(/(\d+)p/);
            return match ? parseInt(match[1]) : 0;
          };
          return getHeight(b.qualityLabel) - getHeight(a.qualityLabel);
        })[0];
      
      if (highestQualityFormat) {
        setSelectedQuality(highestQualityFormat.itag.toString());
      }
    }
  }, [formatData]);
  
  const handleDownload = async () => {
    if (!selectedQuality) {
      toast({
        title: "Error",
        description: "Please select a quality.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const response = await apiRequest('POST', '/api/youtube/download', {
        videoId,
        quality: selectedQuality,
        format: "mp4",
        collectionId: selectedCollection ? parseInt(selectedCollection) : undefined
      });
      
      toast({
        title: "Download Started",
        description: "Your video download has been started."
      });
      
      onOpenChange(false);
    } catch (error) {
      // Handle different error types from the API
      let errorMessage = "Failed to start download. Please try again.";
      
      if (error.response && error.response.data) {
        // If it's a signature extraction error, provide a more helpful message
        if (error.response.data.type === "signature_extraction_error") {
          errorMessage = "YouTube download temporarily unavailable: YouTube has updated their player code. This is a common issue with downloaders and should be fixed soon. Please try again later.";
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      }
      
      toast({
        title: "Download Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Group video formats for display
  const videoFormats = formatData?.formats
    .filter(format => format.hasVideo && format.qualityLabel)
    .sort((a, b) => {
      const getHeight = (label?: string) => {
        if (!label) return 0;
        const match = label.match(/(\d+)p/);
        return match ? parseInt(match[1]) : 0;
      };
      return getHeight(b.qualityLabel) - getHeight(a.qualityLabel);
    }) || [];
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Download Options</DialogTitle>
          <DialogDescription>
            Configure download options for your video.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mb-4">
          <img 
            src={thumbnailUrl} 
            alt={title} 
            className="w-full h-56 object-cover rounded-lg mb-2"
          />
          <h4 className="font-medium">{title}</h4>
          <p className="text-gray-500 text-sm">{channelTitle}</p>
        </div>
        
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">Select Quality:</h4>
          <div className="grid grid-cols-2 gap-2">
            {isLoadingFormats ? (
              <div className="col-span-2 text-center py-2">Loading formats...</div>
            ) : videoFormats.length === 0 ? (
              <div className="col-span-2 text-center py-2">No formats available</div>
            ) : (
              videoFormats.map(format => (
                <Button
                  key={format.itag}
                  variant={selectedQuality === format.itag.toString() ? "default" : "outline"}
                  className={selectedQuality === format.itag.toString() ? "border-primary bg-primary bg-opacity-10 text-primary" : ""}
                  onClick={() => setSelectedQuality(format.itag.toString())}
                >
                  {format.qualityLabel}
                </Button>
              ))
            )}
          </div>
        </div>
        
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">Add to Collection:</h4>
          <Select
            value={selectedCollection}
            onValueChange={setSelectedCollection}
          >
            <SelectTrigger>
              <SelectValue placeholder="-- Select Collection --" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">-- Select Collection --</SelectItem>
              {collections.map(collection => (
                <SelectItem key={collection.id} value={collection.id.toString()}>
                  {collection.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center mb-4">
          <Checkbox 
            id="autoMerge" 
            checked={autoMerge} 
            onCheckedChange={(checked) => setAutoMerge(checked === true)} 
            className="mr-2"
          />
          <Label htmlFor="autoMerge" className="text-sm">
            Automatically merge audio and video streams
          </Label>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleDownload} 
            className="bg-primary hover:bg-red-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Starting..." : "Start Download"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
