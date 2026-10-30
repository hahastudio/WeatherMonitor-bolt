import {
  Body,
  Equator,
  Horizon,
  Observer,
  SearchRiseSet,
  MoonPhase,
  Illumination,
  EquatorFromVector,
  RotateVector,
  Rotation_EQJ_EQD,
  GeoVector,
  SiderealTime,
  KM_PER_AU,
} from 'astronomy-engine';
import type {
  AstronomyDay,
  AstronomyEvent,
  AstronomyEvents,
  AstronomyInstant,
  AstronomyObserver,
  HorizonState,
  SkyPosition,
  SolarPeriod,
} from '../types/astronomy';
import { observerDayBounds } from '../utils/astronomyTime';

export const ASTRONOMY_ENGINE_VERSION = 'astronomy-engine@2.1.19';
const DAY_MS = 86_400_000;
const SAMPLE_MS = 10 * 60_000;
export const wrapLongitude = (degrees: number) =>
  ((((degrees + 540) % 360) + 360) % 360) - 180;
const observerFor = (o: AstronomyObserver) =>
  new Observer(o.latitude, o.longitude, 0);

function position(body: Body, date: Date, observer: Observer): SkyPosition {
  const equator = Equator(body, date, observer, true, true);
  // Omit refraction: path and ground angle use the geometric centre, in degrees.
  const horizon = Horizon(date, observer, equator.ra, equator.dec);
  return { altitudeDeg: horizon.altitude, azimuthDeg: horizon.azimuth };
}

export function calculateInstant(
  observer: AstronomyObserver,
  atUtcMs: number,
): AstronomyInstant {
  const date = new Date(atUtcMs);
  const local = observerFor(observer);
  const sun = position(Body.Sun, date, local);
  const moon = position(Body.Moon, date, local);
  const geocentricSun = EquatorFromVector(
    RotateVector(Rotation_EQJ_EQD(date), GeoVector(Body.Sun, date, true)),
  );
  return {
    atUtcMs,
    sun,
    moon,
    moonPhaseCycle: MoonPhase(date) / 360,
    moonIlluminatedFraction: Illumination(Body.Moon, date).phase_fraction,
    subsolar: {
      latitudeDeg: geocentricSun.dec,
      longitudeDeg: wrapLongitude(15 * (geocentricSun.ra - SiderealTime(date))),
    },
    sunlightIncidenceDeg: sun.altitudeDeg > 0 ? 90 - sun.altitudeDeg : null,
  };
}

function searchEvents(
  body: Body,
  observer: Observer,
  direction: 1 | -1,
  start: number,
  end: number,
): AstronomyEvent {
  try {
    const timesUtcMs: number[] = [];
    let cursor = start;
    // A 25-hour civil day can contain two rises/sets. Search the entire interval.
    while (cursor < end) {
      const result = SearchRiseSet(
        body,
        observer,
        direction,
        new Date(cursor),
        (end - cursor) / DAY_MS,
      );
      if (!result) break;
      const time = result.date.getTime();
      if (time >= start && time < end) timesUtcMs.push(time);
      if (time >= end || time < cursor) break;
      cursor = time + 1000;
    }
    return {
      timesUtcMs,
      status: timesUtcMs.length ? 'events' : 'none_on_date',
      source: 'calculated',
    };
  } catch {
    return { timesUtcMs: [], status: 'unknown', source: 'calculated' };
  }
}

/** Same sea-level upper-limb convention as Engine 2.1.19 SearchRiseSet.
 * Used only for dates with NO crossings, never to move an event or fit a path.
 * Source: astronomy.js BodyRadiusAu / InternalSearchAltitude / SearchRiseSet.
 */
function limbIsUp(body: Body, date: Date, observer: Observer): boolean {
  const eq = Equator(body, date, observer, true, true);
  const hor = Horizon(date, observer, eq.ra, eq.dec);
  const radiusKm = body === Body.Sun ? 695700 : 1738.1;
  const radiusDeg = (Math.asin(radiusKm / KM_PER_AU / eq.dist) * 180) / Math.PI;
  return hor.altitude + radiusDeg + 34 / 60 >= 0;
}

function timeline(rise: AstronomyEvent, set: AstronomyEvent) {
  return [
    ...rise.timesUtcMs.map((time) => ({ time, up: true })),
    ...set.timesUtcMs.map((time) => ({ time, up: false })),
  ].sort((a, b) => a.time - b.time);
}

function initialState(
  rise: AstronomyEvent,
  set: AstronomyEvent,
  body: Body,
  at: number,
  observer: Observer,
): boolean | null {
  if (rise.status === 'unknown' || set.status === 'unknown') return null;
  const first = timeline(rise, set)[0];
  return first ? !first.up : limbIsUp(body, new Date(at), observer);
}

