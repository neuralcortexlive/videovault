import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  Search, 
  Download, 
  History, 
  Settings, 
  Folder, 
  Plus 
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import CollectionModal from "./CollectionModal";
import { Collection } from "@shared/schema";

interface SidebarProps {
  open: boolean;
}

export default function Sidebar({ open }: SidebarProps) {
  const [location] = useLocation();
  const [showCollectionModal, setShowCollectionModal] = useState(false);

  const { data: collections = [] } = useQuery<Collection[]>({
    queryKey: ['/api/collections'],
  });

  if (!open) {
    return null;
  }

  return (
    <>
      <aside className="w-60 bg-card/50 backdrop-blur-xl border-r border-border/50 fixed h-full pt-16 overflow-y-auto z-0">
        <nav className="p-4">
          <ul className="space-y-1">
            <li>
              <Link href="/">
                <Button 
                  variant={location === "/" ? "secondary" : "ghost"} 
                  className="w-full justify-start text-sm font-medium"
                >
                  <Home className="mr-3 h-4 w-4 text-primary" />
                  <span>Home</span>
                </Button>
              </Link>
            </li>
            <li>
              <Link href="/search">
                <Button 
                  variant={location === "/search" ? "secondary" : "ghost"} 
                  className="w-full justify-start text-sm font-medium"
                >
                  <Search className="mr-3 h-4 w-4" />
                  <span>Search</span>
                </Button>
              </Link>
            </li>
            <li>
              <Link href="/downloads">
                <Button 
                  variant={location === "/downloads" ? "secondary" : "ghost"} 
                  className="w-full justify-start text-sm font-medium"
                >
                  <Download className="mr-3 h-4 w-4" />
                  <span>Downloads</span>
                </Button>
              </Link>
            </li>
            <li>
              <Link href="/history">
                <Button 
                  variant={location === "/history" ? "secondary" : "ghost"} 
                  className="w-full justify-start text-sm font-medium"
                >
                  <History className="mr-3 h-4 w-4" />
                  <span>History</span>
                </Button>
              </Link>
            </li>
            <li className="mb-4">
              <Button 
                variant="ghost" 
                className="w-full justify-start text-sm font-medium"
              >
                <Settings className="mr-3 h-4 w-4" />
                <span>Settings</span>
              </Button>
            </li>
            
            <li className="pt-4 border-t border-border/50">
              <h3 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Collections</h3>
            </li>
            
            {collections.map(collection => (
              <li key={collection.id}>
                <Link href={`/collections/${collection.id}`}>
                  <Button 
                    variant={location === `/collections/${collection.id}` ? "secondary" : "ghost"} 
                    className="w-full justify-start text-sm font-medium"
                  >
                    <Folder className="mr-3 h-4 w-4" />
                    <span className="truncate">{collection.name}</span>
                  </Button>
                </Link>
              </li>
            ))}
            
            <li className="pt-2">
              <Button 
                variant="ghost" 
                className="w-full justify-start text-sm font-medium text-primary hover:text-primary hover:bg-primary/10"
                onClick={() => setShowCollectionModal(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                <span>New Collection</span>
              </Button>
            </li>
          </ul>
        </nav>
      </aside>

      <CollectionModal 
        open={showCollectionModal} 
        onOpenChange={setShowCollectionModal} 
      />
    </>
  );
}