import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fetchApiConfig } from '@/utils/apiConfig';

interface ApiConfigContextType {
  apiBaseUrl: string;
  isConfigLoaded: boolean;
}

const ApiConfigContext = createContext<ApiConfigContextType>({
  apiBaseUrl: 'http://localhost:9091',
  isConfigLoaded: false,
});

export const useApiConfig = () => useContext(ApiConfigContext);

interface ApiConfigProviderProps {
  children: ReactNode;
}

export const ApiConfigProvider: React.FC<ApiConfigProviderProps> = ({ children }) => {
  const [apiBaseUrl, setApiBaseUrl] = useState<string>('http://localhost:9091');
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);

  useEffect(() => {
    const initApiConfig = async () => {
      try {
        const url = await fetchApiConfig();
        setApiBaseUrl(url);
        console.log('[API Config] Initialized with:', url);
      } catch (error) {
        console.error('[API Config] Failed to initialize:', error);
      } finally {
        setIsConfigLoaded(true);
      }
    };

    initApiConfig();
  }, []);

  return (
    <ApiConfigContext.Provider value={{ apiBaseUrl, isConfigLoaded }}>
      {children}
    </ApiConfigContext.Provider>
  );
};
