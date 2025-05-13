import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultApiKey: string;
}

export default function ApiKeyModal({ isOpen, onClose, defaultApiKey }: ApiKeyModalProps) {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState(defaultApiKey || "AIzaSyBotvakfTmSC-f3m4RSLsMjnc83GB6xMs8");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const handleSave = async () => {
    if (!apiKey.trim()) {
      toast({
        variant: "destructive",
        title: "API Key Required",
        description: "Please enter a valid YouTube API key",
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      await apiRequest('POST', '/api/config', {
        youtubeApiKey: apiKey,
      });
      
      toast({
        title: "API Key Saved",
        description: "Your YouTube API key has been saved successfully",
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/config'] });
      onClose();
    } catch (error) {
      console.error("Failed to save API key:", error);
      toast({
        variant: "destructive",
        title: "Failed to Save API Key",
        description: "There was a problem saving your API key. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-card max-w-md">
        <DialogHeader>
          <DialogTitle>YouTube API Configuration</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Enter your YouTube Data API key to enable video searching and downloading.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <div className="relative">
              <Input
                id="apiKey"
                type={showApiKey ? "text" : "password"}
                placeholder="Enter your YouTube API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="bg-background pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              You can obtain an API key from the{" "}
              <a 
                href="https://console.cloud.google.com/apis/credentials" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Google Cloud Console
              </a>.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="dbConnection">PostgreSQL Connection</Label>
            <Input
              id="dbConnection"
              type="password"
              value="●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●"
              disabled
              className="bg-background cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground">
              Database connection is configured via environment variables.
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Configuration"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
