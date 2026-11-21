import React from 'react';
import { BackHandler, ScrollView, Text, View } from 'react-native';
import {
  act,
  fireEvent,
  renderRouter,
  screen,
  testRouter,
} from 'expo-router/testing-library';
import TabLayout from '../../app/(tabs)/_layout';
import SettingsScreen from '../../app/(tabs)/settings';
import { SettingsButton } from '../../components/SettingsButton';
import { useWeatherPane } from '../../contexts/WeatherPaneContext';
import { mockWeatherContext } from '../mocks';

let mockWidth = 390;
let mockFontScale = 1;
jest.mock('../../hooks/useAdaptiveLayout', () => ({
  ...jest.requireActual('../../hooks/useAdaptiveLayout'),
  useAdaptiveLayout: () =>
    jest
      .requireActual('../../hooks/useAdaptiveLayout')
      .adaptiveLayout(mockWidth, 800, mockFontScale),
}));
jest.mock('../../contexts/WeatherContext', () => ({
  useWeather: () => mockWeatherContext,
}));
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: require('react-native').View,
}));
jest.mock('../../components/ScrollingScreen', () => {
  const { Pressable, View } = require('react-native');
  return {
    ScrollingScreen: ({
      children,
      onBack,
    }: React.PropsWithChildren<{ onBack?: () => void }>) => (
      <View>
        {onBack && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={onBack}
          />
        )}
        {children}
      </View>
    ),
  };
});
jest.mock('../../components/ApiKeySettings', () => () => null);
jest.mock('../../components/ApiLogViewer', () => ({
  ApiLogViewer: () => null,
}));
jest.mock('../../services/notificationService', () => ({
  notificationService: {},
}));
jest.mock('../../services/alertTracker', () => ({
  alertTracker: {
    getTrackerStats: jest.fn().mockResolvedValue({
      totalTrackedAlerts: 0,
      oldestAlertAge: null,
      newestAlertAge: null,
    }),
  },
}));

function WeatherScene() {
  const pane = useWeatherPane();
  return (
    <View>
      <Text>{`Weather pane: ${pane}`}</Text>
      <SettingsButton theme={mockWeatherContext.theme} />
    </View>
  );
}

function renderNavigation(initialUrl = '/') {
  return renderRouter(
    {
      '(tabs)/_layout': TabLayout,
      '(tabs)/index': WeatherScene,
      '(tabs)/forecast': () => null,
      '(tabs)/air-quality': () => null,
      '(tabs)/charts': () => <Text>Charts scene</Text>,
      '(tabs)/sky': () => <Text>Sky scene</Text>,
      '(tabs)/map': () => <Text>Map scene</Text>,
      '(tabs)/settings': SettingsScreen,
    },
    { initialUrl },
  );
}

beforeEach(() => {
  mockWidth = 390;
  mockFontScale = 1;
  jest.clearAllMocks();
});
afterEach(() => jest.useRealTimers());

it('keeps enlarged phone tab labels at their intrinsic widths and scrolls to the final destination', () => {
  mockWidth = 320;
  mockFontScale = 1.6;
  const view = renderNavigation();
  expect(screen.UNSAFE_getByType(ScrollView).props.horizontal).toBe(true);
  for (const name of ['Weather', 'Forecast', 'Charts', 'Sky', 'Map']) {
    expect(screen.getByRole('tab', { name })).toHaveStyle({ flexShrink: 0 });
  }
  fireEvent.press(screen.getByRole('tab', { name: 'Map' }));
  expect(view.getPathname()).toBe('/map');
});

it.each([390, 840])(
  'returns to Weather after repeated tab switches at width %s',
  async (width) => {
    mockWidth = width;
    const view = renderNavigation();
    expect(view.getPathname()).toBe('/');
    expect(testRouter.canGoBack()).toBe(false);

    for (const label of ['Charts', 'Sky', 'Map', 'Charts', 'Map', 'Map']) {
      fireEvent.press(screen.getByRole('tab', { name: label }));
      expect(view.getPathname()).toBe(`/${label.toLowerCase()}`);
    }

    testRouter.back('/');
    expect(screen.getByText('Weather pane: current')).toBeTruthy();
    expect(testRouter.canGoBack()).toBe(false);
    await act(async () => {});
  },
);

it('returns to Weather from Forecast and air quality after visiting other tabs', () => {
  renderNavigation();
  fireEvent.press(screen.getByRole('tab', { name: 'Charts' }));
  fireEvent.press(screen.getByRole('tab', { name: 'Forecast' }));
  expect(screen.getByText('Weather pane: forecast')).toBeTruthy();
  testRouter.back('/');
  expect(testRouter.canGoBack()).toBe(false);

  testRouter.navigate('/sky');
  testRouter.navigate('/air-quality');
  expect(screen.getByText('Weather pane: air-quality')).toBeTruthy();
  testRouter.back('/');
  expect(testRouter.canGoBack()).toBe(false);
});

it.each(['/forecast', '/charts', '/sky', '/map', '/air-quality', '/settings'])(
  'keeps Weather below a direct link to %s',
  async (path) => {
    const view = renderNavigation(path);
    expect(view.getPathname()).toBe(path);
    testRouter.back('/');
    expect(testRouter.canGoBack()).toBe(false);
    await act(async () => {});
  },
);

it('returns from a phone Settings detail to its menu, then directly to Weather', async () => {
  const view = renderNavigation();
  testRouter.navigate('/charts');
  testRouter.navigate('/sky');
  testRouter.navigate('/');
  fireEvent.press(screen.getByRole('button', { name: 'Open settings' }));
  expect(view.getPathname()).toBe('/settings');
  fireEvent.press(screen.getByRole('button', { name: 'Appearance' }));
  expect(screen.queryByTestId('settings-menu')).toBeNull();

  fireEvent.press(screen.getByRole('button', { name: 'Go back' }));
  expect(screen.getByTestId('settings-menu')).toBeTruthy();
  expect(view.getPathname()).toBe('/settings');
  fireEvent.press(screen.getByRole('button', { name: 'Go back' }));
  expect(view.getPathname()).toBe('/');
  expect(testRouter.canGoBack()).toBe(false);
  await act(async () => {});
});

it('lets Android Back close a phone Settings detail before the tab handles Back', async () => {
  const listener = jest.spyOn(BackHandler, 'addEventListener');
  const view = renderNavigation('/settings');
  fireEvent.press(screen.getByRole('button', { name: 'Appearance' }));
  const handleBack = listener.mock.calls.at(-1)![1];
  act(() => {
    expect(handleBack({ type: 'hardwareBackPress', timeStamp: 0 })).toBe(true);
  });
  expect(screen.getByTestId('settings-menu')).toBeTruthy();
  expect(view.getPathname()).toBe('/settings');
  testRouter.back('/');
  expect(testRouter.canGoBack()).toBe(false);
  listener.mockRestore();
  await act(async () => {});
});
