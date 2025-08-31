import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import {
  WeatherTheme,
  getWeatherCondition,
  getWeatherTheme,
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

  describe('getWeatherTheme', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return light theme during daytime', () => {
      jest.setSystemTime(new Date('2025-08-31T12:00:00')); // noon
      const theme = getWeatherTheme('clear', false);
      expect(theme.background).toBe('#87CEEB'); // light theme sky blue
    });

    it('should return dark theme during nighttime', () => {
      jest.setSystemTime(new Date('2025-08-31T20:00:00')); // 8 PM
      const theme = getWeatherTheme('clear', false);
      expect(theme.background).toBe('#0F1419'); // dark theme background
    });

    it('should return dark theme when isDarkMode is true regardless of time', () => {
      jest.setSystemTime(new Date('2025-08-31T12:00:00')); // noon
      const theme = getWeatherTheme('clear', true);
      expect(theme.background).toBe('#0F1419'); // dark theme background
    });

    it('should return appropriate theme for each weather condition', () => {
      jest.setSystemTime(new Date('2025-08-31T12:00:00')); // noon
      const conditions: Array<'clear' | 'clouds' | 'rain' | 'snow' | 'thunderstorm' | 'drizzle' | 'mist'> = [
        'clear', 'clouds', 'rain', 'snow', 'thunderstorm', 'drizzle', 'mist'
      ];

      conditions.forEach(condition => {
        const theme = getWeatherTheme(condition, false);
        expect(theme).toHaveProperty('primary');
        expect(theme).toHaveProperty('secondary');
        expect(theme).toHaveProperty('background');
        expect(theme).toHaveProperty('surface');
        expect(theme).toHaveProperty('text');
        expect(theme).toHaveProperty('textSecondary');
        expect(theme).toHaveProperty('accent');
        expect(theme).toHaveProperty('gradientStart');
        expect(theme).toHaveProperty('gradientEnd');
      });
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

      const expected = [
        'Wed, Jan 1',
        'Thu, Dec 25',
        'Fri, Jul 4'
      ];

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
