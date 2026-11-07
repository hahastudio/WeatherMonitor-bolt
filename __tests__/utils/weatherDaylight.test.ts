import { isWeatherNight } from '../../utils/weatherDaylight';
import { getTheme, weatherPalettes } from '../../utils/weatherTheme';
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
it('keeps all sixteen three-stop palettes independent of appearance', () => {
  expect(Object.keys(weatherPalettes)).toHaveLength(8);
  for (const [condition, palette] of Object.entries(weatherPalettes)) {
    for (const dark of [false, true]) {
      const theme = getTheme(
        condition === 'night'
          ? 'clear'
          : (condition as Parameters<typeof getTheme>[0]),
        dark,
        condition === 'night',
      );
      expect(theme.gradient).toEqual(dark ? palette.dark : palette.light);
      expect(theme.gradientLocations).toEqual([0, 0.58, 1]);
      expect(theme.isDark).toBe(dark);
      expect(theme.heroText).toBe('#FFFFFF');
    }
  }
  expect(getTheme('rain', false, true).gradient).toEqual(
    weatherPalettes.rain.light,
  );
  expect(getTheme('fog', true).gradient).toEqual(weatherPalettes.mist.dark);
  expect(getTheme('clear', false, true).text).toBe('#0A2B52');
});
