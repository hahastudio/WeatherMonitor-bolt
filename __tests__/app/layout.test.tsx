import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react-native';
import RootLayout from '../../app/_layout';
import { loadApiKeys } from '../../utils/weatherStorage';
import type { ApiKeys } from '../../types/weather';

let mockRootRoute = 'welcome';
let mockPathname = '/welcome';
const mockReplace = jest.fn();
const mockRouter = { replace: mockReplace };

jest.mock('expo-router', () => {
  const { Text } = require('react-native');
  return {
    Stack: Object.assign(() => <Text>Navigation ready</Text>, {
      Screen: () => null,
    }),
    useRouter: () => mockRouter,
    usePathname: () => mockPathname,
    useRootNavigationState: () => ({
      key: 'root',
      index: 0,
      routes: [{ name: mockRootRoute }],
    }),
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
  beforeEach(() => {
    mockRootRoute = 'welcome';
    mockPathname = '/welcome';
    jest.clearAllMocks();
  });

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

it('preserves an incoming app deep link after loading saved credentials', async () => {
  jest.clearAllMocks();
  mockRootRoute = '(tabs)';
  mockPathname = '/charts';
  jest.mocked(loadApiKeys).mockResolvedValue({
    openWeatherMap: 'synthetic-weather',
    caiyun: 'synthetic-caiyun',
    gemini: 'synthetic-gemini',
  });
  render(<RootLayout />);
  await waitFor(() =>
    expect(screen.getByText('Navigation ready')).toBeTruthy(),
  );
  expect(mockReplace).not.toHaveBeenCalled();
});

it('keeps onboarding settings reachable before credentials are configured', async () => {
  jest.clearAllMocks();
  mockRootRoute = 'welcome';
  mockPathname = '/welcome';
  jest.mocked(loadApiKeys).mockResolvedValue(null);
  const { rerender } = render(<RootLayout />);
  await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/welcome'));
  mockReplace.mockClear();

  mockRootRoute = '(tabs)';
  mockPathname = '/settings';
  rerender(<RootLayout />);
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 5));
  });

  expect(screen.getByText('Navigation ready')).toBeTruthy();
  expect(mockReplace).not.toHaveBeenCalled();
});
