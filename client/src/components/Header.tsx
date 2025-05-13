import { useContext } from "react";
import { Settings, User } from "lucide-react";
import { AppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import ApiKeyModal from "@/components/ApiKeyModal";

export default function Header() {
  const { isApiKeyModalOpen, setIsApiKeyModalOpen, apiConfig } = useContext(AppContext);
  
  return (
    <header className="bg-card px-4 py-3 flex items-center justify-between border-b border-border">
      <div className="flex items-center space-x-2">
        <svg className="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 8H20M4 16H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M6 12H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <rect x="9" y="3" width="6" height="18" rx="2" fill="currentColor"/>
        </svg>
        <h1 className="text-xl font-semibold">Video Vault</h1>
      </div>
      <div className="flex items-center space-x-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:bg-accent"
                onClick={() => setIsApiKeyModalOpen(true)}
              >
                <Settings className="h-5 w-5 text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Settings</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-sm font-medium">
                <User className="h-4 w-4 text-primary-foreground" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>User Profile</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <ApiKeyModal 
        isOpen={isApiKeyModalOpen} 
        onClose={() => setIsApiKeyModalOpen(false)} 
        defaultApiKey={apiConfig?.youtubeApiKey || ""}
      />
    </header>
  );
}
