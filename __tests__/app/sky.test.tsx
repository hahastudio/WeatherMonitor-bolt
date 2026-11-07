import React from 'react';
import { AppState } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import SkyScreen from '../../app/(tabs)/sky';
import { SettingsButton } from '../../components/SettingsButton';
import { mockWeatherContext } from '../mocks';
import { astronomySnapshot } from '../fixtures/astronomy';
import { defaultTheme } from '../../utils/weatherTheme';
import { TimeControl } from '../../components/astronomy/TimeControl';

let mockContext: any;
let mockWidth = 390;
jest.mock('../../hooks/useAdaptiveLayout', () => ({
  useAdaptiveLayout: () =>
    jest
      .requireActual('../../hooks/useAdaptiveLayout')
      .adaptiveLayout(mockWidth, 800),
}));
const mockNavigate = jest.fn();
jest.mock('../../contexts/WeatherContext', () => ({
  useWeather: () => mockContext,
}));
jest.mock('../../components/ScrollingScreen', () => ({
  ScrollingScreen: require('react-native').View,
}));
jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => void | (() => void)) =>
    require('react').useEffect(callback, [callback]),
  useRouter: () => ({ navigate: mockNavigate }),
}));
jest.mock('react-native-svg');
jest.mock('lucide-react-native');

beforeEach(() => {
  jest.useFakeTimers().setSystemTime(new Date('2026-10-25T13:00Z'));
  AppState.currentState = 'active';
  mockContext = {
    ...mockWeatherContext,
    theme: defaultTheme,
    cityName: 'Shanghai',
    location: { latitude: 31.2304, longitude: 121.4737 },
    forecast: { ...mockWeatherContext.forecast, astronomy: astronomySnapshot },
  };
  mockWidth = 390;
  jest.clearAllMocks();
  (global.fetch as jest.Mock).mockClear();
});
afterEach(() => jest.useRealTimers());

it('leads with phase at night, keeps both sunlight views, and preserves control identity across order changes', () => {
  const view = render(<SkyScreen />);
  const order = () =>
    screen
      .getAllByTestId(/^(sun|moon|sunlight)-section$/)
      .map((node) => node.props.testID);
  expect(order()).toEqual(['moon-section', 'sunlight-section', 'sun-section']);
  expect(
    screen
      .getAllByTestId(/^moon-(phase|path)$/)
      .map((node) => node.props.testID),
  ).toEqual(['moon-phase', 'moon-path']);
  fireEvent.press(screen.getByTestId('sky-time-toggle'));
  const slider = screen.getByTestId('sky-time-slider');
  const globe = screen.getByTestId('day-night-globe');
  const time = screen.getByTestId('selected-sky-time').props.children;
  fireEvent.press(screen.getByLabelText('Rotate globe east'));
  expect(screen.getByTestId('selected-sky-time').props.children).toEqual(time);
  const cameraAfterRotation = screen.getByLabelText(
    /Earth at the selected time/,
  ).props.accessibilityLabel;
  fireEvent(
    view.UNSAFE_getByType(TimeControl),
    'onTime',
    Date.parse('2026-10-25T04:00Z'),
  );
  expect(order()).toEqual(['sun-section', 'sunlight-section', 'moon-section']);
  expect(screen.getByTestId('sky-time-slider')).toBe(slider);
  expect(screen.getByTestId('day-night-globe')).toBe(globe);
  expect(
    screen
      .getByLabelText(/Earth at the selected time/)
      .props.accessibilityLabel.split('Camera centred on')[1],
  ).toBe(cameraAfterRotation.split('Camera centred on')[1]);
  fireEvent.press(screen.getByLabelText('Now, resume live time'));
  expect(order()).toEqual(['moon-section', 'sunlight-section', 'sun-section']);
  expect(global.fetch).not.toHaveBeenCalled();
  expect(mockContext.refreshWeather).not.toHaveBeenCalled();
});
it('supports accessible time adjustment, day navigation, and Settings', () => {
  render(<SkyScreen />);
  fireEvent.press(screen.getByTestId('sky-time-toggle'));
  fireEvent(screen.getByTestId('sky-time-slider'), 'accessibilityAction', {
    nativeEvent: { actionName: 'decrement' },
  });
  expect(screen.getByTestId('sky-time-status')).toHaveTextContent(/^Preview/);
  expect(screen.getByText('20:45')).toBeTruthy();
  fireEvent.press(screen.getByLabelText('Next date'));
  expect(screen.getByText('Mon, 26 Oct 2026')).toBeTruthy();
  render(<SettingsButton theme={defaultTheme} />);
  fireEvent.press(screen.getByLabelText('Open settings'));
  expect(mockNavigate).toHaveBeenCalledWith('/settings');
  expect(global.fetch).not.toHaveBeenCalled();
});
it('retains Moon-first at night when the Moon is below the horizon', () => {
  jest.setSystemTime(new Date('2026-11-01T10:00Z'));
  render(<SkyScreen />);
  expect(
    screen.getAllByTestId(/^(sun|moon|sunlight)-section$/)[0].props.testID,
  ).toBe('moon-section');
  expect(screen.getByTestId('moon-path').props.accessibilityLabel).toContain(
    'geometric elevation -',
  );
  expect(screen.getByTestId('moon-phase')).toBeTruthy();
});

