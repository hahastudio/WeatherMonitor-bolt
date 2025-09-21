import '@testing-library/jest-native/extend-expect';
import fetchMock from 'jest-fetch-mock';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Mock react-native-background-fetch
jest.mock('react-native-background-fetch', () => {
  return {
    configure: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    finish: jest.fn(),
    status: jest.fn(),
  };
});

// Mock expo-location
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted' }),
  ),
  getCurrentPositionAsync: jest.fn(() =>
    Promise.resolve({ coords: { latitude: 37.7749, longitude: -122.4194 } }),
  ),
}));

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
}));

// Initialize fetch mock
fetchMock.enableMocks();
(global as any).fetch = fetchMock;

(global as any).__ExpoImportMetaRegistry = {};
