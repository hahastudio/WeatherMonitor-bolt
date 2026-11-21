import React from 'react';
import { Linking } from 'react-native';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import MapScreen from '../../app/(tabs)/map';
import { mockWeatherContext } from '../mocks';
let mockWidth = 390;
jest.mock('../../hooks/useAdaptiveLayout', () => ({
  useAdaptiveLayout: () =>
    jest
      .requireActual('../../hooks/useAdaptiveLayout')
      .adaptiveLayout(mockWidth, 800),
}));
jest.mock('../../contexts/WeatherContext', () => ({
  useWeather: () => require('../mocks').mockWeatherContext,
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 20, bottom: 24, left: 0, right: 0 }),
}));
jest.mock('react-native-webview', () => ({
  WebView: require('react').forwardRef((props: object, ref: any) => (
    <MockWebView {...props} ref={ref} />
  )),
}));
const MockWebView = React.forwardRef(function MockWebView(
  props: object,
  ref: React.Ref<any>,
) {
  const { View } = require('react-native');
  return <View {...props} ref={ref} testID="windy-webview" />;
});
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: require('react-native').View,
}));
beforeEach(() => {
  mockWidth = 390;
  jest.useFakeTimers();
  jest.clearAllMocks();
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});
it('keeps the same Windy instance, selected layer and URL across folds, and opens that layer/location', async () => {
  jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
  const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
  const view = render(<MapScreen />);
  expect(screen.getAllByRole('button')).toHaveLength(7);
  fireEvent.press(screen.getByText('Rain'));
  const map = screen.getByTestId('windy-webview');
  const source = map.props.source;
  expect(source.uri).toContain('overlay=rain');
  expect(source.uri).toContain('lat=37.77');
  expect(source.uri).toContain('lon=-122.42');
  [600, 720, 1024, 390].forEach((width) => {
    mockWidth = width;
    view.rerender(<MapScreen />);
    expect(screen.getByTestId('windy-webview')).toBe(map);
    expect(screen.getByTestId('windy-webview').props.source).toBe(source);
  });
  fireEvent.press(screen.getByLabelText('Open map in browser'));
  await waitFor(() => expect(open).toHaveBeenCalledWith(source.uri));
  expect(mockWeatherContext.refreshWeather).not.toHaveBeenCalled();
});

it('lets a slow map load in the same WebView', () => {
  render(<MapScreen />);
  const map = screen.getByTestId('windy-webview');
  expect(screen.getByLabelText('Loading weather map')).toBeTruthy();

  act(() => jest.advanceTimersByTime(65_000));
  expect(screen.getByLabelText('Loading weather map')).toBeTruthy();
  expect(screen.queryByRole('alert')).toBeNull();
  expect(screen.getByTestId('windy-webview')).toBe(map);

  fireEvent(map, 'load');
  expect(screen.queryByLabelText('Loading weather map')).toBeNull();
  expect(screen.getByTestId('windy-webview')).toBe(map);
});

it('shows a brief message for an HTTP failure and clears it on refresh', () => {
  render(<MapScreen />);
  const map = screen.getByTestId('windy-webview');
  const source = map.props.source;

  fireEvent(map, 'httpError', { nativeEvent: { statusCode: 503 } });
  fireEvent(map, 'load');
  expect(screen.getByRole('alert')).toHaveTextContent(/^Map couldn’t load/);
  expect(screen.queryByLabelText('Loading weather map')).toBeNull();
  expect(screen.getByTestId('windy-webview')).toBe(map);

  fireEvent.press(screen.getByLabelText('Refresh map'));
  const retry = screen.getByTestId('windy-webview');
  expect(retry).not.toBe(map);
  expect(retry.props.source).toEqual(source);
  expect(screen.queryByRole('alert')).toBeNull();
  expect(screen.getByLabelText('Loading weather map')).toBeTruthy();
  fireEvent(retry, 'load');
  expect(screen.queryByLabelText('Loading weather map')).toBeNull();
});
