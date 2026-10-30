import {
  calculateDay,
  calculateInstant,
} from '../../services/astronomyService';
import { resolveZone } from '../../utils/astronomyTime';
import reference from '../fixtures/ephemeris.json';
import type { AstronomyEvents } from '../../types/astronomy';

it.each(reference.positions)(
  'matches archived JPL airless $body at $at',
  ({ body, latitude, longitude, at, azimuth, altitude }) => {
    const result = calculateInstant(
      { latitude, longitude, zone: resolveZone('UTC') },
      Date.parse(at),
    )[body as 'sun' | 'moon'];
    // 0.02 degrees allows the library's arcminute accuracy and the Moon fixture's
    // 10 m observer height versus this app's sea-level convention.
    expect(Math.abs(result.altitudeDeg - altitude)).toBeLessThan(0.02);
    expect(Math.abs(result.azimuthDeg - azimuth)).toBeLessThan(0.02);
  },
);
it.each(reference.events)(
  'matches USNO $event at $at ($latitude,$longitude)',
  ({ latitude, longitude, event, at }) => {
    const day = calculateDay(
      { latitude, longitude, zone: resolveZone('UTC') },
      at.slice(0, 10),
    );
    const times = day.events[event as keyof AstronomyEvents].timesUtcMs;
    expect(times.length).toBeGreaterThan(0);
    // Reference values are rounded to a minute; allow two minutes for models/refraction.
    expect(
      Math.min(...times.map((t) => Math.abs(t - Date.parse(at)))),
    ).toBeLessThan(120_000);
  },
);
