import type {
  AstronomyEvent,
  AstronomySnapshot,
  AstronomyObserver,
} from '../types/astronomy';
import type {
  CurrentWeather,
  ForecastResponse,
  LocationCoords,
  OneCallResponse,
} from '../types/weather';
import { localDateAt, observerDayBounds, resolveZone } from './astronomyTime';

export function validCoordinates(
  latitude: unknown,
  longitude: unknown,
): boolean {
  return (
    typeof latitude === 'number' &&
    Number.isFinite(latitude) &&
    Math.abs(latitude) <= 90 &&
    typeof longitude === 'number' &&
    Number.isFinite(longitude) &&
    Math.abs(longitude) <= 180
  );
}

export function coordinatesMatch(
  a: LocationCoords,
  b: LocationCoords,
): boolean {
  // One Call rounds response coordinates. Do not reuse a different location's zone.
  return (
    Math.abs(a.latitude - b.latitude) <= 0.001 &&
    Math.abs(a.longitude - b.longitude) <= 0.001
  );
}

export function validUnixSeconds(value: unknown): number | undefined {
  return typeof value === 'number' &&
    Number.isFinite(value) &&
    value > 0 &&
    value * 1000 <= 8.64e15
    ? value
    : undefined;
}

export function createAstronomySnapshot(
  data: OneCallResponse,
  fetchedAtUtcMs = Date.now(),
): AstronomySnapshot | undefined {
  if (!validCoordinates(data.lat, data.lon)) return undefined;
  const zone = resolveZone(data.timezone, data.timezone_offset);
  return {
    schemaVersion: 1,
    latitude: data.lat,
    longitude: data.lon,
    timeZoneId: zone.timeZoneId,
    utcOffsetSeconds: zone.utcOffsetSeconds,
    fetchedAtUtcMs,
    days: data.daily
      .filter((day) => validUnixSeconds(day.dt))
      .map((day) => {
        const localDate = localDateAt(day.dt * 1000, zone);
        const { startUtcMs, endUtcMs } = observerDayBounds(localDate, zone);
        const event = (value?: number): AstronomyEvent => {
          const time = validUnixSeconds(value);
          const at = time === undefined ? NaN : time * 1000;
          const valid = at >= startUtcMs && at < endUtcMs;
          return {
            timesUtcMs: valid ? [at] : [],
            status: valid ? 'events' : 'unknown',
            source: 'openweather',
          };
        };
        return {
          localDate,
          sunrise: event(day.sunrise),
          sunset: event(day.sunset),
          moonrise: event(day.moonrise),
          moonset: event(day.moonset),
          providerMoonPhase:
            typeof day.moon_phase === 'number' &&
            day.moon_phase >= 0 &&
            day.moon_phase <= 1
              ? day.moon_phase
              : null,
        };
      }),
  };
}

/** Validate the optional extension independently: a corrupt/newer extension must not discard weather. */
export function readAstronomySnapshot(
  value: unknown,
): AstronomySnapshot | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const data = value as AstronomySnapshot;
  if (
    data.schemaVersion !== 1 ||
    !validCoordinates(data.latitude, data.longitude) ||
    !Number.isFinite(data.fetchedAtUtcMs) ||
    !Number.isFinite(data.utcOffsetSeconds) ||
    Math.abs(data.utcOffsetSeconds) > 18 * 3600 ||
    !Array.isArray(data.days)
  )
    return undefined;
  const zone = resolveZone(
    typeof data.timeZoneId === 'string' ? data.timeZoneId : undefined,
    data.utcOffsetSeconds,
  );
  try {
    const days = data.days
      .filter((day) => day && /^\d{4}-\d{2}-\d{2}$/.test(day.localDate))
      .map((day) => {
        const { startUtcMs, endUtcMs } = observerDayBounds(day.localDate, zone);
        const event = (raw: AstronomyEvent): AstronomyEvent => {
          const timesUtcMs = Array.isArray(raw?.timesUtcMs)
            ? raw.timesUtcMs.filter(
                (t) =>
                  Number.isFinite(t) &&
                  t > 0 &&
                  t >= startUtcMs &&
                  t < endUtcMs,
              )
            : [];
          // Provider absence is never evidence for no event. Recalculate missing values.
          return {
            timesUtcMs,
            status: timesUtcMs.length ? 'events' : 'unknown',
            source: 'openweather',
          };
        };
        return {
          localDate: day.localDate,
          sunrise: event(day.sunrise),
          sunset: event(day.sunset),
          moonrise: event(day.moonrise),
          moonset: event(day.moonset),
          providerMoonPhase:
            typeof day.providerMoonPhase === 'number' &&
            day.providerMoonPhase >= 0 &&
            day.providerMoonPhase <= 1
              ? day.providerMoonPhase
              : null,
        };
      });
    return {
      schemaVersion: 1,
      latitude: data.latitude,
      longitude: data.longitude,
      timeZoneId: zone.timeZoneId,
      utcOffsetSeconds: zone.utcOffsetSeconds,
      fetchedAtUtcMs: data.fetchedAtUtcMs,
      days,
    };
  } catch {
    return undefined;
  }
}

export function resolveAstronomyObserver(
  location: LocationCoords | null,
  forecast: ForecastResponse | null,
  weather: CurrentWeather | null,
): AstronomyObserver | null {
  const forecastCoords = forecast
    ? { latitude: forecast.city.coord.lat, longitude: forecast.city.coord.lon }
    : null;
  const weatherCoords = weather
    ? { latitude: weather.coord.lat, longitude: weather.coord.lon }
    : null;
  const coords = [location, forecastCoords, weatherCoords].find(
    (c) => c && validCoordinates(c.latitude, c.longitude),
  );
  if (!coords) return null;
  const snapshot = readAstronomySnapshot(forecast?.astronomy);
  if (snapshot && coordinatesMatch(coords, snapshot))
    return {
      ...coords,
      zone: resolveZone(snapshot.timeZoneId, snapshot.utcOffsetSeconds),
      snapshot,
    };
  const offset =
    forecastCoords && coordinatesMatch(coords, forecastCoords)
      ? forecast?.city.timezone
      : weatherCoords && coordinatesMatch(coords, weatherCoords)
        ? weather?.timezone
        : undefined;
  return { ...coords, zone: resolveZone(undefined, offset) };
}
