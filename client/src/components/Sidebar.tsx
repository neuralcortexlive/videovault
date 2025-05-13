import { Link } from "wouter";
import { 
  Search, 
  Download, 
  ListVideo, 
  History as HistoryIcon, 
  CheckCircle, 
  RefreshCw 
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Progress } from "@/components/ui/progress";
import { formatBytes } from "@/lib/utils";

interface SidebarProps {
  currentPath: string;
}

interface Download {
  id: number;
  videoId: string;
  status: string;
  progress: number;
  downloadedSize: number | null;
  totalSize: number | null;
}

export default function Sidebar({ currentPath }: SidebarProps) {
  const { data: activeDownloads } = useQuery<Download[]>({
    queryKey: ['/api/downloads/active'],
    refetchInterval: 2000, // Poll active downloads every 2 seconds
  });
  
  const { data: completedDownloads } = useQuery<Download[]>({
    queryKey: ['/api/downloads'],
    refetchInterval: 5000, // Poll less frequently
    select: (data) => data.filter(download => download.status === 'completed').slice(0, 5)
  });
  
  return (
    <aside className="hidden md:flex flex-col w-56 bg-card p-3 space-y-1 border-r border-border mac-scrollbar overflow-y-auto">
      <div className={`flex items-center space-x-3 px-3 py-2 rounded-lg ${
          currentPath === '/' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
        }`}>
        <Link href="/">
          <div className="flex items-center space-x-3 w-full">
            <Search className="h-5 w-5" />
            <span>Search</span>
          </div>
        </Link>
      </div>
      
      <div className={`flex items-center space-x-3 px-3 py-2 rounded-lg ${
          currentPath === '/downloads' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
        }`}>
        <Link href="/downloads">
          <div className="flex items-center space-x-3 w-full">
            <Download className="h-5 w-5" />
            <span>Downloads</span>
          </div>
        </Link>
      </div>
      
      <div className={`flex items-center space-x-3 px-3 py-2 rounded-lg ${
          currentPath === '/library' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
        }`}>
        <Link href="/library">
          <div className="flex items-center space-x-3 w-full">
            <ListVideo className="h-5 w-5" />
            <span>Library</span>
          </div>
        </Link>
      </div>
      
      <div className={`flex items-center space-x-3 px-3 py-2 rounded-lg ${
          currentPath === '/history' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
        }`}>
        <Link href="/history">
          <div className="flex items-center space-x-3 w-full">
            <HistoryIcon className="h-5 w-5" />
            <span>History</span>
          </div>
        </Link>
      </div>
      
      <div className="border-t border-border my-2 pt-2">
        <h3 className="text-xs font-medium text-muted-foreground px-3 mb-1">DOWNLOADS</h3>
        
        {activeDownloads?.map(download => (
          <div key={download.id} className="px-3 py-2 rounded-lg flex items-center justify-between hover:bg-accent cursor-pointer">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 relative">
                <RefreshCw className="h-5 w-5 text-primary animate-spin" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm truncate w-36">{download.videoId}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-muted-foreground">
                    {download.progress}%
                  </span>
                  {download.downloadedSize && download.totalSize && (
                    <span className="text-xs text-muted-foreground">
                      {formatBytes(download.downloadedSize)}/{formatBytes(download.totalSize)}
                    </span>
                  )}
                </div>
                <Progress value={download.progress} className="h-1 mt-1 w-full" />
              </div>
            </div>
          </div>
        ))}
        
        {completedDownloads?.map(download => (
          <div key={download.id} className="px-3 py-2 rounded-lg flex items-center justify-between hover:bg-accent cursor-pointer">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div className="flex flex-col">
                <span className="text-sm truncate w-36">{download.videoId}</span>
                <span className="text-xs text-muted-foreground">
                  Completed • {download.totalSize ? formatBytes(download.totalSize) : 'Unknown size'}
                </span>
              </div>
            </div>
          </div>
        ))}
        
        {(!activeDownloads || activeDownloads.length === 0) && 
         (!completedDownloads || completedDownloads.length === 0) && (
          <div className="px-3 py-6 text-center">
            <p className="text-xs text-muted-foreground">No recent downloads</p>
          </div>
        )}
      </div>
    </aside>
  );
}
