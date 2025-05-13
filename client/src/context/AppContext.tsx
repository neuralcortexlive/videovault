import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';

interface ApiConfig {
  youtubeApiKey: string;
}

interface AppContextType {
  isApiKeyModalOpen: boolean;
  setIsApiKeyModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  apiConfig: ApiConfig | undefined;
  isApiKeyConfigured: boolean;
}

export const AppContext = createContext<AppContextType>({
  isApiKeyModalOpen: false,
  setIsApiKeyModalOpen: () => {},
  apiConfig: undefined,
  isApiKeyConfigured: false,
});

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  
  // Fetch API configuration from the server
  const { data: apiConfig } = useQuery<ApiConfig>({
    queryKey: ['/api/config'],
  });
  
  const isApiKeyConfigured = !!apiConfig?.youtubeApiKey;
  
  // Show API key modal on first visit if not configured
  useEffect(() => {
    const hasVisited = localStorage.getItem('hasVisited');
    
    if (!hasVisited && apiConfig !== undefined && !isApiKeyConfigured) {
      setIsApiKeyModalOpen(true);
      localStorage.setItem('hasVisited', 'true');
    }
  }, [apiConfig, isApiKeyConfigured]);
  
  return (
    <AppContext.Provider
      value={{
        isApiKeyModalOpen,
        setIsApiKeyModalOpen,
        apiConfig,
        isApiKeyConfigured,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
