import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react-native';
import RootLayout from '../../app/_layout';
import { loadApiKeys } from '../../utils/weatherStorage';
import type { ApiKeys } from '../../types/weather';

const mockReplace = jest.fn();
const mockRouter = { replace: mockReplace };

jest.mock('expo-router', () => {
  const { Text } = require('react-native');
  return {
    Stack: Object.assign(() => <Text>Navigation ready</Text>, {
      Screen: () => null,
    }),
    useRouter: () => mockRouter,
    useRootNavigationState: () => ({ key: 'root' }),
  };
});
jest.mock('../../contexts/WeatherContext', () => ({
  WeatherProvider: ({ children }: React.PropsWithChildren) => children,
  useWeather: () => ({
    theme: require('../../utils/weatherTheme').defaultTheme,
  }),
}));
jest.mock('../../hooks/useFrameworkReady', () => ({
  useFrameworkReady: jest.fn(),
}));
jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));
jest.mock('../../utils/weatherStorage', () => ({ loadApiKeys: jest.fn() }));
jest.mock('../../services/apiKeyManager', () => ({ setApiKeys: jest.fn() }));

describe('Root layout startup', () => {
  beforeEach(() => jest.clearAllMocks());

  it.each([
    {
      keys: {
        openWeatherMap: 'saved-weather',
        caiyun: 'saved-caiyun',
        gemini: 'saved-gemini',
      },
      route: '/(tabs)',
    },
    { keys: null, route: '/welcome' },
  ])(
    'waits for stored keys before navigating to $route',
    async ({ keys, route }) => {
      let finishRead!: (keys: ApiKeys | null) => void;
      jest.mocked(loadApiKeys).mockReturnValue(
        new Promise((resolve) => {
          finishRead = resolve;
        }),
      );
      render(<RootLayout />);
      expect(screen.queryByText('Navigation ready')).toBeNull();
      expect(mockReplace).not.toHaveBeenCalled();
      await act(async () => finishRead(keys));
      await waitFor(() => expect(mockReplace).toHaveBeenCalledWith(route));
      expect(mockReplace).toHaveBeenCalledTimes(1);
      expect(screen.getByText('Navigation ready')).toBeTruthy();
    },
  );
});
