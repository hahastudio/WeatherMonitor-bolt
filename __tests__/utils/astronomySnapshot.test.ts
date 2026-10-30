import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  readAstronomySnapshot,
  resolveAstronomyObserver,
} from '../../utils/astronomySnapshot';
import { saveForecast, loadForecast } from '../../utils/weatherStorage';
import { mockCurrentWeather, mockForecast } from '../mocks';
import { astronomySnapshot } from '../fixtures/astronomy';

it('keeps legacy caches readable and round trips the optional astronomy extension', async () => {
  await saveForecast(mockForecast);
  expect(await loadForecast()).toEqual(mockForecast);
  const forecast = { ...mockForecast, astronomy: astronomySnapshot };
  await saveForecast(forecast);
  expect(await loadForecast()).toEqual(forecast);
});
it('drops an unsupported/corrupt extension without discarding the weather', async () => {
  await AsyncStorage.setItem(
    '@weather_app_forecast',
    JSON.stringify({
      ...mockForecast,
      astronomy: { ...astronomySnapshot, schemaVersion: 2 },
    }),
  );
  expect(await loadForecast()).toEqual(mockForecast);
  expect(
    readAstronomySnapshot({ ...astronomySnapshot, latitude: 100 }),
  ).toBeUndefined();
});
it('removes zero, wrong-date and non-finite event timestamps without inventing absence', () => {
  const raw = {
    ...astronomySnapshot,
    days: [
      {
        ...astronomySnapshot.days[0],
        sunrise: {
          timesUtcMs: [0, NaN, Date.parse('2026-01-01')],
          status: 'events',
          source: 'openweather',
        },
      },
    ],
  };
  expect(readAstronomySnapshot(raw)?.days[0].sunrise).toEqual({
    timesUtcMs: [],
    status: 'unknown',
    source: 'openweather',
  });
});
it('never combines a newly selected location with an old cached time zone', () => {
  const forecast = { ...mockForecast, astronomy: astronomySnapshot };
  const match = resolveAstronomyObserver(
    { latitude: 31.2304, longitude: 121.4737 },
    forecast,
    mockCurrentWeather,
  );
  expect(match?.zone.timeZoneId).toBe('Asia/Shanghai');
  const moved = resolveAstronomyObserver(
    { latitude: -33.87, longitude: 151.21 },
    forecast,
    mockCurrentWeather,
  );
  expect(moved?.snapshot).toBeUndefined();
  expect(moved?.zone.kind).toBe('utc');
  const legacy = resolveAstronomyObserver(null, mockForecast, null);
  expect(legacy?.zone.kind).toBe('fixed');
  expect(resolveAstronomyObserver(null, null, null)).toBeNull();
});
