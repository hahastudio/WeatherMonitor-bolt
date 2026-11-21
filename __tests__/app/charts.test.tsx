import React from 'react';
import { RefreshControl } from 'react-native';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react-native';
import ChartsScreen from '../../app/(tabs)/charts';
import { mockWeatherContext } from '../mocks';
import { adaptiveForecast as mockForecast } from '../fixtures/adaptiveWeather';

const mockRefresh = jest.fn().mockResolvedValue(undefined);
let mockContext: typeof mockWeatherContext;
jest.mock('../../contexts/WeatherContext', () => ({
  useWeather: () => mockContext,
}));
jest.mock('../../hooks/useAdaptiveLayout', () => ({
  useAdaptiveLayout: () => ({
    rail: false,
    columns: false,
    contentWidth: 390,
    navigationHeight: 64,
  }),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 47, bottom: 34, left: 0, right: 0 }),
}));
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: require('react-native').View,
}));

beforeEach(() => {
  mockContext = {
    ...mockWeatherContext,
    forecast: mockForecast,
    refreshWeather: mockRefresh,
  };
});

it('locks scrolling and refresh throughout chart inspection and restores them after release or cancellation', async () => {
  render(<ChartsScreen />);
  const panels = screen.getAllByTestId('weather-chart-panel');
  expect(within(panels[1]).getByText('Precipitation')).toBeTruthy();
  expect(
    within(panels[1]).queryAllByTestId('chart-extrema-marker'),
  ).toHaveLength(0);
  expect(within(panels[0]).getAllByTestId('chart-extrema-marker')).toHaveLength(
    2,
  );
  const chart = within(panels[0]).getByRole('adjustable');
  ['responderRelease', 'responderTerminate'].forEach((endEvent) => {
    fireEvent(chart, 'responderGrant', { nativeEvent: { locationX: 100 } });
    expect(screen.getByTestId('screen-scroll').props.scrollEnabled).toBe(false);
    expect(screen.UNSAFE_getByType(RefreshControl).props.enabled).toBe(false);
    expect(
      screen.UNSAFE_getByType(RefreshControl).props.onRefresh,
    ).toBeUndefined();
    fireEvent(chart, 'responderMove', {
      nativeEvent: { locationX: 200, locationY: 160 },
    });
    expect(screen.getByTestId('screen-scroll').props.scrollEnabled).toBe(false);
    expect(mockRefresh).not.toHaveBeenCalled();
    fireEvent(chart, endEvent);
    expect(screen.getByTestId('screen-scroll').props.scrollEnabled).toBe(true);
    expect(screen.UNSAFE_getByType(RefreshControl).props.enabled).toBe(true);
  });
  fireEvent(screen.UNSAFE_getByType(RefreshControl), 'refresh');
  await waitFor(() =>
    expect(screen.UNSAFE_getByType(RefreshControl).props.refreshing).toBe(
      false,
    ),
  );
  expect(mockRefresh).toHaveBeenCalledTimes(1);
});

it('keeps the shared heading and hides request errors with or without cached data', () => {
  mockContext.error = 'Weather provider request failed';
  const view = render(<ChartsScreen />);
  expect(screen.getByRole('header', { name: 'Weather Charts' })).toBeTruthy();
  expect(screen.queryByText('Next 48 Hours Forecast')).toBeNull();
  expect(screen.getAllByTestId('weather-chart-panel')).toHaveLength(6);
  expect(screen.queryByRole('alert')).toBeNull();

  mockContext.forecast = null;
  view.rerender(<ChartsScreen />);
  expect(screen.getByRole('header', { name: 'Weather Charts' })).toBeTruthy();
  expect(screen.getByText('No forecast available')).toBeTruthy();
  expect(screen.queryByRole('alert')).toBeNull();
  expect(screen.UNSAFE_getByType(RefreshControl).props.enabled).toBe(true);
});
