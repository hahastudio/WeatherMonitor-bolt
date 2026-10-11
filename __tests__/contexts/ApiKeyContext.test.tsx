import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { ApiKeyProvider, useApiKeys } from '../../contexts/ApiKeyContext';
import { loadApiKeys, saveApiKeys } from '../../utils/weatherStorage';
import { setApiKeys } from '../../services/apiKeyManager';

jest.mock('../../utils/weatherStorage', () => ({
  loadApiKeys: jest.fn(),
  saveApiKeys: jest.fn(),
}));
jest.mock('../../services/apiKeyManager', () => ({ setApiKeys: jest.fn() }));

const storedKeys = {
  openWeatherMap: 'stored-weather',
  caiyun: 'stored-caiyun',
  gemini: 'stored-gemini',
};
const newKeys = { ...storedKeys, gemini: 'new-gemini' };
const wrapper = ({ children }: React.PropsWithChildren) => (
  <ApiKeyProvider>{children}</ApiKeyProvider>
);

describe('ApiKeyProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(loadApiKeys).mockResolvedValue(storedKeys);
    jest.mocked(saveApiKeys).mockResolvedValue(undefined);
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => jest.restoreAllMocks());

  it('distinguishes pending storage from missing keys and restores saved keys', async () => {
    let finishRead!: (keys: typeof storedKeys) => void;
    jest.mocked(loadApiKeys).mockReturnValue(
      new Promise((resolve) => {
        finishRead = resolve;
      }),
    );
    const { result } = renderHook(useApiKeys, { wrapper });
    expect(result.current.isLoading).toBe(true);
    expect(setApiKeys).not.toHaveBeenCalled();
    await act(async () => finishRead(storedKeys));
    expect(result.current.isLoading).toBe(false);
    expect(result.current.areKeysSet).toBe(true);
    expect(result.current.getApiKey('gemini')).toBe(storedKeys.gemini);
    expect(setApiKeys).toHaveBeenCalledWith(storedKeys);
  });

  it('keeps the existing keys active until the storage write succeeds', async () => {
    let finishWrite!: () => void;
    jest.mocked(saveApiKeys).mockReturnValue(
      new Promise((resolve) => {
        finishWrite = resolve;
      }),
    );
    const { result } = renderHook(useApiKeys, { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    let saving!: Promise<void>;
    act(() => {
      saving = result.current.updateApiKeys(newKeys);
    });
    expect(saveApiKeys).toHaveBeenCalledWith(newKeys);
    expect(result.current.apiKeys).toEqual(storedKeys);
    expect(setApiKeys).toHaveBeenLastCalledWith(storedKeys);
    await act(async () => {
      finishWrite();
      await saving;
    });
    expect(result.current.apiKeys).toEqual(newKeys);
    expect(setApiKeys).toHaveBeenLastCalledWith(newKeys);
  });

  it('preserves existing keys and reports a failed storage write', async () => {
    jest
      .mocked(saveApiKeys)
      .mockRejectedValue(new Error('Storage unavailable'));
    const { result } = renderHook(useApiKeys, { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => {
      await expect(result.current.updateApiKeys(newKeys)).rejects.toThrow(
        'Storage unavailable',
      );
    });
    expect(result.current.apiKeys).toEqual(storedKeys);
    expect(result.current.areKeysSet).toBe(true);
    expect(setApiKeys).toHaveBeenLastCalledWith(storedKeys);
  });

  it('finishes loading after a storage read fails so setup remains available', async () => {
    jest
      .mocked(loadApiKeys)
      .mockRejectedValue(new Error('Storage unavailable'));
    const { result } = renderHook(useApiKeys, { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.areKeysSet).toBe(false);
    expect(result.current.apiKeys).toBeNull();
  });
});
