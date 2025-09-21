import { jest } from '@jest/globals';
import {
  CurrentWeather,
  ForecastResponse,
  LocationCoords,
} from '../types/weather';
import { WeatherContextType } from '../contexts/WeatherContext';
import { getTheme } from '../utils/weatherTheme';

// Mock Expo's fetch implementation
jest.mock('expo/fetch', () => ({
  fetch: global.fetch,
}));

// Mock Expo's Asset system
jest.mock('expo-asset', () => ({
  Asset: {
    fromModule: jest.fn(() => ({
      downloadAsync: jest.fn(),
      uri: 'test-uri',
    })),
  },
}));

// Mock apiLogger
jest.mock('../services/apiLogger', () => ({
  apiLogger: {
    logRequest: jest.fn(),
  },
}));

export const mockLocation: LocationCoords = {
  latitude: 37.7749,
  longitude: -122.4194,
};

export const mockCurrentWeather: CurrentWeather = {
  coord: { lon: -122.4194, lat: 37.7749 },
  weather: [{ id: 800, main: 'Clear', description: 'clear sky', icon: '01d' }],
  base: 'stations',
  main: {
    temp: 25,
    feels_like: 25,
    temp_min: 20,
    temp_max: 30,
    pressure: 1012,
    humidity: 60,
  },
  visibility: 10000,
  wind: { speed: 10, deg: 180 },
  clouds: { all: 0 },
  dt: Date.now() / 1000,
  sys: {
    type: 1,
    id: 123,
    country: 'US',
    sunrise: 1620000000,
    sunset: 1620050000,
  },
  timezone: -25200,
  id: 5391959,
  name: 'San Francisco',
  cod: 200,
};

export const mockForecast: ForecastResponse = {
  cod: '200',
  message: 0,
  cnt: 40,
  hourly: [],
  daily: [],
  city: {
    id: 5391959,
    name: 'San Francisco',
    coord: { lat: 37.7749, lon: -122.4194 },
    country: 'US',
    population: 871000,
    timezone: -25200,
    sunrise: 1620000000,
    sunset: 1620050000,
  },
};

export const mockWeatherContext: WeatherContextType = {
  currentWeather: mockCurrentWeather,
  forecast: mockForecast,
  location: mockLocation,
  weatherAlerts: [],
  weatherAirQuality: null,
  weatherSummary: null,
  summaryGeneratedAt: null,
  cityName: 'San Francisco',
  refreshLocation: jest.fn() as jest.Mock<() => Promise<void>>,
  loading: false,
  error: null,
  theme: getTheme('clear'),
  weatherCondition: 'clear',
  isDarkMode: false,
  refreshRate: 15,
  lastUpdated: null,
  refreshWeather: jest.fn() as jest.Mock<() => Promise<void>>,
  generateWeatherSummary: jest.fn() as jest.Mock<() => Promise<void>>,
  toggleDarkMode: jest.fn(),
  setRefreshRate: jest.fn() as jest.Mock<(minutes: number) => Promise<void>>,
};
