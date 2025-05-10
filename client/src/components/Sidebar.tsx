import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  Search, 
  Download, 
  History, 
  Settings, 
  Folder, 
  Plus,
  GripVertical
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import CollectionModal from "./CollectionModal";
import { Collection } from "@shared/schema";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Função para gerar slug a partir do nome
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

interface SortableCollectionItemProps {
  collection: Collection;
  isActive: boolean;
}

function SortableCollectionItem({ collection, isActive }: SortableCollectionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: collection.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center">
      <button
        {...attributes}
        {...listeners}
        className="p-1 mr-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <Link href={`/collections/${generateSlug(collection.name)}`} className="flex-1">
        <Button 
          variant={isActive ? "secondary" : "ghost"} 
          className="w-full justify-start text-sm font-medium"
        >
          <Folder className="mr-3 h-4 w-4" />
          <span className="truncate">{collection.name}</span>
        </Button>
      </Link>
    </div>
  );
}

interface SidebarProps {
  open: boolean;
}

export default function Sidebar({ open }: SidebarProps) {
  const [location] = useLocation();
  const [showCollectionModal, setShowCollectionModal] = useState(false);

  const { data: collections = [], refetch } = useQuery<Collection[]>({
    queryKey: ['/api/collections'],
  });

  const updateCollectionOrder = useMutation({
    mutationFn: async (newOrder: Collection[]) => {
      const response = await fetch('/api/collections/reorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ collections: newOrder }),
      });
      if (!response.ok) {
        throw new Error('Falha ao reordenar coleções');
      }
      return response.json();
    },
    onSuccess: () => {
      refetch();
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = collections.findIndex((c) => c.id === active.id);
      const newIndex = collections.findIndex((c) => c.id === over.id);
      
      const newOrder = arrayMove(collections, oldIndex, newIndex);
      updateCollectionOrder.mutate(newOrder);
    }
  };

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
                  <span>Início</span>
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
                  <span>Buscar</span>
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
                  <span>Histórico</span>
                </Button>
              </Link>
            </li>
            <li className="mb-4">
              <Button 
                variant="ghost" 
                className="w-full justify-start text-sm font-medium"
              >
                <Settings className="mr-3 h-4 w-4" />
                <span>Configurações</span>
              </Button>
            </li>
            
            <li className="pt-4 border-t border-border/50">
              <h3 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Coleções</h3>
            </li>
            
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={collections.map(c => c.id)}
                strategy={verticalListSortingStrategy}
              >
                {collections.map(collection => (
                  <li key={collection.id} className="mb-1">
                    <SortableCollectionItem
                      collection={collection}
                      isActive={location === `/collections/${generateSlug(collection.name)}`}
                    />
                  </li>
                ))}
              </SortableContext>
            </DndContext>
            
            <li className="pt-2">
              <Button 
                variant="ghost" 
                className="w-full justify-start text-sm font-medium text-primary hover:text-primary hover:bg-primary/10"
                onClick={() => setShowCollectionModal(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
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