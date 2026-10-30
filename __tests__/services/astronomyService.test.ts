import {
  calculateDay,
  calculateInstant,
  phaseName,
  solarPeriodAt,
} from '../../services/astronomyService';
import { resolveZone } from '../../utils/astronomyTime';
import type { AstronomyObserver } from '../../types/astronomy';
const shanghai: AstronomyObserver = {
  latitude: 31.2304,
  longitude: 121.4737,
  zone: resolveZone('Asia/Shanghai', 28800),
};

describe('local astronomy adapter', () => {
  it('uses degrees and clockwise true north, with independent phase and illumination', () => {
    const instant = calculateInstant(shanghai, Date.parse('2026-10-25T04:00Z'));
    expect(instant.sun.altitudeDeg).toBeCloseTo(46.37, 1);
    expect(instant.sun.azimuthDeg).toBeGreaterThan(180);
    expect(instant.sun.azimuthDeg).toBeLessThan(195);
    expect(instant.moonPhaseCycle).toBeGreaterThan(0.45);
    expect(instant.moonPhaseCycle).toBeLessThan(0.5);
    expect(instant.moonIlluminatedFraction).toBeGreaterThan(0.97);
    expect(instant.moonIlluminatedFraction).not.toBeCloseTo(
      instant.moonPhaseCycle,
      1,
    );
    expect(instant.sunlightIncidenceDeg! + instant.sun.altitudeDeg).toBeCloseTo(
      90,
      8,
    );
  });
  it.each([
    [31.23, 121.47],
    [-33.87, 151.21],
    [-0.18, -78.47],
    [69.65, 18.96],
  ])(
    'keeps coordinates finite and the subsolar point overhead at %s,%s',
    (latitude, longitude) => {
      const observer = { ...shanghai, latitude, longitude },
        at = Date.parse('2026-06-21T12:00Z');
      const instant = calculateInstant(observer, at);
      expect(instant.sun.azimuthDeg).toBeGreaterThanOrEqual(0);
      expect(instant.moon.azimuthDeg).toBeLessThan(360);
      const overhead = calculateInstant(
        {
          ...observer,
          latitude: instant.subsolar.latitudeDeg,
          longitude: instant.subsolar.longitudeDeg,
        },
        at,
      );
      expect(overhead.sun.altitudeDeg).toBeGreaterThan(89.99);
    },
  );
  it('switches exactly at sunrise/sunset, including pre-dawn and Moon below horizon', () => {
    const day = calculateDay(shanghai, '2026-10-25');
    const rise = day.events.sunrise.timesUtcMs[0],
      set = day.events.sunset.timesUtcMs[0];
    expect(solarPeriodAt(day, day.startUtcMs)).toBe('night');
    expect(solarPeriodAt(day, rise - 1)).toBe('night');
    expect(solarPeriodAt(day, rise)).toBe('day');
    expect(solarPeriodAt(day, set - 1)).toBe('day');
    expect(solarPeriodAt(day, set)).toBe('night');
    const next = calculateDay(shanghai, '2026-11-01'),
      at = Date.parse('2026-11-01T10:00Z');
    expect(calculateInstant(shanghai, at).moon.altitudeDeg).toBeLessThan(0);
    expect(solarPeriodAt(next, at)).toBe('night');
    expect(calculateInstant(shanghai, at).sunlightIncidenceDeg).toBeNull();
  });
  it('prefers provider events without altering calculated paths', () => {
    const original = calculateDay(shanghai, '2026-10-25');
    const sunrise = {
      ...original.events.sunrise,
      source: 'openweather' as const,
      timesUtcMs: [original.events.sunrise.timesUtcMs[0] + 120_000],
    };
    const observer = {
      ...shanghai,
      snapshot: {
        schemaVersion: 1 as const,
        latitude: shanghai.latitude,
        longitude: shanghai.longitude,
        timeZoneId: 'Asia/Shanghai',
        utcOffsetSeconds: 28800,
        fetchedAtUtcMs: Date.now(),
        days: [
          {
            ...original.events,
            localDate: original.localDate,
            sunrise,
            providerMoonPhase: 0.49,
          },
        ],
      },
    };
    const day = calculateDay(observer, original.localDate);
    expect(day.samples).toBe(original.samples);
    expect(day.events.sunrise).toBe(sunrise);
    expect(solarPeriodAt(day, sunrise.timesUtcMs[0] - 1)).toBe('night');
    expect(solarPeriodAt(day, sunrise.timesUtcMs[0])).toBe('day');
  });
  it.each([
    ['2026-06-21', 'always_up', 'day'],
    ['2026-12-21', 'always_down', 'night'],
  ])(
    'resolves polar day/night on %s without invented events',
    (date, state, period) => {
      const observer = {
        latitude: 78.22,
        longitude: 15.65,
        zone: resolveZone('Arctic/Longyearbyen'),
      };
      const day = calculateDay(observer, date);
      expect(day.events.sunrise.status).toBe('none_on_date');
      expect(day.events.sunrise.timesUtcMs).toEqual([]);
      expect(day.sunState).toBe(state);
      expect(solarPeriodAt(day, day.startUtcMs + 3600_000)).toBe(period);
      expect(day.daylightMs).toBe(period === 'day' ? 86400_000 : 0);
    },
  );
  it('samples the full DST day and computes the selected instant directly', () => {
    const o = {
      latitude: 40.7128,
      longitude: -74.006,
      zone: resolveZone('America/New_York'),
    };
    const day = calculateDay(o, '2026-11-01');
    expect(day.samples).toHaveLength(151);
    expect(day.samples[150].atUtcMs).toBe(day.endUtcMs);
    const t = day.startUtcMs + 123456;
    expect(calculateInstant(o, t).atUtcMs).toBe(t);
  });
  it('names quarter phases using cycle position', () => {
    expect(phaseName(0)).toBe('New Moon');
    expect(phaseName(0.25)).toBe('First quarter');
    expect(phaseName(0.5)).toBe('Full Moon');
    expect(phaseName(0.75)).toBe('Last quarter');
  });
});
