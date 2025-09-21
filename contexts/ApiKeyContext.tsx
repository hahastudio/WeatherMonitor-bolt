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
  updateApiKeys: (newKeys: ApiKeys) => Promise<void>;
  getApiKey: (service: keyof ApiKeys) => string | undefined;
}

export const ApiKeyContext = createContext<ApiKeyContextType | undefined>(
  undefined,
);

export const ApiKeyProvider = ({ children }: { children: ReactNode }) => {
  const [apiKeys, setApiKeys] = useState<ApiKeys | null>(null);
  const [areKeysSet, setAreKeysSet] = useState(false);

  useEffect(() => {
    const fetchKeys = async () => {
      const storedKeys = await loadApiKeys();
      if (storedKeys) {
        setApiKeys(storedKeys);
        setGlobalApiKeys(storedKeys); // Set keys for services
        checkIfKeysAreSet(storedKeys);
      }
    };
    fetchKeys();
  }, []);

  const checkIfKeysAreSet = (keys: ApiKeys | null) => {
    if (keys && keys.openWeatherMap && keys.caiyun && keys.gemini) {
      setAreKeysSet(true);
    } else {
      setAreKeysSet(false);
    }
  };

  const updateApiKeys = async (newKeys: ApiKeys) => {
    setApiKeys(newKeys);
    setGlobalApiKeys(newKeys); // Update keys for services
    await saveApiKeys(newKeys);
    checkIfKeysAreSet(newKeys);
  };

  const getApiKey = (service: keyof ApiKeys) => {
    return apiKeys?.[service];
  };

  return (
    <ApiKeyContext.Provider
      value={{ apiKeys, areKeysSet, updateApiKeys, getApiKey }}
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
