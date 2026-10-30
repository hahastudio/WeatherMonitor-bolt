import type { ObserverZone } from '../types/astronomy';

const DAY_MS = 86_400_000;
const formatters = new Map<string, Intl.DateTimeFormat>();

function formatter(timeZone: string) {
  let value = formatters.get(timeZone);
  if (!value) {
    value = new Intl.DateTimeFormat('en-GB', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    });
    formatters.set(timeZone, value);
  }
  return value;
}

export function resolveZone(
  timeZoneId?: string,
  offset?: number,
): ObserverZone {
  const utcOffsetSeconds =
    Number.isFinite(offset) && Math.abs(offset!) <= 18 * 3600 ? offset! : 0;
  if (timeZoneId) {
    try {
      formatter(timeZoneId).format(0);
      return { timeZoneId, utcOffsetSeconds, kind: 'iana' };
    } catch {
      /* Older runtimes or invalid provider zones use an explicit fallback. */
    }
  }
  return {
    utcOffsetSeconds,
    kind:
      Number.isFinite(offset) && Math.abs(offset!) <= 18 * 3600
        ? 'fixed'
        : 'utc',
  };
}

export function localParts(atUtcMs: number, zone: ObserverZone) {
  if (zone.kind !== 'iana' || !zone.timeZoneId) {
    const date = new Date(atUtcMs + zone.utcOffsetSeconds * 1000);
    return {
      year: date.getUTCFullYear(),
      month: date.getUTCMonth() + 1,
      day: date.getUTCDate(),
      hour: date.getUTCHours(),
      minute: date.getUTCMinutes(),
      second: date.getUTCSeconds(),
    };
  }
  const parts = formatter(zone.timeZoneId).formatToParts(atUtcMs);
  const value = (name: string) =>
    Number(parts.find((p) => p.type === name)?.value);
  return {
    year: value('year'),
    month: value('month'),
    day: value('day'),
    hour: value('hour') % 24,
    minute: value('minute'),
    second: value('second'),
  };
}

const pad = (n: number) => String(n).padStart(2, '0');
export function localDateAt(atUtcMs: number, zone: ObserverZone): string {
  const p = localParts(atUtcMs, zone);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

export function addLocalDays(localDate: string, count: number): string {
  return new Date(Date.parse(`${localDate}T12:00:00Z`) + count * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

export function offsetAt(atUtcMs: number, zone: ObserverZone): number {
  if (zone.kind !== 'iana') return zone.utcOffsetSeconds;
  const p = localParts(atUtcMs, zone);
  return (
    (Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) -
      Math.floor(atUtcMs / 1000) * 1000) /
    1000
  );
}

export function formatUtcOffset(seconds: number): string {
  const minutes = Math.round(Math.abs(seconds) / 60);
  return `UTC${seconds >= 0 ? '+' : '−'}${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}

export function zoneLabel(zone: ObserverZone, atUtcMs: number): string {
  if (zone.kind === 'iana')
    return `${zone.timeZoneId} · ${formatUtcOffset(offsetAt(atUtcMs, zone))}`;
  if (zone.kind === 'fixed')
    return `${formatUtcOffset(zone.utcOffsetSeconds)} (fixed offset; DST unavailable)`;
  return 'UTC (location time zone unavailable)';
}

export function formatObserverTime(
  atUtcMs: number,
  zone: ObserverZone,
  includeOffset = false,
): string {
  const p = localParts(atUtcMs, zone);
  return `${pad(p.hour)}:${pad(p.minute)}${includeOffset ? ` ${formatUtcOffset(offsetAt(atUtcMs, zone))}` : ''}`;
}

/** Find the first instant of a calendar date. Bisection handles midnight DST jumps. */
function dayStart(localDate: string, zone: ObserverZone): number {
  const nominal = Date.parse(`${localDate}T00:00:00Z`);
  if (!Number.isFinite(nominal)) throw new Error('Invalid calendar date');
  if (zone.kind !== 'iana') return nominal - zone.utcOffsetSeconds * 1000;
  let lo = nominal - 36 * 3600_000;
  let hi = nominal + 36 * 3600_000;
  while (hi - lo > 1) {
    const mid = Math.floor((hi + lo) / 2);
    if (localDateAt(mid, zone) < localDate) lo = mid;
    else hi = mid;
  }
  return hi;
}

export function observerDayBounds(localDate: string, zone: ObserverZone) {
  const startUtcMs = dayStart(localDate, zone);
  const endUtcMs = dayStart(addLocalDays(localDate, 1), zone);
  if (endUtcMs <= startUtcMs)
    throw new Error(
      'This calendar date does not exist in the location time zone',
    );
  return { startUtcMs, endUtcMs };
}

/** Preserve wall-clock time when changing dates; gaps advance, repeats select the first occurrence. */
export function onLocalDate(
  atUtcMs: number,
  localDate: string,
  zone: ObserverZone,
): number {
  const { hour, minute } = localParts(atUtcMs, zone);
  const { startUtcMs, endUtcMs } = observerDayBounds(localDate, zone);
  const nominal = Date.parse(`${localDate}T${pad(hour)}:${pad(minute)}:00Z`);
  const offsets = new Set([
    offsetAt(startUtcMs, zone),
    offsetAt(endUtcMs - 1, zone),
  ]);
  const candidates = [...offsets]
    .map((offset) => nominal - offset * 1000)
    .sort((a, b) => a - b);
  const exact = candidates.find(
    (time) =>
      time >= startUtcMs &&
      time < endUtcMs &&
      formatObserverTime(time, zone) === `${pad(hour)}:${pad(minute)}`,
  );
  if (exact !== undefined) return exact;
  return Math.max(
    startUtcMs,
    Math.min(endUtcMs - 60_000, candidates[candidates.length - 1]),
  );
}

export function formatObserverDate(localDate: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'UTC',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${localDate}T12:00:00Z`));
}