it('starts collapsed and preserves preview time and date when closed and reopened', () => {
  render(<SkyScreen />);
  const toggle = screen.getByTestId('sky-time-toggle');
  expect(toggle).toHaveAccessibilityState({ expanded: false });
  expect(screen.getByTestId('sky-time-status')).toHaveTextContent('Live');
  expect(screen.getByText('21:00')).toBeTruthy();
  expect(screen.queryByTestId('sky-time-panel')).toBeNull();
  expect(screen.queryByLabelText('Next date')).toBeNull();
  expect(screen.queryByLabelText('Time of day')).toBeNull();
  expect(screen.queryByLabelText('Now, resume live time')).toBeNull();

  fireEvent.press(toggle);
  expect(toggle).toHaveAccessibilityState({ expanded: true });
  fireEvent.press(screen.getByLabelText('Preview fifteen minutes earlier'));
  fireEvent.press(screen.getByLabelText('Next date'));
  fireEvent.press(toggle);
  expect(screen.queryByTestId('sky-time-panel')).toBeNull();
  expect(screen.getByText('20:45')).toBeTruthy();
  expect(screen.getByTestId('sky-time-status')).toHaveTextContent(
    'Preview · Mon, 26 Oct 2026',
  );
  fireEvent.press(toggle);
  expect(screen.getByText('20:45')).toBeTruthy();
  fireEvent.press(screen.getByLabelText('Now, resume live time'));
  expect(screen.getByText('21:00')).toBeTruthy();
  expect(screen.getByTestId('sky-time-status')).toHaveTextContent('Live');
  expect(global.fetch).not.toHaveBeenCalled();
});

it('preserves the preview instant, expanded controls and globe camera across folding', () => {
  const view = render(<SkyScreen />);
  fireEvent.press(screen.getByTestId('sky-time-toggle'));
  fireEvent.press(screen.getByLabelText('Preview fifteen minutes earlier'));
  fireEvent.press(screen.getByLabelText('Rotate globe east'));
  const time = screen.getByTestId('selected-sky-time').props.children;
  const globe = screen.getByTestId('day-night-globe');
  const camera = screen.getByLabelText(/Earth at the selected time/).props
    .accessibilityLabel;
  [720, 840, 390].forEach((width) => {
    mockWidth = width;
    view.rerender(<SkyScreen />);
    expect(screen.getByTestId('day-night-globe')).toBe(globe);
    expect(screen.getByTestId('sky-time-slider')).toBeTruthy();
    expect(screen.getByTestId('selected-sky-time').props.children).toEqual(
      time,
    );
    expect(
      screen.getByLabelText(/Earth at the selected time/).props
        .accessibilityLabel,
    ).toBe(camera);
  });
  expect(mockContext.refreshWeather).not.toHaveBeenCalled();
});
