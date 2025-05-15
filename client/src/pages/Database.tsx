import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Database as DatabaseIcon, 
  Table as TableIcon,
  Trash2, 
  AlertTriangle,
  Search,
  RefreshCw,
  FileText,
  Settings,
  ChevronDown,
  ChevronRight
} from "lucide-react";

interface DatabaseStats {
  totalVideos: number;
  totalDownloads: number;
  totalCollections: number;
  totalBatchDownloads: number;
  totalVideoCollections: number;
  totalQualityPresets: number;
  totalBatchDownloadItems: number;
  totalApiConfigs: number;
}

type TableType = 
  | "videos" 
  | "downloads" 
  | "collections" 
  | "batchDownloads"
  | "videoCollections"
  | "qualityPresets"
  | "batchDownloadItems"
  | "apiConfigs";

interface TableData {
  id: number;
  [key: string]: any;
}

export default function Database() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<TableType | null>(null);
  const [activeTab, setActiveTab] = useState<TableType>("videos");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set(["videos"]));

  const { data: stats, isLoading: isLoadingStats } = useQuery<DatabaseStats>({
    queryKey: ["database-stats"],
    queryFn: async () => {
      const response = await fetch("/api/database/stats");
      if (!response.ok) throw new Error("Failed to fetch database stats");
      return response.json();
    },
  });

  const { data: tableData, isLoading: isLoadingTable } = useQuery<TableData[]>({
    queryKey: ["table-data", activeTab],
    queryFn: async () => {
      const response = await fetch(`/api/database/table/${activeTab}`);
      if (!response.ok) throw new Error(`Failed to fetch ${activeTab} data`);
      return response.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (type: string) => {
      const response = await fetch(`/api/database/clear/${type}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error(`Failed to clear ${type}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["database-stats"] });
      queryClient.invalidateQueries({ queryKey: ["table-data", activeTab] });
      toast({
        title: "Sucesso",
        description: `Dados de ${selectedAction} foram apagados com sucesso.`,
      });
      setIsConfirmDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Falha ao apagar dados: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleDelete = (type: TableType) => {
    setSelectedAction(type);
    setIsConfirmDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedAction) {
      deleteMutation.mutate(selectedAction);
    }
  };

  const getActionTitle = (type: string) => {
    switch (type) {
      case "videos":
        return "Vídeos";
      case "downloads":
        return "Downloads";
      case "collections":
        return "Coleções";
      case "batchDownloads":
        return "Downloads em Lote";
      case "videoCollections":
        return "Vídeos em Coleções";
      case "qualityPresets":
        return "Presets de Qualidade";
      case "batchDownloadItems":
        return "Itens de Download em Lote";
      case "apiConfigs":
        return "Configurações da API";
      default:
        return type;
    }
  };

  const toggleTable = (table: string) => {
    const newExpanded = new Set(expandedTables);
    if (newExpanded.has(table)) {
      newExpanded.delete(table);
    } else {
      newExpanded.add(table);
    }
    setExpandedTables(newExpanded);
  };

  const filteredData = tableData?.filter(item => {
    if (!searchQuery) return true;
    return Object.values(item).some(value => 
      String(value).toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  if (isLoadingStats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-4 mb-8">
        <DatabaseIcon className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Gerenciamento do Banco de Dados</h1>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar com lista de tabelas */}
        <div className="col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tabelas</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-2">
                  {Object.entries(stats || {}).map(([key, value]) => {
                    const tableName = key.replace("total", "").toLowerCase();
                    return (
                      <div key={tableName} className="space-y-1">
                        <button
                          onClick={() => toggleTable(tableName)}
                          className="flex items-center justify-between w-full p-2 hover:bg-accent rounded-md"
                        >
                          <div className="flex items-center gap-2">
                            <TableIcon className="h-4 w-4" />
                            <span>{getActionTitle(tableName)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">{value}</span>
                            {expandedTables.has(tableName) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </div>
                        </button>
                        {expandedTables.has(tableName) && (
                          <div className="pl-6 space-y-1">
                            <button
                              onClick={() => setActiveTab(tableName as TableType)}
                              className="flex items-center gap-2 p-2 hover:bg-accent rounded-md w-full text-left"
                            >
                              <FileText className="h-4 w-4" />
                              <span>Visualizar Dados</span>
                            </button>
                            <button
                              onClick={() => handleDelete(tableName as TableType)}
                              className="flex items-center gap-2 p-2 hover:bg-accent rounded-md w-full text-left text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span>Apagar Tabela</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Área principal com dados da tabela */}
        <div className="col-span-9">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle>{getActionTitle(activeTab)}</CardTitle>
                  <CardDescription>
                    Visualizando dados da tabela {getActionTitle(activeTab).toLowerCase()}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => queryClient.invalidateQueries({ queryKey: ["table-data", activeTab] })}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                {isLoadingTable ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : filteredData && filteredData.length > 0 ? (
                  <div className="rounded-md border">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          {Object.keys(filteredData[0]).map((key) => (
                            <th key={key} className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredData.map((row, i) => (
                          <tr key={i} className="border-b">
                            {Object.values(row).map((value, j) => (
                              <td key={j} className="p-4 align-middle">
                                {String(value)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Nenhum dado encontrado
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirmar Exclusão
            </DialogTitle>
            <DialogDescription>
              Você está prestes a apagar todos os {selectedAction && getActionTitle(selectedAction).toLowerCase()}. Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConfirmDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Apagando..." : "Confirmar Exclusão"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 