import '@testing-library/jest-native/extend-expect';
import fetchMock from 'jest-fetch-mock';

// Initialize fetch mock
fetchMock.enableMocks();
(global as any).fetch = fetchMock;

process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY = 'test-api-key';
(global as any).__ExpoImportMetaRegistry = {};
