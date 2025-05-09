import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Menu, Settings, User } from "lucide-react";
import useYouTubeSearch from "@/hooks/use-youtube-search";

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [, navigate] = useLocation();
  const { search } = useYouTubeSearch();

  const handleSearch = () => {
    if (searchQuery.trim()) {
      console.log("Search started for:", searchQuery);
      const query = encodeURIComponent(searchQuery.trim());
      navigate(`/search?q=${query}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <header className="bg-card/50 backdrop-blur-xl border-b border-border/50 sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden mr-2" 
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Link href="/" className="flex items-center">
            <span className="text-primary font-semibold text-lg">VideoVault</span>
          </Link>
        </div>
        
        <div className="flex-1 max-w-3xl mx-4 sm:mx-8">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search videos..."
              className="w-full px-4 py-2 bg-muted/50 border-border/50 rounded-full focus:ring-2 focus:ring-primary/20 focus:border-primary/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-primary"
              onClick={handleSearch}
            >
              <Search className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="ml-2 text-muted-foreground hover:text-primary">
            <Settings className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="ml-2 text-muted-foreground hover:text-primary">
            <User className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}