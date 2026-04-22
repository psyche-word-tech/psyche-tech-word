import React, { createContext, useContext, useState, ReactNode } from 'react';

const PROD_API_URL = 'https://f2541e68-91d1-4805-97c9-3bf1e0126a01.dev.coze.site';

interface ApiConfigContextType {
  apiBaseUrl: string;
  isConfigLoaded: boolean;
}

const ApiConfigContext = createContext<ApiConfigContextType>({
  apiBaseUrl: PROD_API_URL,
  isConfigLoaded: true,
});

export const useApiConfig = () => useContext(ApiConfigContext);

interface ApiConfigProviderProps {
  children: ReactNode;
}

export const ApiConfigProvider: React.FC<ApiConfigProviderProps> = ({ children }) => {
  const [apiBaseUrl] = useState<string>(PROD_API_URL);
  const [isConfigLoaded] = useState<boolean>(true);

  return (
    <ApiConfigContext.Provider value={{ apiBaseUrl, isConfigLoaded }}>
      {children}
    </ApiConfigContext.Provider>
  );
};
