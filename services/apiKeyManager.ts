import { ApiKeys } from '../types/weather';

let apiKeys: ApiKeys | null = null;

export const setApiKeys = (keys: ApiKeys) => {
  apiKeys = keys;
};

export const getApiKey = (service: keyof ApiKeys) => {
  if (!apiKeys) {
    console.warn('API keys are not set yet.');
    return undefined;
  }
  return apiKeys[service];
};
