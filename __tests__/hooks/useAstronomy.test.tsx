import { AppState, AppStateStatus } from 'react-native';
import { act, renderHook } from '@testing-library/react-native';
import { useAstronomy } from '../../hooks/useAstronomy';
import { mockCurrentWeather, mockForecast } from '../mocks';
import { astronomySnapshot } from '../fixtures/astronomy';

let mockFocused = true;
let mockContext: any;
jest.mock('../../contexts/WeatherContext', () => ({
  useWeather: () => mockContext,
}));
jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => void | (() => void)) => {
    require('react').useEffect(
      () => (mockFocused ? callback() : undefined),
      [callback, mockFocused],
    );
  },
}));

let changeState: (state: AppStateStatus) => void;
beforeEach(() => {
  jest.useFakeTimers().setSystemTime(new Date('2026-10-25T13:00Z'));
  mockFocused = true;
  mockContext = {
    location: { latitude: 31.2304, longitude: 121.4737 },
    forecast: { ...mockForecast, astronomy: astronomySnapshot },
    currentWeather: mockCurrentWeather,
  };
  AppState.currentState = 'active';
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_, listener) => {
    changeState = listener;
    return { remove: jest.fn() };
  });
  (global.fetch as jest.Mock).mockClear();
});
afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

it('ticks only while focused and active, immediately catching up on return', () => {
  const { result, rerender } = renderHook(() => useAstronomy());
  const start = result.current.atUtcMs,
    samples = result.current.day!.samples;
  act(() => jest.advanceTimersByTime(60_000));
  expect(result.current.atUtcMs).toBe(start + 60_000);
  expect(result.current.day!.samples).toBe(samples);
  act(() => changeState('background'));
  act(() => jest.advanceTimersByTime(120_000));
  expect(result.current.atUtcMs).toBe(start + 60_000);
  act(() => changeState('active'));
  expect(result.current.atUtcMs).toBe(start + 180_000);
  mockFocused = false;
  rerender({});
  act(() => jest.advanceTimersByTime(120_000));
  expect(result.current.atUtcMs).toBe(start + 180_000);
  mockFocused = true;
  rerender({});
  expect(result.current.atUtcMs).toBe(Date.now());
  expect(global.fetch).not.toHaveBeenCalled();
});
it('pauses for preview, synchronizes dates/order, and resumes on Now without requests', () => {
  const { result } = renderHook(() => useAstronomy());
  expect(result.current.moonFirst).toBe(true);
  act(() => result.current.selectTime(Date.parse('2026-10-25T04:00Z')));
  expect(result.current.isLive).toBe(false);
  expect(result.current.moonFirst).toBe(false);
  act(() => jest.advanceTimersByTime(120_000));
  expect(result.current.atUtcMs).toBe(Date.parse('2026-10-25T04:00Z'));
  act(() => result.current.selectDate(1));
  expect(result.current.localDate).toBe('2026-10-26');
  expect(result.current.atUtcMs).toBe(Date.parse('2026-10-26T04:00Z'));
  act(() => result.current.goLive());
  expect(result.current.isLive).toBe(true);
  expect(result.current.atUtcMs).toBe(Date.now());
  expect(result.current.moonFirst).toBe(true);
  expect(global.fetch).not.toHaveBeenCalled();
});
it('resets preview when the observer moves, without reusing the old zone', () => {
  const { result, rerender } = renderHook(() => useAstronomy());
  act(() => result.current.selectTime(Date.parse('2026-10-25T04:00Z')));
  mockContext = {
    ...mockContext,
    location: { latitude: -33.87, longitude: 151.21 },
  };
  rerender({});
  expect(result.current.isLive).toBe(true);
  expect(result.current.observer?.zone.kind).toBe('utc');
  expect(global.fetch).not.toHaveBeenCalled();
});
it('does not fabricate a location or request one automatically', () => {
  mockContext = { location: null, forecast: null, currentWeather: null };
  const { result } = renderHook(() => useAstronomy());
  expect(result.current.observer).toBeNull();
  expect(result.current.instant).toBeNull();
  expect(global.fetch).not.toHaveBeenCalled();
});
