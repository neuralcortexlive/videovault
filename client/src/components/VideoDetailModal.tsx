import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useVideoDetails } from "@/hooks/useYoutubeSearch";
import { useStartDownload } from "@/hooks/useDownloadManager";
import { formatViewCount, formatDuration } from "@/lib/utils";
import { X, Calendar, Eye, ThumbsUp, Download, Play } from "lucide-react";
import { format } from "date-fns";

interface VideoDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoId: string;
  onDownload: (videoId: string) => void;
}

export default function VideoDetailModal({ isOpen, onClose, videoId, onDownload }: VideoDetailModalProps) {
  const { data: video, isLoading, error } = useVideoDetails(videoId);
  const startDownload = useStartDownload();
  
  const [downloadFormat, setDownloadFormat] = useState("mp4");
  const [videoCodec, setVideoCodec] = useState("h264");
  const [audioCodec, setAudioCodec] = useState("aac");
  const [processWithFfmpeg, setProcessWithFfmpeg] = useState(true);
  const [saveMetadata, setSaveMetadata] = useState(true);
  const [addToLibrary, setAddToLibrary] = useState(true);
  const [selectedQuality, setSelectedQuality] = useState("720p");
  
  const handleDownload = (quality: string) => {
    const options = {
      videoId,
      format: downloadFormat,
      quality,
      saveMetadata,
    };
    onDownload(videoId);
  };

  const handleAdvancedDownload = () => {
    const options = {
      videoId,
      format: downloadFormat,
      quality: selectedQuality,
      audioOnly: false,
      saveMetadata,
    };
    onDownload(videoId);
  };
  
  const formatPublishedDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch (e) {
      return "Unknown date";
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-card max-w-4xl max-h-[90vh] p-0 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-medium">Video Details</h2>
        </div>
        
        <ScrollArea className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col md:flex-row">
              <div className="md:w-2/3">
                <Skeleton className="w-full aspect-video" />
                <div className="p-4">
                  <Skeleton className="h-7 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-4" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </div>
              <div className="md:w-1/3 border-l border-border p-4">
                <Skeleton className="h-6 w-1/2 mb-3" />
                <div className="space-y-3 mb-6">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-destructive">Error loading video details. Please try again.</p>
            </div>
          ) : video ? (
            <div className="flex flex-col md:flex-row">
              <div className="md:w-2/3">
                <img 
                  src={video.thumbnail} 
                  alt={video.title} 
                  className="w-full aspect-video object-cover"
                />
                
                <div className="p-4">
                  <h2 className="text-xl font-medium mb-2">{video.title}</h2>
                  <div className="flex flex-wrap items-center text-sm text-muted-foreground mb-4">
                    <span className="flex items-center mr-4">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatPublishedDate(video.publishedAt)}
                    </span>
                    <span className="flex items-center mr-4">
                      <Eye className="h-4 w-4 mr-1" />
                      {formatViewCount(video.viewCount)}
                    </span>
                    <span className="flex items-center">
                      <ThumbsUp className="h-4 w-4 mr-1" />
                      {formatViewCount(video.likeCount).replace('views', '')}
                    </span>
                  </div>
                  
                  <p className="text-muted-foreground text-sm mb-4">
                    {video.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-2">
                    {video.tags?.slice(0, 6).map((tag, index) => (
                      <Badge key={index} variant="outline" className="bg-background px-2 py-1 rounded-full text-xs text-muted-foreground">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="md:w-1/3 border-l border-border p-4">
                <h3 className="font-medium mb-3">Download Options</h3>
                
                <div className="space-y-3 mb-6">
                  <div className="bg-background p-3 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">720p MP4</div>
                      <div className="text-xs text-muted-foreground">H.264 + AAC • ~22MB</div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="text-primary"
                      onClick={() => handleDownload("720p")}
                    >
                      <Download className="h-5 w-5" />
                    </Button>
                  </div>
                  
                  <div className="bg-background p-3 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">1080p MP4</div>
                      <div className="text-xs text-muted-foreground">H.264 + AAC • ~45MB</div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="text-primary"
                      onClick={() => handleDownload("1080p")}
                    >
                      <Download className="h-5 w-5" />
                    </Button>
                  </div>
                  
                  <div className="bg-background p-3 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">Audio Only</div>
                      <div className="text-xs text-muted-foreground">MP3 128kbps • ~8MB</div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="text-primary"
                      onClick={() => {
                        onDownload(videoId);
                      }}
                    >
                      <Download className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
                
                <h3 className="font-medium mb-3">Advanced Options</h3>
                
                <div className="bg-background p-3 rounded-lg mb-3 space-y-2">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <Label>Format</Label>
                    <Select 
                      value={downloadFormat} 
                      onValueChange={setDownloadFormat}
                    >
                      <SelectTrigger className="bg-card border border-border rounded w-32 h-8">
                        <SelectValue placeholder="Best Quality" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mp4">MP4 (H.264)</SelectItem>
                        <SelectItem value="webm">WebM (VP9)</SelectItem>
                        <SelectItem value="best">Best Quality</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm mb-2">
                    <Label>Video Codec</Label>
                    <Select 
                      value={videoCodec} 
                      onValueChange={setVideoCodec}
                      disabled={downloadFormat !== "custom"}
                    >
                      <SelectTrigger className="bg-card border border-border rounded w-32 h-8">
                        <SelectValue placeholder="H.264" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="h264">H.264</SelectItem>
                        <SelectItem value="h265">H.265</SelectItem>
                        <SelectItem value="vp9">VP9</SelectItem>
                        <SelectItem value="av1">AV1</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <Label>Audio Codec</Label>
                    <Select
                      value={audioCodec} 
                      onValueChange={setAudioCodec}
                      disabled={downloadFormat !== "custom"}
                    >
                      <SelectTrigger className="bg-card border border-border rounded w-32 h-8">
                        <SelectValue placeholder="AAC" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aac">AAC</SelectItem>
                        <SelectItem value="mp3">MP3</SelectItem>
                        <SelectItem value="opus">Opus</SelectItem>
                        <SelectItem value="flac">FLAC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="bg-background p-3 rounded-lg space-y-3">
                  <div className="flex items-center">
                    <Checkbox 
                      id="process-ffmpeg" 
                      checked={processWithFfmpeg} 
                      onCheckedChange={(checked) => setProcessWithFfmpeg(!!checked)}
                    />
                    <Label htmlFor="process-ffmpeg" className="ml-2 text-sm">
                      Process with ffmpeg after download
                    </Label>
                  </div>
                  
                  <div className="flex items-center">
                    <Checkbox 
                      id="save-metadata" 
                      checked={saveMetadata} 
                      onCheckedChange={(checked) => setSaveMetadata(!!checked)}
                    />
                    <Label htmlFor="save-metadata" className="ml-2 text-sm">
                      Save metadata to database
                    </Label>
                  </div>
                  
                  <div className="flex items-center">
                    <Checkbox 
                      id="add-library" 
                      checked={addToLibrary} 
                      onCheckedChange={(checked) => setAddToLibrary(!!checked)}
                    />
                    <Label htmlFor="add-library" className="ml-2 text-sm">
                      Add to library automatically
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </ScrollArea>
        
        <div className="p-4 border-t border-border flex justify-between">
          <Button variant="outline" onClick={onClose} className="mac-btn">
            Close
          </Button>
          <Button onClick={handleAdvancedDownload} className="mac-btn flex items-center">
            <Download className="h-4 w-4 mr-2" />
            <span>Download with Default Settings</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
