import React from 'react';
import { BackHandler } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import SettingsScreen from '../../app/(tabs)/settings';
import { mockWeatherContext } from '../mocks';

let mockWidth = 390;
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => void | (() => void)) =>
    require('react').useEffect(callback, [callback]),
  useRouter: () => ({ canGoBack: () => true, back: mockBack }),
}));
jest.mock('../../hooks/useAdaptiveLayout', () => ({
  useAdaptiveLayout: () =>
    jest
      .requireActual('../../hooks/useAdaptiveLayout')
      .adaptiveLayout(mockWidth, 800),
}));
jest.mock('../../contexts/WeatherContext', () => ({
  useWeather: () => mockWeatherContext,
}));
jest.mock('../../components/ScrollingScreen', () => {
  const { View, Text, Pressable } = require('react-native');
  return {
    ScrollingScreen: ({
      children,
      title,
      onBack,
    }: React.PropsWithChildren<{ title: string; onBack?: () => void }>) => (
      <View>
        <Text accessibilityRole="header">{title}</Text>
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

beforeEach(() => {
  mockWidth = 390;
  mockWeatherContext.followSystemTheme = true;
  jest.clearAllMocks();
});

it('shows system theme enabled and disables manual dark mode while following the system', async () => {
  render(<SettingsScreen />);
  await act(async () => {});
  fireEvent.press(screen.getByRole('button', { name: 'Appearance' }));

  const systemSwitch = screen.getByRole('switch', {
    name: 'Follow system theme',
  });
  expect(systemSwitch).toHaveProp('value', true);
  expect(screen.getByRole('switch', { name: 'Dark mode' })).toBeDisabled();

  fireEvent(systemSwitch, 'valueChange', false);
  expect(mockWeatherContext.setFollowSystemTheme).toHaveBeenCalledWith(false);
});

it('allows manual dark mode when following the system is turned off', async () => {
  mockWeatherContext.followSystemTheme = false;
  render(<SettingsScreen />);
  await act(async () => {});
  fireEvent.press(screen.getByRole('button', { name: 'Appearance' }));

  const darkSwitch = screen.getByRole('switch', { name: 'Dark mode' });
  expect(darkSwitch).toBeEnabled();
  fireEvent(darkSwitch, 'valueChange', true);
  expect(mockWeatherContext.toggleDarkMode).toHaveBeenCalledTimes(1);
});

it('opens phone categories from a vertical menu and returns to the menu before leaving Settings', async () => {
  render(<SettingsScreen />);
  await act(async () => {});
  expect(screen.queryAllByRole('tab')).toHaveLength(0);
  expect(screen.getByTestId('settings-menu')).toBeTruthy();
  expect(screen.queryByRole('switch', { name: 'Dark mode' })).toBeNull();
  fireEvent.press(screen.getByRole('button', { name: 'Appearance' }));
  expect(screen.getByRole('switch', { name: 'Dark mode' })).toBeTruthy();
  expect(screen.queryByTestId('settings-menu')).toBeNull();
  fireEvent.press(screen.getByRole('button', { name: 'Go back' }));
  expect(screen.getByTestId('settings-menu')).toBeTruthy();
  expect(mockBack).not.toHaveBeenCalled();
  fireEvent.press(screen.getByRole('button', { name: 'Go back' }));
  expect(mockBack).toHaveBeenCalledTimes(1);
});

it('keeps the chosen category through fold/unfold and handles Android Back within Settings', async () => {
  const listener = jest.spyOn(BackHandler, 'addEventListener');
  const view = render(<SettingsScreen />);
  await act(async () => {});
  fireEvent.press(screen.getByRole('button', { name: 'Weather services' }));
  expect(screen.getByText('Configure API Keys')).toBeTruthy();
  mockWidth = 840;
  view.rerender(<SettingsScreen />);
  expect(screen.getByTestId('settings-menu')).toBeTruthy();
  expect(screen.getByText('Configure API Keys')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Go back' })).toBeNull();
  mockWidth = 390;
  view.rerender(<SettingsScreen />);
  expect(screen.queryByTestId('settings-menu')).toBeNull();
  expect(screen.getByText('Configure API Keys')).toBeTruthy();
  const handleBack = listener.mock.calls.at(-1)![1];
  act(() => {
    expect(handleBack({ type: 'hardwareBackPress', timeStamp: 0 })).toBe(true);
  });
  expect(screen.getByTestId('settings-menu')).toBeTruthy();
  expect(mockBack).not.toHaveBeenCalled();
  listener.mockRestore();
});
