import { jest } from '@jest/globals';

// Mock Expo's fetch implementation
jest.mock('expo/fetch', () => ({
  fetch: global.fetch,
}));

// Mock Expo's Asset system
jest.mock('expo-asset', () => ({
  Asset: {
    fromModule: jest.fn(() => ({
      downloadAsync: jest.fn(),
      uri: 'test-uri',
    })),
  },
}));

// Mock apiLogger
jest.mock('../services/apiLogger', () => ({
  apiLogger: {
    logRequest: jest.fn(),
  },
}));
