import { isWeatherNight } from '../../utils/weatherDaylight';
import { getTheme } from '../../utils/weatherTheme';
import { mockCurrentWeather } from '../mocks';

it('uses remote location with stale provider sunrise data rather than device time', () => {
  const now = Date.parse('2026-06-21T04:00:00Z');
  expect(
    isWeatherNight(
      mockCurrentWeather,
      null,
      { latitude: 31.23, longitude: 121.47 },
      now,
    ),
  ).toBe(false);
  expect(
    isWeatherNight(
      mockCurrentWeather,
      null,
      { latitude: 40.71, longitude: -74.01 },
      now,
    ),
  ).toBe(true);
});
it('supports polar daylight and darkness without sunrise/sunset', () => {
  const location = { latitude: 78.22, longitude: 15.63 };
  expect(
    isWeatherNight(null, null, location, Date.parse('2026-06-21T00:00Z')),
  ).toBe(false);
  expect(
    isWeatherNight(null, null, location, Date.parse('2026-12-21T12:00Z')),
  ).toBe(true);
});
it('falls back to provider icon when location is unavailable', () => {
  expect(
    isWeatherNight(
      {
        ...mockCurrentWeather,
        coord: { lat: NaN, lon: NaN },
        sys: { country: 'CN' },
        weather: [{ ...mockCurrentWeather.weather[0], icon: '01n' }],
      },
      null,
      null,
      Date.now(),
    ),
  ).toBe(true);
});
it('retains rain at a remote location after sunset in either appearance', () => {
  const night = isWeatherNight(
    mockCurrentWeather,
    null,
    { latitude: 40.71, longitude: -74.01 },
    Date.parse('2026-06-21T04:00:00Z'),
  );
  expect(night).toBe(true);
  for (const dark of [false, true]) {
    const theme = getTheme('rain', dark, night);
    expect(theme.condition).toBe('rain');
    expect(theme.gradient).toEqual(['#11283D', '#23455D', '#486B80']);
    expect(theme.isDark).toBe(dark);
  }
});
