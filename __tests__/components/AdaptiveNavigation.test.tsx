import React, { useState } from 'react';
import { Pressable, Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { AdaptiveNavigation } from '../../components/AdaptiveNavigation';
import { useWeatherPane } from '../../contexts/WeatherPaneContext';

let mockWidth = 390;
jest.mock('../../hooks/useAdaptiveLayout', () => ({
  ...jest.requireActual('../../hooks/useAdaptiveLayout'),
  useAdaptiveLayout: () =>
    jest
      .requireActual('../../hooks/useAdaptiveLayout')
      .adaptiveLayout(mockWidth, 800),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 24, left: 0, right: 0 }),
}));
jest.mock('../../contexts/WeatherContext', () => ({
  useWeather: () => ({
    theme: require('../../utils/weatherTheme').defaultTheme,
  }),
}));
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: require('react-native').View,
}));
function Probe({ name }: { name: string }) {
  const [count, setCount] = useState(0);
  const pane = useWeatherPane();
  return (
    <Pressable accessibilityRole="button" onPress={() => setCount(count + 1)}>
      <Text>{`${name} state ${count} ${pane}`}</Text>
    </Pressable>
  );
}
const names = [
  'index',
  'forecast',
  'charts',
  'sky',
  'map',
  'settings',
  'air-quality',
];
const routes = names.map((name) => ({ name, key: name, href: undefined }));
const descriptors = Object.fromEntries(
  names.map((name) => [
    name,
    { options: {}, render: () => <Probe name={name} /> },
  ]),
);
const actions = { navigate: jest.fn(), back: jest.fn() };
function Shell({ active }: { active: string }) {
  return (
    <AdaptiveNavigation
      state={{ routes, index: names.indexOf(active) }}
      descriptors={descriptors}
      actions={actions}
      emitter={{
        emit: () => {
          throw new Error('No navigation events expected');
        },
      }}
    />
  );
}
beforeEach(() => {
  mockWidth = 390;
  jest.clearAllMocks();
});
it('keeps the logical forecast/AQI destination and same Weather scene when folded', () => {
  const view = render(<Shell active="forecast" />);
  fireEvent.press(screen.getByText('index state 0 forecast'));
  const node = screen.getByTestId('scene-index');
  expect(screen.getAllByRole('tab')).toHaveLength(5);
  mockWidth = 840;
  view.rerender(<Shell active="forecast" />);
  expect(screen.getByText('index state 1 forecast')).toBeTruthy();
  expect(screen.getByTestId('scene-index')).toBe(node);
  expect(
    screen.getByRole('tab', { name: 'Weather' }).props.accessibilityState
      .selected,
  ).toBe(true);
  expect(screen.queryByRole('tab', { name: 'Forecast' })).toBeNull();
  view.rerender(<Shell active="air-quality" />);
  mockWidth = 390;
  view.rerender(<Shell active="air-quality" />);
  expect(screen.getByText('index state 1 air-quality')).toBeTruthy();
});
it('preserves mounted map/chart state across resizes and highlights rail Settings', () => {
  const view = render(<Shell active="map" />);
  fireEvent.press(screen.getByText('map state 0 current'));
  const map = screen.getByTestId('scene-map');
  [600, 720, 1024, 320].forEach((width) => {
    mockWidth = width;
    view.rerender(<Shell active="map" />);
    expect(screen.getByTestId('scene-map')).toBe(map);
  });
  view.rerender(<Shell active="charts" />);
  fireEvent.press(screen.getByText('charts state 0 current'));
  view.rerender(<Shell active="map" />);
  expect(screen.getByText('map state 1 current')).toBeTruthy();
  view.rerender(<Shell active="charts" />);
  expect(screen.getByText('charts state 1 current')).toBeTruthy();
  mockWidth = 840;
  view.rerender(<Shell active="settings" />);
  expect(
    screen.getByRole('tab', { name: 'Settings' }).props.accessibilityState
      .selected,
  ).toBe(true);
  fireEvent.press(screen.getByRole('tab', { name: 'Sky' }));
  expect(actions.navigate).toHaveBeenCalledWith('sky');
});
