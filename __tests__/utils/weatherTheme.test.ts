import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import {
  materialFill,
  type SceneCondition,
  getWeatherCondition,
  getTheme,
  formatTemperature,
  formatTime,
  formatDate,
  capitalizeWords,
} from '../../utils/weatherTheme';

describe('Weather Theme Utils', () => {
  describe('getWeatherCondition', () => {
    it('should convert weather descriptions to conditions', () => {
      expect(getWeatherCondition('Clear')).toBe('clear');
      expect(getWeatherCondition('Clouds')).toBe('clouds');
      expect(getWeatherCondition('Rain')).toBe('rain');
      expect(getWeatherCondition('Snow')).toBe('snow');
      expect(getWeatherCondition('Thunderstorm')).toBe('thunderstorm');
      expect(getWeatherCondition('Storm')).toBe('thunderstorm');
      expect(getWeatherCondition('Drizzle')).toBe('drizzle');
      expect(getWeatherCondition('Mist')).toBe('mist');
      expect(getWeatherCondition('Fog')).toBe('mist');
      expect(getWeatherCondition('Haze')).toBe('mist');
      expect(getWeatherCondition('Unknown')).toBe('clear'); // default case
    });

    it('should be case insensitive', () => {
      expect(getWeatherCondition('CLEAR')).toBe('clear');
      expect(getWeatherCondition('clouDs')).toBe('clouds');
      expect(getWeatherCondition('ThUnDeRsToRm')).toBe('thunderstorm');
    });
  });

  describe('getTheme', () => {
    const cases: [
      SceneCondition,
      string[],
      string[],
      string,
      string,
      number,
      string,
    ][] = [
      [
        'clear',
        ['#149EEE', '#42B8F2', '#9DE4F6'],
        ['#07172E', '#102E50', '#264D6A'],
        '#001B55',
        '#0B426D',
        0.515,
        '#35779B',
      ],
      [
        'clouds',
        ['#1468C7', '#359DE0', '#8ADAF1'],
        ['#102A43', '#294C68', '#577B94'],
        '#001C4C',
        '#164565',
        0.535,
        '#357897',
      ],
      [
        'drizzle',
        ['#287687', '#5A9CAA', '#A0CDD1'],
        ['#102E3B', '#254C5A', '#547C86'],
        '#021F2D',
        '#154651',
        0.57,
        '#487880',
      ],
      [
        'rain',
        ['#275E88', '#4B88A9', '#8EB8CA'],
        ['#11283D', '#23455D', '#486B80'],
        '#031E3D',
        '#123B55',
        0.635,
        '#457790',
      ],
      [
        'snow',
        ['#467EAB', '#82B7D6', '#C9E3EF'],
        ['#18324B', '#355970', '#7394A6'],
        '#102239',
        '#244961',
        0.46,
        '#557488',
      ],
      [
        'mist',
        ['#527F99', '#7CA4B6', '#BDD4DD'],
        ['#233B4C', '#466373', '#78929D'],
        '#10222D',
        '#2A4B5B',
        0.52,
        '#597581',
      ],
      [
        'thunderstorm',
        ['#263C63', '#4C698A', '#829EB5'],
        ['#101E34', '#263952', '#4A5F76'],
        '#0C1A38',
        '#172F4C',
        0.755,
        '#527490',
      ],
    ];
    const rgb = (hex: string) =>
      [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
    const luminance = (channels: number[]) =>
      channels.reduce((sum, n, i) => {
        const c = n / 255;
        return (
          sum +
          [0.2126, 0.7152, 0.0722][i] *
            (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
        );
      }, 0);
    it.each(cases)(
      '%s resolves the full scene and both material roles',
      (condition, day, night, dayTint, ink, brightness, fallback) => {
        for (const isNight of [false, true])
          for (const dark of [false, true]) {
            const theme = getTheme(condition, dark, isNight);
            const lightDay = !isNight && !dark;
            const deep = rgb(ink).map((v, i) =>
              Math.round(dark ? v * 0.7 + [5, 18, 33][i] * 0.3 : v),
            );
            expect(theme.gradient).toEqual(isNight ? night : day);
            expect(theme.gradientLocations).toEqual([0, 0.58, 1]);
            expect(theme.text).toBe('#FFFFFF');
            expect(theme.textSecondary).toBe(lightDay ? '#F5FBFF' : '#E7F3FC');
            expect(theme.navigation.backdropBrightness).toBe(
              lightDay ? brightness : 1,
            );
            expect(rgb(theme.surface)).toEqual(lightDay ? rgb(fallback) : deep);
            expect(rgb(theme.content.tint)).toEqual(
              isNight ? deep : rgb(dayTint),
            );
            expect(theme.content.opacity).toBeLessThanOrEqual(
              isNight ? 0.5 : 0.61,
            );
            expect(theme.navigation.opacity).toBe(lightDay ? 0.5 : 0.9);
            expect(rgb(theme.navigation.tint)).toEqual(
              lightDay ? rgb('#0865A6') : deep,
            );
            const scene = theme.gradient.map((stop) =>
              rgb(stop).map((v, i) =>
                dark ? v * 0.84 + [5, 18, 33][i] * 0.16 : v,
              ),
            );
            const stops = theme.daylightGlass?.map((fill) =>
              Number(fill.match(/[0-9.]+/g)![3]),
            );
            if (isNight) expect(stops).toBeUndefined();
            else {
              expect(stops).toHaveLength(3);
              expect(stops![0]).toBeLessThanOrEqual(0.38);
              expect(stops![0]).toBeLessThan(stops![1]);
              expect(stops![1]).toBeLessThan(stops![2]);
              expect(stops![2]).toBeCloseTo(theme.content.opacity);
            }
            for (const material of [theme.content, theme.navigation]) {
              // Android navigation blur adds black at 75% of its intensity.
              const transmissions =
                material === theme.navigation ? [1, 1 - 66 / 255] : [1];
              for (const transmission of transmissions) {
                const [r, g, b, alpha] = materialFill(material, transmission)
                  .match(/[0-9.]+/g)!
                  .map(Number);
                for (const channel of [r, g, b])
                  expect(channel).toBeLessThanOrEqual(255);
                for (let step = 0; step <= 100; step++) {
                  const segment = step <= 58 ? 0 : 1;
                  const fraction = segment ? (step - 58) / 42 : step / 58;
                  const sky = scene[segment].map(
                    (v, i) => v + fraction * (scene[segment + 1][i] - v),
                  );
                  const expected = rgb(material.tint).map(
                    (v, i) =>
                      material.opacity * v +
                      (1 - material.opacity) *
                        (material.backdropBrightness ?? 1) *
                        sky[i],
                  );
                  const actual = [r, g, b].map(
                    (v, i) => alpha * v + (1 - alpha) * transmission * sky[i],
                  );
                  if (actual.some((v, i) => Math.abs(v - expected[i]) > 0.51))
                    throw Error(
                      'Composite differs by more than half a channel',
                    );
                  if (material === theme.content) {
                    const density = stops
                      ? stops[segment] +
                        fraction * (stops[segment + 1] - stops[segment])
                      : material.opacity;
                    const glass = rgb(material.tint).map(
                      (v, i) => v * density + (1 - density) * sky[i],
                    );
                    expect(
                      (luminance(rgb(theme.textSecondary)) + 0.05) /
                        (luminance(glass) + 0.05),
                    ).toBeGreaterThanOrEqual(4.65);
                  }
                }
              }
            }
          }
      },
    );
    it('aliases fog to mist and defaults to daytime without a device-time dependency', () => {
      expect(getTheme('fog', true, true)).toEqual(getTheme('mist', true, true));
      expect(getTheme('clear')).toEqual(getTheme('clear', false, false));
    });
  });

  describe('formatTemperature', () => {
    it('should format temperature with °C', () => {
      expect(formatTemperature(25.6)).toBe('26°C');
      expect(formatTemperature(-5.4)).toBe('-5°C');
      expect(formatTemperature(0)).toBe('0°C');
    });

    it('should round temperatures correctly', () => {
      expect(formatTemperature(25.4)).toBe('25°C');
      expect(formatTemperature(25.5)).toBe('26°C');
      expect(formatTemperature(-5.6)).toBe('-6°C');
    });
  });

  describe('formatTime', () => {
    let testDate: Date;

    beforeEach(() => {
      // Create a test date at noon in local time
      testDate = new Date(2025, 0, 1, 12, 0, 0); // 2025-01-01 12:00:00 local time
      jest.useFakeTimers();
      jest.setSystemTime(testDate);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should format regular time correctly', () => {
      const timestamp = Math.floor(testDate.getTime() / 1000);
      expect(formatTime(timestamp)).toBe('12:00 PM');
    });

    it('should show date for midnight', () => {
      // Set to exactly midnight in local time
      const midnightDate = new Date(2025, 0, 1, 0, 0, 0);
      const timestamp = Math.floor(midnightDate.getTime() / 1000);
      expect(formatTime(timestamp)).toBe('Jan 1');
    });
  });

  describe('formatDate', () => {
    let testDate: Date;

    beforeEach(() => {
      testDate = new Date(2025, 0, 1, 12, 0, 0); // 2025-01-01 12:00:00 local time
      jest.useFakeTimers();
      jest.setSystemTime(testDate);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should format timestamp as date', () => {
      const timestamp = Math.floor(testDate.getTime() / 1000);
      expect(formatDate(timestamp)).toBe('Wed, Jan 1');
    });

    it('should handle different days', () => {
      const dates = [
        new Date(2025, 0, 1), // Wednesday, Jan 1
        new Date(2025, 11, 25), // Thursday, Dec 25
        new Date(2025, 6, 4), // Friday, Jul 4
      ];

      const expected = ['Wed, Jan 1', 'Thu, Dec 25', 'Fri, Jul 4'];

      dates.forEach((date, index) => {
        const timestamp = Math.floor(date.getTime() / 1000);
        expect(formatDate(timestamp)).toBe(expected[index]);
      });
    });
  });

  describe('capitalizeWords', () => {
    it('should capitalize first letter of each word', () => {
      expect(capitalizeWords('hello world')).toBe('Hello World');
      expect(capitalizeWords('clear sky')).toBe('Clear Sky');
      expect(capitalizeWords('scattered clouds')).toBe('Scattered Clouds');
    });

    it('should handle already capitalized words', () => {
      expect(capitalizeWords('Hello World')).toBe('Hello World');
      expect(capitalizeWords('HELLO WORLD')).toBe('HELLO WORLD');
    });

    it('should handle empty string', () => {
      expect(capitalizeWords('')).toBe('');
    });
  });
});
