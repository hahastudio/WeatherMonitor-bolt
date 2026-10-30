/** Astronomy domain: UTC milliseconds, angles in degrees, bearings from true north. */
export interface AstronomyEvent {
  timesUtcMs: number[];
  status: 'events' | 'none_on_date' | 'unknown';
  source: 'openweather' | 'calculated';
}

export interface AstronomyEvents {
  sunrise: AstronomyEvent;
  sunset: AstronomyEvent;
  moonrise: AstronomyEvent;
  moonset: AstronomyEvent;
}

export interface AstronomySnapshot {
  schemaVersion: 1;
  latitude: number;
  longitude: number;
  timeZoneId?: string;
  utcOffsetSeconds: number;
  fetchedAtUtcMs: number;
  days: (AstronomyEvents & {
    localDate: string;
    providerMoonPhase: number | null;
  })[];
}

export interface ObserverZone {
  timeZoneId?: string;
  utcOffsetSeconds: number;
  kind: 'iana' | 'fixed' | 'utc';
}

export interface AstronomyObserver {
  latitude: number;
  longitude: number;
  zone: ObserverZone;
  snapshot?: AstronomySnapshot;
}

export interface SkyPosition {
  altitudeDeg: number;
  azimuthDeg: number;
}

export interface EarthPoint {
  latitudeDeg: number;
  longitudeDeg: number;
}

export interface AstronomyInstant {
  atUtcMs: number;
  sun: SkyPosition;
  moon: SkyPosition;
  moonPhaseCycle: number;
  moonIlluminatedFraction: number;
  subsolar: EarthPoint;
  sunlightIncidenceDeg: number | null;
}

export type HorizonState = 'crosses' | 'always_up' | 'always_down' | 'unknown';
export type SolarPeriod = 'day' | 'night' | 'unknown';

export interface AstronomyDay {
  localDate: string;
  startUtcMs: number;
  endUtcMs: number;
  samples: { atUtcMs: number; sun: SkyPosition; moon: SkyPosition }[];
  events: AstronomyEvents;
  sunState: HorizonState;
  moonState: HorizonState;
  /** State just before the first event, resolved using the rise/set convention. */
  startsInDaylight: boolean | null;
  daylightMs: number | null;
}
