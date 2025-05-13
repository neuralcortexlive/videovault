import { useState, useRef, KeyboardEvent } from "react";
import { Search, X, Key } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SearchBarProps {
  onSearch: (query: string) => void;
  onOpenApiKeyModal: () => void;
  hasApiKey?: boolean;
}

export default function SearchBar({ onSearch, onOpenApiKeyModal, hasApiKey = false }: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  
  const handleSearch = () => {
    if (searchTerm.trim()) {
      onSearch(searchTerm.trim());
    }
  };
  
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  const clearSearch = () => {
    setSearchTerm("");
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  return (
    <div className="sticky top-0 z-10 bg-background px-4 py-3 border-b border-border">
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search YouTube videos..."
          className="w-full bg-card text-foreground pl-10 pr-20 py-2 rounded-lg focus-visible:ring-primary border-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
        <div className="absolute right-2 top-1.5 flex space-x-1">
          {searchTerm && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-full"
                    onClick={clearSearch}
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Clear search</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-7 w-7 rounded-full ${!hasApiKey && 'text-yellow-500'}`}
                  onClick={onOpenApiKeyModal}
                >
                  <Key className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Configure YouTube API Key</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 mt-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="bg-card hover:bg-accent rounded-full h-7 px-3 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => {
            setSearchTerm("Latest videos");
            onSearch("Latest videos");
          }}
        >
          Latest videos
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="bg-card hover:bg-accent rounded-full h-7 px-3 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => {
            setSearchTerm("High quality");
            onSearch("High quality");
          }}
        >
          High quality
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="bg-card hover:bg-accent rounded-full h-7 px-3 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => {
            setSearchTerm("Tutorial");
            onSearch("Tutorial");
          }}
        >
          Tutorial
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="bg-card hover:bg-accent rounded-full h-7 px-3 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => {
            setSearchTerm("Music");
            onSearch("Music");
          }}
        >
          Music
        </Button>
      </div>
    </div>
  );
}
