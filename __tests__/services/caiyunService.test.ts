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
        air_quality: {
          aqi: {
            chn: 50,
            usa: 50,
          },
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
});
