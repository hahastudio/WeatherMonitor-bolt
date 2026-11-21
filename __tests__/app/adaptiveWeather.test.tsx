import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import WeatherWorkspace from '../../app/(tabs)/index';
import {
  WeatherPaneContext,
  type WeatherPane,
} from '../../contexts/WeatherPaneContext';
import { mockWeatherContext, mockCurrentWeather } from '../mocks';
import { adaptiveForecast } from '../fixtures/adaptiveWeather';
let mockWidth = 390;
let mockContext = { ...mockWeatherContext, forecast: adaptiveForecast };
jest.mock('../../contexts/WeatherContext', () => ({
  useWeather: () => mockContext,
}));
jest.mock('../../hooks/useAdaptiveLayout', () => ({
  useAdaptiveLayout: () =>
    jest
      .requireActual('../../hooks/useAdaptiveLayout')
      .adaptiveLayout(mockWidth, 800),
}));
jest.mock('../../components/ScrollingScreen', () => {
  const { View } = require('react-native');
  return {
    ScrollingScreen: ({
      children,
      headerTrailing,
    }: {
      children:
        | React.ReactNode
        | ((refreshControl?: React.ReactNode) => React.ReactNode);
      headerTrailing?: React.ReactNode;
    }) => (
      <View>
        {headerTrailing}
        {typeof children === 'function' ? children() : children}
      </View>
    ),
  };
});
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: require('react-native').View,
}));
const mockNavigate = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ navigate: mockNavigate }),
}));
function Workspace({ pane }: { pane: WeatherPane }) {
  return (
    <WeatherPaneContext.Provider value={pane}>
      <WeatherWorkspace />
    </WeatherPaneContext.Provider>
  );
}
beforeEach(() => {
  mockWidth = 390;
  mockContext = { ...mockWeatherContext, forecast: adaptiveForecast };
  jest.clearAllMocks();
});
it('retains 48 hourly entries, seven expanded daily rows, zero values and the same strip while folding', () => {
  mockContext.error = 'Weather provider request failed';
  const view = render(<Workspace pane="forecast" />);
  const hour = screen.getAllByTestId('forecast-hour')[0];
  expect(screen.getAllByTestId('forecast-hour')).toHaveLength(48);
  expect(screen.getAllByTestId('forecast-day')).toHaveLength(7);
  expect(screen.getAllByTestId('forecast-temperature-track')).toHaveLength(7);
  expect(screen.getAllByText('0.0 km/h')).toHaveLength(48);
  expect(screen.queryByText(mockContext.error)).toBeNull();
  [600, 720, 840, 1024, 320].forEach((width) => {
    mockWidth = width;
    view.rerender(<Workspace pane="forecast" />);
    expect(screen.getAllByTestId('forecast-hour')[0]).toBe(hour);
    expect(screen.getAllByTestId('forecast-hour')).toHaveLength(48);
  });
  expect(mockContext.refreshWeather).not.toHaveBeenCalled();
});
it('keeps mixed precipitation, zero AQI, all six measurements and the AQI action', () => {
  mockContext = {
    ...mockContext,
    currentWeather: {
      ...mockCurrentWeather,
      rain: { '1h': 1 },
      snow: { '1h': 2 },
    },
    weatherAirQuality: {
      aqi: { usa: 0, chn: 0 },
      pm25: 0,
      pm10: 0,
      o3: 0,
      so2: 0,
      no2: 0,
      co: 0,
    },
  };
  render(<Workspace pane="current" />);
  expect(screen.getByText('Rain/Snow (1h)')).toBeTruthy();
  expect(screen.getByText('3.0 mm')).toBeTruthy();
  ['Wind', 'Air Quality', 'Visibility', 'Humidity', 'Pressure'].forEach(
    (label) => expect(screen.getByText(label)).toBeTruthy(),
  );
  fireEvent.press(
    screen.getByRole('button', { name: 'Air Quality, AQI 0.0, show details' }),
  );
  expect(mockNavigate).toHaveBeenCalledWith('/air-quality');
});

it('uses only the pane selector to open air quality with a rail, restoring the detail action on phones', () => {
  mockWidth = 840;
  const view = render(<Workspace pane="current" />);
  expect(
    screen.queryByRole('button', { name: /Air Quality.*show details/ }),
  ).toBeNull();
  fireEvent.press(screen.getByRole('tab', { name: 'Air quality' }));
  expect(mockNavigate).toHaveBeenCalledWith('/air-quality');
  mockWidth = 390;
  view.rerender(<Workspace pane="current" />);
  expect(
    screen.getByRole('button', { name: /Air Quality.*show details/ }),
  ).toBeTruthy();
});

it('allocates equal measured widths to both unfolded panes after a phone resize', () => {
  const view = render(<Workspace pane="current" />);
  mockWidth = 840;
  view.rerender(<Workspace pane="current" />);
  fireEvent(screen.getByTestId('weather-workspace'), 'layout', {
    nativeEvent: { layout: { x: 16, y: 80, width: 732, height: 600 } },
  });
  expect(screen.getByTestId('current-pane-frame')).toHaveStyle({ width: 360 });
  expect(screen.getByTestId('weather-detail-column')).toHaveStyle({
    width: 360,
  });
  expect(screen.getAllByTestId('forecast-day')).toHaveLength(7);
  expect(mockContext.refreshWeather).not.toHaveBeenCalled();
});
