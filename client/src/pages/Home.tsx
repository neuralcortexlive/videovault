import { useState } from "react";
import SearchBar from "@/components/SearchBar";
import VideoGrid from "@/components/VideoGrid";
import ApiKeyModal from "@/components/ApiKeyModal";
import { useApiConfig } from "@/hooks/useYoutubeSearch";

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const { data: apiConfig } = useApiConfig();
  
  const handleSearch = (query: string) => {
    console.log("Search query:", query);
    setSearchTerm(query);
  };
  
  const openApiKeyModal = () => {
    setIsApiKeyModalOpen(true);
  };
  
  const closeApiKeyModal = () => {
    setIsApiKeyModalOpen(false);
  };
  
  return (
    <>
      <SearchBar 
        onSearch={handleSearch} 
        onOpenApiKeyModal={openApiKeyModal}
        hasApiKey={!!apiConfig?.youtubeApiKey}
      />
      
      <VideoGrid searchTerm={searchTerm} />
      
      <ApiKeyModal 
        isOpen={isApiKeyModalOpen} 
        onClose={closeApiKeyModal} 
        defaultApiKey={apiConfig?.youtubeApiKey || ""}
      />
    </>
  );
}
