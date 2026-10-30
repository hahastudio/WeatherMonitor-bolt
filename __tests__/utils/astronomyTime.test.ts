import {
  addLocalDays,
  formatObserverTime,
  localDateAt,
  observerDayBounds,
  offsetAt,
  onLocalDate,
  resolveZone,
  zoneLabel,
} from '../../utils/astronomyTime';

describe('observer calendar', () => {
  it.each([
    ['America/New_York', '2026-03-08', 23],
    ['America/New_York', '2026-11-01', 25],
    ['Europe/London', '2026-10-25', 25],
    ['Australia/Lord_Howe', '2026-10-04', 23.5],
    ['Asia/Shanghai', '2026-10-25', 24],
  ])(
    '%s %s has %s hours, independent of device time zone',
    (zoneId, date, hours) => {
      const zone = resolveZone(zoneId, 0),
        bounds = observerDayBounds(date, zone);
      expect((bounds.endUtcMs - bounds.startUtcMs) / 3600_000).toBe(hours);
      expect(localDateAt(bounds.startUtcMs, zone)).toBe(date);
      expect(localDateAt(bounds.endUtcMs - 1, zone)).toBe(date);
      expect(localDateAt(bounds.endUtcMs, zone)).toBe(addLocalDays(date, 1));
    },
  );
  it('distinguishes both occurrences of a repeated wall-clock hour', () => {
    const zone = resolveZone('America/New_York');
    expect(
      formatObserverTime(Date.parse('2026-11-01T05:30Z'), zone, true),
    ).toBe('01:30 UTC−04:00');
    expect(
      formatObserverTime(Date.parse('2026-11-01T06:30Z'), zone, true),
    ).toBe('01:30 UTC−05:00');
  });
  it('preserves wall time across date changes and resolves a skipped hour forward', () => {
    const zone = resolveZone('America/New_York');
    expect(
      new Date(
        onLocalDate(Date.parse('2026-03-07T17:00Z'), '2026-03-08', zone),
      ).toISOString(),
    ).toBe('2026-03-08T16:00:00.000Z');
    expect(
      formatObserverTime(
        onLocalDate(Date.parse('2026-03-07T07:30Z'), '2026-03-08', zone),
        zone,
      ),
    ).toBe('03:30');
    expect(offsetAt(Date.parse('2026-03-08T16:00Z'), zone)).toBe(-14400);
  });
  it('labels invalid/missing zones and handles fractional offsets', () => {
    const fixed = resolveZone('not/a-zone', 20700);
    expect(zoneLabel(fixed, 0)).toContain('UTC+05:45 (fixed offset');
    expect(formatObserverTime(Date.parse('2026-10-25T00:00Z'), fixed)).toBe(
      '05:45',
    );
    expect(zoneLabel(resolveZone(), 0)).toBe(
      'UTC (location time zone unavailable)',
    );
    expect(zoneLabel(resolveZone(undefined, 100_000), 0)).toBe(
      'UTC (location time zone unavailable)',
    );
  });
});
