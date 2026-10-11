import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { loadApiKeys, saveApiKeys } from '../utils/weatherStorage';
import { ApiKeys } from '../types/weather';
import { setApiKeys as setGlobalApiKeys } from '../services/apiKeyManager';

interface ApiKeyContextType {
  apiKeys: ApiKeys | null;
  areKeysSet: boolean;
  isLoading: boolean;
  updateApiKeys: (newKeys: ApiKeys) => Promise<void>;
  getApiKey: (service: keyof ApiKeys) => string | undefined;
}

export const ApiKeyContext = createContext<ApiKeyContextType | undefined>(
  undefined,
);

export const ApiKeyProvider = ({ children }: { children: ReactNode }) => {
  const [apiKeys, setApiKeys] = useState<ApiKeys | null>(null);
  const [areKeysSet, setAreKeysSet] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchKeys = async () => {
      try {
        const storedKeys = await loadApiKeys();
        if (!active) return;
        if (storedKeys) {
          setApiKeys(storedKeys);
          setGlobalApiKeys(storedKeys);
          checkIfKeysAreSet(storedKeys);
        }
      } catch (error) {
        console.error('Failed to load API keys:', error);
      } finally {
        if (active) setIsLoading(false);
      }
    };
    fetchKeys();
    return () => {
      active = false;
    };
  }, []);

  const checkIfKeysAreSet = (keys: ApiKeys | null) => {
    if (keys && keys.openWeatherMap && keys.caiyun && keys.gemini) {
      setAreKeysSet(true);
    } else {
      setAreKeysSet(false);
    }
  };

  const updateApiKeys = async (newKeys: ApiKeys) => {
    try {
      await saveApiKeys(newKeys);
      setApiKeys(newKeys);
      setGlobalApiKeys(newKeys);
      checkIfKeysAreSet(newKeys);
    } catch (error) {
      console.error('Failed to save API keys:', error);
      throw error;
    }
  };

  const getApiKey = (service: keyof ApiKeys) => {
    return apiKeys?.[service];
  };

  return (
    <ApiKeyContext.Provider
      value={{ apiKeys, areKeysSet, isLoading, updateApiKeys, getApiKey }}
    >
      {children}
    </ApiKeyContext.Provider>
  );
};

export const useApiKeys = () => {
  const context = useContext(ApiKeyContext);
  if (context === undefined) {
    throw new Error('useApiKeys must be used within an ApiKeyProvider');
  }
  return context;
};
