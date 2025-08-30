const { describe, expect, it, beforeEach } = require('@jest/globals');
const { weatherService } = require('../../services/weatherService');

// Import types
import type { LocationCoords, OneCallResponse } from '../../types/weather';
import type { FetchMock } from 'jest-fetch-mock';

// Get the global fetch mock
const fetch = global.fetch as unknown as FetchMock;

// Mock the apiLogger
jest.mock('../../services/apiLogger', () => ({
  apiLogger: {
    logRequest: jest.fn(),
  },
}));

describe('WeatherService', () => {
  const mockCoords: LocationCoords = {
    latitude: 40.7128,
    longitude: -74.0060,
  };

  const mockOneCallResponse: OneCallResponse = {
    lat: 40.7128,
    lon: -74.0060,
    timezone: 'America/New_York',
    timezone_offset: -14400,
    current: {
      dt: 1630000000,
      sunrise: 1629979200,
      sunset: 1630027800,
      temp: 25,
      feels_like: 26,
      pressure: 1015,
      humidity: 60,
      dew_point: 15,
      uvi: 5.2,
      clouds: 75,
      visibility: 10000,
      wind_speed: 5,
      wind_deg: 180,
      wind_gust: 8,
      weather: [
        {
          id: 803,
          main: 'Clouds',
          description: 'broken clouds',
          icon: '04d',
        },
      ],
    },
    hourly: [
      {
        dt: 1630000000,
        temp: 25,
        feels_like: 26,
        pressure: 1015,
        humidity: 60,
        dew_point: 15,
        uvi: 5.2,
        clouds: 75,
        visibility: 10000,
        wind_speed: 5,
        wind_deg: 180,
        wind_gust: 8,
        weather: [
          {
            id: 803,
            main: 'Clouds',
            description: 'broken clouds',
            icon: '04d',
          },
        ],
        pop: 0.2,
      },
    ],
    daily: [
      {
        dt: 1630000000,
        sunrise: 1629979200,
        sunset: 1630027800,
        moonrise: 1629990000,
        moonset: 1630038000,
        moon_phase: 0.5,
        summary: "Partly cloudy throughout the day",
        temp: {
          day: 25,
          min: 20,
          max: 28,
          night: 22,
          eve: 24,
          morn: 21,
        },
        feels_like: {
          day: 26,
          night: 23,
          eve: 25,
          morn: 22,
        },
        pressure: 1015,
        humidity: 60,
        dew_point: 15,
        wind_speed: 5,
        wind_deg: 180,
        wind_gust: 8,
        weather: [
          {
            id: 803,
            main: 'Clouds',
            description: 'broken clouds',
            icon: '04d',
          },
        ],
        clouds: 75,
        pop: 0.2,
        uvi: 5.2,
      },
    ],
  };

  beforeEach(() => {
    // Reset all fetch mocks before each test
    fetch.resetMocks();
  });

  describe('getWeatherData', () => {
    it('should fetch and transform weather data successfully', async () => {
      // Mock the fetch response
      fetch.mockResponseOnce(JSON.stringify(mockOneCallResponse));

      const result = await weatherService.getWeatherData(mockCoords);

      // Check if fetch was called with correct URL
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`lat=${mockCoords.latitude}&lon=${mockCoords.longitude}`)
      );

      // Verify the transformed current weather data
      expect(result.currentWeather).toEqual(expect.objectContaining({
        coord: {
          lon: mockOneCallResponse.lon,
          lat: mockOneCallResponse.lat,
        },
        weather: mockOneCallResponse.current.weather,
        main: {
          temp: mockOneCallResponse.current.temp,
          feels_like: mockOneCallResponse.current.feels_like,
          temp_min: mockOneCallResponse.daily[0].temp.min,
          temp_max: mockOneCallResponse.daily[0].temp.max,
          pressure: mockOneCallResponse.current.pressure,
          humidity: mockOneCallResponse.current.humidity,
        },
      }));

      // Verify the transformed forecast data
      const { forecast } = result;
      
      // Test the basic structure
      expect(forecast).toEqual({
        cod: '200',
        message: 0,
        cnt: forecast.hourly.length,
        city: {
          id: 0,
          name: '',
          coord: {
            lat: mockOneCallResponse.lat,
            lon: mockOneCallResponse.lon,
          },
          country: '',
          population: 0,
          timezone: mockOneCallResponse.timezone_offset,
          sunrise: mockOneCallResponse.current.sunrise,
          sunset: mockOneCallResponse.current.sunset,
        },
        hourly: [
          {
            dt: mockOneCallResponse.hourly[0].dt,
            main: {
              temp: mockOneCallResponse.hourly[0].temp,
              feels_like: mockOneCallResponse.hourly[0].feels_like,
              temp_min: mockOneCallResponse.hourly[0].temp,
              temp_max: mockOneCallResponse.hourly[0].temp,
              pressure: mockOneCallResponse.hourly[0].pressure,
              humidity: mockOneCallResponse.hourly[0].humidity,
            },
            weather: mockOneCallResponse.hourly[0].weather,
            clouds: {
              all: mockOneCallResponse.hourly[0].clouds,
            },
            wind: {
              speed: mockOneCallResponse.hourly[0].wind_speed,
              deg: mockOneCallResponse.hourly[0].wind_deg,
              gust: mockOneCallResponse.hourly[0].wind_gust,
            },
            visibility: mockOneCallResponse.hourly[0].visibility,
            pop: mockOneCallResponse.hourly[0].pop,
            dt_txt: expect.any(String),
          },
        ],
        daily: [
          {
            dt: mockOneCallResponse.daily[0].dt,
            main: {
              temp: mockOneCallResponse.daily[0].temp.day,
              feels_like: mockOneCallResponse.daily[0].feels_like.day,
              temp_min: mockOneCallResponse.daily[0].temp.min,
              temp_max: mockOneCallResponse.daily[0].temp.max,
              pressure: mockOneCallResponse.daily[0].pressure,
              humidity: mockOneCallResponse.daily[0].humidity,
            },
            weather: mockOneCallResponse.daily[0].weather,
            clouds: {
              all: mockOneCallResponse.daily[0].clouds,
            },
            wind: {
              speed: mockOneCallResponse.daily[0].wind_speed,
              deg: mockOneCallResponse.daily[0].wind_deg,
              gust: mockOneCallResponse.daily[0].wind_gust,
            },
            pop: mockOneCallResponse.daily[0].pop,
            dt_txt: expect.any(String),
          },
        ],
      });
    });

    it('should throw error when API key is not configured', async () => {
      // Temporarily set API key to invalid value
      const originalApiKey = weatherService.getApiKey();
      weatherService.setApiKey('your_openweathermap_api_key_here');

      await expect(weatherService.getWeatherData(mockCoords))
        .rejects
        .toThrow('OpenWeatherMap API key not configured');

      // Restore API key
      weatherService.setApiKey(originalApiKey);
    });

    it('should throw error when API key is empty', async () => {
      // Temporarily set API key to empty string
      const originalApiKey = weatherService.getApiKey();
      weatherService.setApiKey('');

      await expect(weatherService.getWeatherData(mockCoords))
        .rejects
        .toThrow('OpenWeatherMap API key not configured');

      // Restore API key
      weatherService.setApiKey(originalApiKey);
    });

    it('should handle API errors', async () => {
      // Mock a failed API response
      fetch.mockResponseOnce(JSON.stringify({}), {
        status: 404,
        statusText: 'Not Found'
      });

      await expect(weatherService.getWeatherData(mockCoords))
        .rejects
        .toThrow('Weather API error: 404 Not Found');
    });

    it('should handle network errors', async () => {
      // Mock a network error
      fetch.mockRejectOnce(new Error('Network error'));

      await expect(weatherService.getWeatherData(mockCoords))
        .rejects
        .toThrow('Network error');
    });
  });

  describe('getCurrentWeather and getForecast', () => {
    beforeEach(() => {
      fetch.mockResponseOnce(JSON.stringify(mockOneCallResponse));
    });

    it('getCurrentWeather should return current weather data', async () => {
      const result = await weatherService.getCurrentWeather(mockCoords);
      expect(result).toEqual(expect.objectContaining({
        coord: {
          lon: mockOneCallResponse.lon,
          lat: mockOneCallResponse.lat,
        },
        weather: mockOneCallResponse.current.weather,
      }));
    });

    it('getForecast should return forecast data', async () => {
      const result = await weatherService.getForecast(mockCoords);
      expect(result).toEqual(expect.objectContaining({
        cod: '200',
        hourly: expect.any(Array),
        daily: expect.any(Array),
      }));
    });
  });
});
