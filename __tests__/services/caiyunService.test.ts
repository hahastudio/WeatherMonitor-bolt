import { describe, expect, it, beforeEach } from '@jest/globals';
import { caiyunService } from '../../services/caiyunService';
import type { FetchMock } from 'jest-fetch-mock';
import type { CaiyunWeatherResponse } from '../../types/weather';
import { setApiKeys } from '../../services/apiKeyManager';

// Get the global fetch mock
const fetch = global.fetch as unknown as FetchMock;

// Mock the apiLogger
jest.mock('../../services/apiLogger', () => ({
  apiLogger: {
    logRequest: jest.fn(),
  },
}));

describe('CaiyunService', () => {
  const mockCoords = {
    latitude: 39.9042,
    longitude: 116.4074,
  };

  const mockWeatherResponse: CaiyunWeatherResponse = {
    status: 'ok',
    api_version: 'v2.5',
    api_status: 'active',
    lang: 'zh_CN',
    unit: 'metric',
    tzshift: 28800,
    timezone: 'Asia/Shanghai',
    server_time: 1630000000,
    location: [116.4074, 39.9042],
    result: {
      alert: {
        status: 'ok',
        content: [
          {
            alertId: 'BJ20250830001',
            title: '北京市气象台发布大风蓝色预警',
            description: '大风蓝色预警',
            status: 'active',
            code: '0301',
            province: '北京市',
            city: '北京市',
            county: '海淀区',
            location: '海淀区',
            source: '北京市气象台',
            pubtimestamp: 1630000000,
            latlon: [116.4074, 39.9042],
            adcode: '110108',
            regionId: 'BJ110108',
            request_status: 'ok',
            level: '蓝色',
            type: '大风',
            publishTime: '2025-08-30 12:00:00',
            startTime: '2025-08-30 12:00:00',
            endTime: '2025-08-31 12:00:00',
          },
        ],
      },
      realtime: {
        temperature: 25,
        humidity: 0.6,
        cloudrate: 0.5,
        skycon: 'CLEAR_DAY',
        visibility: 10,
        dswrf: 100,
        wind: {
          speed: 5,
          direction: 180,
        },
        pressure: 1013,
        apparent_temperature: 26,
        precipitation: {
          local: {
            status: 'ok',
            intensity: 0,
            datasource: 'radar',
          },
          nearest: {
            status: 'ok',
            distance: 100,
            intensity: 0,
          },
        },
        air_quality: {
          aqi: {
            chn: 50,
            usa: 50,
          },
        },
      },
      hourly: {
        description: 'Clear',
        precipitation: [{ datetime: '2025-08-30 12:00', value: 0 }],
        temperature: [{ datetime: '2025-08-30 12:00', value: 25 }],
        humidity: [{ datetime: '2025-08-30 12:00', value: 0.6 }],
        cloudrate: [{ datetime: '2025-08-30 12:00', value: 0.5 }],
        skycon: [{ datetime: '2025-08-30 12:00', value: 'CLEAR_DAY' }],
        visibility: [{ datetime: '2025-08-30 12:00', value: 10 }],
        dswrf: [{ datetime: '2025-08-30 12:00', value: 100 }],
        wind: [{ datetime: '2025-08-30 12:00', speed: 5, direction: 180 }],
        pressure: [{ datetime: '2025-08-30 12:00', value: 1013 }],
        air_quality: {
          aqi: [
            {
              datetime: '2025-08-30 12:00',
              value: {
                chn: 50,
                usa: 60,
              },
            },
          ],
          pm25: [{ datetime: '2025-08-30 12:00', value: 20 }],
        },
      },
    },
  };

  beforeEach(() => {
    // Suppress console logs
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    fetch.resetMocks();
    // Set default API key for tests
    setApiKeys({
      openWeatherMap: 'test_owm_key',
      caiyun: 'test_api_key',
      gemini: 'test_gemini_key',
    });
  });

  afterEach(() => {
    // Restore console logs
    jest.restoreAllMocks();
  });

  describe('getWeatherData', () => {
    it('should fetch and return weather data successfully', async () => {
      // Mock the fetch response
      fetch.mockResponseOnce(JSON.stringify(mockWeatherResponse));

      const result = await caiyunService.getWeatherData(mockCoords);

      // Check if fetch was called with correct URL
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(
          `${mockCoords.longitude},${mockCoords.latitude}/weather`,
        ),
      );

      // Verify the response
      expect(result).toEqual(mockWeatherResponse);
    });

    it('should throw error when API key is not configured', async () => {
      // Set an invalid API key
      setApiKeys({
        openWeatherMap: 'test_owm_key',
        caiyun: '',
        gemini: 'test_gemini_key',
      });

      await expect(caiyunService.getWeatherData(mockCoords)).rejects.toThrow(
        'Caiyun API key not configured',
      );
    });

    it('should handle API errors', async () => {
      // Mock a failed API response
      fetch.mockResponseOnce(JSON.stringify({}), {
        status: 404,
        statusText: 'Not Found',
      });

      await expect(caiyunService.getWeatherData(mockCoords)).rejects.toThrow(
        'Caiyun API error: 404 Not Found',
      );
    });

    it('should handle network errors', async () => {
      // Mock a network error
      fetch.mockRejectOnce(new Error('Network error'));

      await expect(caiyunService.getWeatherData(mockCoords)).rejects.toThrow(
        'Network error',
      );
    });
  });

  describe('mergeCaiyunCurrentWeather', () => {
    it('should merge Caiyun realtime data while preserving OWM fields', () => {
      const baseWeather: any = {
        coord: { lon: 116.4074, lat: 39.9042 },
        weather: [
          { id: 800, main: 'Clear', description: 'clear sky', icon: '01d' },
        ],
        base: 'stations',
        main: {
          temp: 20,
          temp_min: 18,
          temp_max: 22,
          feels_like: 20,
        },
        visibility: 10000,
        wind: {
          speed: 10,
          deg: 180,
          gust: 15,
        },
        clouds: { all: 0 },
        dt: 1630000000,
        sys: {
          type: 1,
          id: 7322,
          country: 'CN',
          sunrise: 1630000000,
          sunset: 1630000000 + 36000,
        },
        timezone: 28800,
        id: 1816670,
        name: 'Beijing',
        cod: 200,
      };

      const result = caiyunService.mergeCaiyunCurrentWeather(
        baseWeather,
        mockWeatherResponse,
      );

      // Should update temp and feels_like from Caiyun (25, 26)
      expect(result.main.temp).toBe(25);
      expect(result.main.feels_like).toBe(26);

      // Should preserve temp_min and temp_max from base
      expect(result.main.temp_min).toBe(18);
      expect(result.main.temp_max).toBe(22);

      // Should preserve wind from base
      expect(result.wind).toEqual(baseWeather.wind);

      // Should preserve sys from base
      expect(result.sys).toEqual(baseWeather.sys);
    });
  });

  describe('mergeCaiyunHourlyForecast', () => {
    it('should merge Caiyun hourly data while preserving OWM fields', () => {
      // Setup matching time
      const baseTime = 1630000000 + 3600;
      const baseHourly: any[] = [
        {
          dt: baseTime,
          main: {
            temp: 20,
            temp_min: 18,
            temp_max: 22,
            feels_like: 20,
          },
          wind: {
            speed: 10,
            deg: 180,
            gust: 15,
          },
          weather: [{ id: 800, main: 'Clear' }],
        },
      ];

      // Convert baseTime to ISO string for mock response to match logic
      // new Date(baseTime * 1000).toISOString() might produce '2021-08-26T18:46:40.000Z'
      // Caiyun service parses string to timestamp.
      // So if we put '2021-08-26 18:46' it should work.
      const matchTimeStr = new Date(baseTime * 1000).toISOString();

      // Adjust mockWeatherResponse hourly datetime to match baseHourly dt for merging
      const adjustedMockWeatherResponse = {
        ...mockWeatherResponse,
        result: {
          ...mockWeatherResponse.result!,
          hourly: {
            ...mockWeatherResponse.result!.hourly,
            temperature: [{ datetime: matchTimeStr, value: 25 }],
            humidity: [{ datetime: matchTimeStr, value: 0.6 }],
            cloudrate: [{ datetime: matchTimeStr, value: 0.5 }],
            skycon: [{ datetime: matchTimeStr, value: 'CLEAR_DAY' }],
            visibility: [{ datetime: matchTimeStr, value: 10 }],
            dswrf: [{ datetime: matchTimeStr, value: 100 }],
            wind: [{ datetime: matchTimeStr, speed: 5, direction: 180 }],
            precipitation: [{ datetime: matchTimeStr, value: 0 }],
            pressure: [{ datetime: matchTimeStr, value: 1013 }],
            air_quality: {
              aqi: [
                {
                  datetime: matchTimeStr,
                  value: { chn: 100, usa: 150 },
                },
              ],
              pm25: [],
            },
          },
        },
      } as unknown as CaiyunWeatherResponse;

      const result = caiyunService.mergeCaiyunHourlyForecast(
        baseHourly,
        adjustedMockWeatherResponse,
      );

      expect(result).toHaveLength(1);
      const mergedItem = result[0];

      // Should update temp from Caiyun (25)
      expect(mergedItem.main.temp).toBe(25);

      // Should preserve temp_min, temp_max, feels_like from base
      expect(mergedItem.main.temp_min).toBe(18);
      expect(mergedItem.main.temp_max).toBe(22);
      expect(mergedItem.main.feels_like).toBe(20);

      // Should preserve wind from base
      expect(mergedItem.wind).toEqual(baseHourly[0].wind);

      // Should update weather description and icon from Caiyun
      expect(mergedItem.weather[0].main).toBe('Clear');
      expect(mergedItem.weather[0].icon).toBe('01d');

      // Should have merged AQI data
      expect(mergedItem.air_quality).toEqual({
        chn: 100,
        usa: 150,
      });
    });

    it('should merge only AQI data for hours beyond the first 4', () => {
      // Setup 5 hours of data
      const baseTime = 1630000000;
      const baseHourly: any[] = [];
      const caiyunHourlyMock: any = {
        temperature: [],
        humidity: [],
        cloudrate: [],
        skycon: [],
        visibility: [],
        dswrf: [],
        wind: [],
        precipitation: [],
        pressure: [],
        air_quality: { aqi: [], pm25: [] },
      };

      for (let i = 0; i < 5; i++) {
        const t = baseTime + 3600 * i;
        const ts = new Date(t * 1000).toISOString();

        baseHourly.push({
          dt: t,
          main: { temp: 20 }, // Base temp
          wind: { speed: 10 },
          weather: [{ main: 'Clear' }],
        });

        // Mock Caiyun data for this hour
        caiyunHourlyMock.temperature.push({ datetime: ts, value: 30 }); // Caiyun temp
        caiyunHourlyMock.humidity.push({ datetime: ts, value: 0.8 });
        caiyunHourlyMock.cloudrate.push({ datetime: ts, value: 0.5 });
        caiyunHourlyMock.skycon.push({ datetime: ts, value: 'RAIN' });
        caiyunHourlyMock.visibility.push({ datetime: ts, value: 5 });
        caiyunHourlyMock.dswrf.push({ datetime: ts, value: 0 });
        caiyunHourlyMock.wind.push({ datetime: ts, speed: 20, direction: 0 });
        caiyunHourlyMock.precipitation.push({ datetime: ts, value: 10 });
        caiyunHourlyMock.pressure.push({ datetime: ts, value: 1000 });
        caiyunHourlyMock.air_quality.aqi.push({
          datetime: ts,
          value: { chn: 80, usa: 90 },
        });
      }

      const adjustedMockWeatherResponse = {
        ...mockWeatherResponse,
        result: {
          ...mockWeatherResponse.result,
          hourly: caiyunHourlyMock,
        },
      };

      const result = caiyunService.mergeCaiyunHourlyForecast(
        baseHourly,
        adjustedMockWeatherResponse,
      );

      // Check 1st item (should have Caiyun temp)
      expect(result[0].main.temp).toBe(30);
      expect(result[0].air_quality).toEqual({ chn: 80, usa: 90 });

      // Check 5th item (should have Base temp but Caiyun AQI)
      const lastItem = result[4];
      expect(lastItem.main.temp).toBe(20); // Base temp preserved
      expect(lastItem.air_quality).toEqual({ chn: 80, usa: 90 }); // AQI merged
    });

    it('should return base hourly data if Caiyun data is missing or empty', () => {
      const baseHourly: any[] = [
        {
          dt: 1630000000,
          main: { temp: 20 },
          weather: [{ main: 'Clear' }],
        },
      ];
      const emptyCaiyunResponse = {
        ...mockWeatherResponse,
        hourly: { temperature: [] },
      } as any;

      const result = caiyunService.mergeCaiyunHourlyForecast(
        baseHourly,
        emptyCaiyunResponse,
      );
      expect(result).toEqual(baseHourly);
    });
  });

  describe('transformToCurrentWeather', () => {
    it('should transform Caiyun realtime data to CurrentWeather format', () => {
      const result = caiyunService.transformToCurrentWeather(
        mockWeatherResponse,
        mockCoords,
      );

      expect(result).toBeTruthy();
      expect(result?.main.temp).toBe(25);
      expect(result?.main.humidity).toBe(60); // 0.6 * 100
      expect(result?.weather[0].main).toBe('Clear');
      expect(result?.weather[0].icon).toBe('01d');
      expect(result?.coord).toEqual({
        lon: mockCoords.longitude,
        lat: mockCoords.latitude,
      });
    });

    it('should return null if realtime data is missing', () => {
      const emptyResponse = { ...mockWeatherResponse, result: {} } as any;
      const result = caiyunService.transformToCurrentWeather(
        emptyResponse,
        mockCoords,
      );
      expect(result).toBeNull();
    });
  });

  describe('transformToHourlyForecast', () => {
    it('should transform Caiyun hourly data to HourlyForecast format', () => {
      const result =
        caiyunService.transformToHourlyForecast(mockWeatherResponse);

      expect(result).toHaveLength(1);
      expect(result[0].main.temp).toBe(25);
      expect(result[0].weather[0].main).toBe('Clear');
      expect(result[0].dt_txt).toBe('2025-08-30 12:00');
    });

    it('should return empty array if hourly data is missing', () => {
      const emptyResponse = { ...mockWeatherResponse, result: {} } as any;
      const result = caiyunService.transformToHourlyForecast(emptyResponse);
      expect(result).toEqual([]);
    });
  });
});