function horizonState(
  rise: AstronomyEvent,
  set: AstronomyEvent,
  initial: boolean | null,
): HorizonState {
  if (initial === null) return 'unknown';
  if (rise.timesUtcMs.length || set.timesUtcMs.length) return 'crosses';
  return initial ? 'always_up' : 'always_down';
}

// Bounded, in-memory cache. Provider updates can change labels without resampling paths.
const dailyCache = new Map<
  string,
  { samples: AstronomyDay['samples']; events: AstronomyEvents }
>();
export function calculateDay(
  observer: AstronomyObserver,
  localDate: string,
): AstronomyDay {
  const { startUtcMs, endUtcMs } = observerDayBounds(localDate, observer.zone);
  const local = observerFor(observer);
  const key = `${ASTRONOMY_ENGINE_VERSION}:${observer.latitude}:${observer.longitude}:${startUtcMs}:${endUtcMs}`;
  let calculated = dailyCache.get(key);
  if (!calculated) {
    const samples: AstronomyDay['samples'] = [];
    for (let at = startUtcMs; at < endUtcMs; at += SAMPLE_MS) {
      const date = new Date(at);
      samples.push({
        atUtcMs: at,
        sun: position(Body.Sun, date, local),
        moon: position(Body.Moon, date, local),
      });
    }
    const end = new Date(endUtcMs);
    samples.push({
      atUtcMs: endUtcMs,
      sun: position(Body.Sun, end, local),
      moon: position(Body.Moon, end, local),
    });
    calculated = {
      samples,
      events: {
        sunrise: searchEvents(Body.Sun, local, 1, startUtcMs, endUtcMs),
        sunset: searchEvents(Body.Sun, local, -1, startUtcMs, endUtcMs),
        moonrise: searchEvents(Body.Moon, local, 1, startUtcMs, endUtcMs),
        moonset: searchEvents(Body.Moon, local, -1, startUtcMs, endUtcMs),
      },
    };
    if (dailyCache.size >= 12)
      dailyCache.delete(dailyCache.keys().next().value!);
    dailyCache.set(key, calculated);
  }
  const provider = observer.snapshot?.days.find(
    (day) => day.localDate === localDate,
  );
  const choose = (key: keyof AstronomyEvents) =>
    provider?.[key].status === 'events' && provider[key].timesUtcMs.length
      ? provider[key]
      : calculated!.events[key];
  const events = {
    sunrise: choose('sunrise'),
    sunset: choose('sunset'),
    moonrise: choose('moonrise'),
    moonset: choose('moonset'),
  };
  const startsInDaylight = initialState(
    events.sunrise,
    events.sunset,
    Body.Sun,
    startUtcMs,
    local,
  );
  const moonStartsUp = initialState(
    events.moonrise,
    events.moonset,
    Body.Moon,
    startUtcMs,
    local,
  );
  let daylightMs: number | null = startsInDaylight === null ? null : 0;
  let up = startsInDaylight;
  let cursor = startUtcMs;
  if (daylightMs !== null) {
    for (const event of timeline(events.sunrise, events.sunset)) {
      if (up) daylightMs += event.time - cursor;
      cursor = event.time;
      up = event.up;
    }
    if (up) daylightMs += endUtcMs - cursor;
  }
  return {
    localDate,
    startUtcMs,
    endUtcMs,
    samples: calculated.samples,
    events,
    startsInDaylight,
    daylightMs,
    sunState: horizonState(events.sunrise, events.sunset, startsInDaylight),
    moonState: horizonState(events.moonrise, events.moonset, moonStartsUp),
  };
}

/** Sunrise is inclusive; sunset is exclusive. Uses the same events the screen displays. */
export function solarPeriodAt(day: AstronomyDay, atUtcMs: number): SolarPeriod {
  if (
    day.startsInDaylight === null ||
    atUtcMs < day.startUtcMs ||
    atUtcMs >= day.endUtcMs
  )
    return 'unknown';
  let up = day.startsInDaylight;
  for (const event of timeline(day.events.sunrise, day.events.sunset)) {
    if (event.time > atUtcMs) break;
    up = event.up;
  }
  return up ? 'day' : 'night';
}

export function phaseName(phase: number): string {
  if (phase < 0.012 || phase > 0.988) return 'New Moon';
  if (Math.abs(phase - 0.25) < 0.012) return 'First quarter';
  if (Math.abs(phase - 0.5) < 0.012) return 'Full Moon';
  if (Math.abs(phase - 0.75) < 0.012) return 'Last quarter';
  return phase < 0.25
    ? 'Waxing crescent'
    : phase < 0.5
      ? 'Waxing gibbous'
      : phase < 0.75
        ? 'Waning gibbous'
        : 'Waning crescent';
}

export function bearingLabel(azimuthDeg: number): string {
  return `${['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(azimuthDeg / 45) % 8]} ${Math.round(azimuthDeg) % 360}°`;
}
