import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Download, 
  Calendar 
} from "lucide-react";
import useDownloads from "@/hooks/use-downloads";
import { Skeleton } from "@/components/ui/skeleton";

export default function History() {
  const { downloadHistory, isLoadingHistory } = useDownloads();
  const [filter, setFilter] = useState("all");

  // Apply filters
  const filteredHistory = downloadHistory.filter(task => {
    if (filter === "completed") return task.status === "completed";
    if (filter === "failed") return task.status === "failed";
    return true;
  });

  // Sort by date (newest first)
  const sortedHistory = [...filteredHistory].sort((a, b) => {
    const dateA = a.completedAt || a.createdAt;
    const dateB = b.completedAt || b.createdAt;
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-[#00A551]" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-destructive" />;
      default:
        return <Clock className="h-5 w-5 text-accent" />;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return format(new Date(dateString), "MMM dd, yyyy • h:mm a");
  };

  const formatFileSize = (size?: number) => {
    if (!size) return "N/A";
    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(2)} KB`;
    } else {
      return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Download History</h1>
        <div className="flex items-center">
          <span className="text-sm text-gray-500 mr-2">Filter:</span>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoadingHistory ? (
          <div className="p-4">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="mb-4 last:mb-0">
                <Skeleton className="h-12 w-full" />
              </div>
            ))}
          </div>
        ) : sortedHistory.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No download history available.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Video Title</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead className="hidden sm:table-cell">Quality</TableHead>
                  <TableHead className="hidden lg:table-cell">File Size</TableHead>
                  <TableHead className="w-28 text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedHistory.map((download) => (
                  <TableRow key={download.id}>
                    <TableCell>
                      {getStatusIcon(download.status)}
                    </TableCell>
                    <TableCell className="font-medium truncate max-w-xs">
                      {download.title}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        {formatDate(download.completedAt || download.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {download.quality || "Default"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex items-center">
                        <Download className="h-4 w-4 mr-2 text-gray-400" />
                        {formatFileSize(download.fileSize)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span 
                        className={`px-2 py-1 rounded-full text-xs font-semibold 
                          ${download.status === 'completed' ? 'bg-green-100 text-green-800' : 
                            download.status === 'failed' ? 'bg-red-100 text-red-800' : 
                            'bg-blue-100 text-blue-800'}`}
                      >
                        {download.status.charAt(0).toUpperCase() + download.status.slice(1)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
