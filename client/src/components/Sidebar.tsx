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
      <aside className="w-60 bg-white border-r border-gray-200 fixed h-full pt-16 overflow-y-auto z-0">
        <nav className="p-4">
          <ul>
            <li className="mb-1">
              <Link href="/">
                <Button 
                  variant={location === "/" ? "secondary" : "ghost"} 
                  className="w-full justify-start"
                >
                  <Home className="mr-3 h-5 w-5 text-primary" />
                  <span>Início</span>
                </Button>
              </Link>
            </li>
            <li className="mb-1">
              <Link href="/search">
                <Button 
                  variant={location === "/search" ? "secondary" : "ghost"} 
                  className="w-full justify-start"
                >
                  <Search className="mr-3 h-5 w-5" />
                  <span>Buscar</span>
                </Button>
              </Link>
            </li>
            <li className="mb-1">
              <Link href="/downloads">
                <Button 
                  variant={location === "/downloads" ? "secondary" : "ghost"} 
                  className="w-full justify-start"
                >
                  <Download className="mr-3 h-5 w-5" />
                  <span>Downloads</span>
                </Button>
              </Link>
            </li>
            <li className="mb-1">
              <Link href="/history">
                <Button 
                  variant={location === "/history" ? "secondary" : "ghost"} 
                  className="w-full justify-start"
                >
                  <History className="mr-3 h-5 w-5" />
                  <span>Histórico</span>
                </Button>
              </Link>
            </li>
            <li className="mb-4">
              <Button variant="ghost" className="w-full justify-start">
                <Settings className="mr-3 h-5 w-5" />
                <span>Configurações</span>
              </Button>
            </li>
            
            <li className="mb-2">
              <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Coleções</h3>
            </li>
            
            {collections.map(collection => (
              <li className="mb-1" key={collection.id}>
                <Link href={`/collections/${collection.id}`}>
                  <Button 
                    variant={location === `/collections/${collection.id}` ? "secondary" : "ghost"} 
                    className="w-full justify-start"
                  >
                    <Folder className="mr-3 h-5 w-5" />
                    <span className="truncate">{collection.name}</span>
                  </Button>
                </Link>
              </li>
            ))}
            
            <li className="mt-2">
              <Button 
                variant="ghost" 
                className="w-full justify-start text-accent"
                onClick={() => setShowCollectionModal(true)}
              >
                <Plus className="mr-2 h-5 w-5" />
                <span>Nova Coleção</span>
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