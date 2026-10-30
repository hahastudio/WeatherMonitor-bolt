import type { AstronomySnapshot } from '../../types/astronomy';
export const astronomySnapshot: AstronomySnapshot = {
  schemaVersion: 1,
  latitude: 31.2304,
  longitude: 121.4737,
  timeZoneId: 'Asia/Shanghai',
  utcOffsetSeconds: 28800,
  fetchedAtUtcMs: Date.parse('2026-10-25T00:00Z'),
  days: [
    {
      localDate: '2026-10-25',
      sunrise: {
        timesUtcMs: [Date.parse('2026-10-24T22:04Z')],
        status: 'events',
        source: 'openweather',
      },
      sunset: {
        timesUtcMs: [Date.parse('2026-10-25T09:12Z')],
        status: 'events',
        source: 'openweather',
      },
      moonrise: { timesUtcMs: [], status: 'unknown', source: 'openweather' },
      moonset: { timesUtcMs: [], status: 'unknown', source: 'openweather' },
      providerMoonPhase: 0.49,
    },
  ],
};
