import { mockCurrentWeather, mockForecast } from '../mocks';
import type { ForecastResponse } from '../../types/weather';
const dt = Date.parse('2026-10-31T00:00:00Z') / 1000;
export const adaptiveForecast: ForecastResponse = {
  ...mockForecast,
  hourly: Array.from({ length: 48 }, (_, i) => ({
    ...mockCurrentWeather,
    dt: dt + i * 3600,
    dt_txt: '',
    pop: 0,
    wind: { speed: 0, deg: 0, gust: 0 },
    air_quality: { chn: 0, usa: 0 },
    rain: { '1h': 0 },
    snow: undefined,
  })),
  daily: Array.from({ length: 7 }, (_, i) => ({
    ...mockCurrentWeather,
    dt: dt + i * 86400,
    dt_txt: '',
    pop: 0,
    rain: 0,
    snow: 0,
  })),
};
