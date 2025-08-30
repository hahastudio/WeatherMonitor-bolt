import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { GeminiService, type WeatherSummary } from '../../services/geminiService';
import type { CurrentWeather, ForecastResponse, CaiyunWeatherAlert, CaiyunAirQuality } from '../../types/weather';
import type { GenerateContentResponse } from '@google/genai';

// Create mock function with proper type
const mockGenerateContent = jest.fn<() => Promise<GenerateContentResponse>>();

// Mock GoogleGenAI
jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: {
      generateContent: mockGenerateContent
    }
  }))
}));

// Mock the apiLogger
jest.mock('../../services/apiLogger', () => ({
  apiLogger: {
    logRequest: jest.fn(),
  },
}));

describe('GeminiService', () => {
  const mockInput = {
    currentWeather: {
      coord: { lon: 116.4074, lat: 39.9042 },
      weather: [{ id: 800, main: 'Clear', description: '晴天', icon: '01d' }],
      base: 'stations',
      main: {
        temp: 25,
        feels_like: 26,
        temp_min: 20,
        temp_max: 28,
        pressure: 1015,
        humidity: 60,
      },
      visibility: 10000,
      wind: {
        speed: 5,
        deg: 180,
        gust: 8,
      },
      clouds: { all: 0 },
      dt: 1630000000,
      sys: {
        country: 'CN',
        sunrise: 1629979200,
        sunset: 1630027800,
      },
      timezone: 28800,
      id: 1816670,
      name: 'Beijing',
      cod: 200,
    } as CurrentWeather,
    forecast: {
      cod: '200',
      message: 0,
      cnt: 1,
      hourly: [{
        dt: 1630000000,
        main: {
          temp: 25,
          feels_like: 26,
          temp_min: 25,
          temp_max: 25,
          pressure: 1015,
          humidity: 60,
        },
        weather: [{ id: 800, main: 'Clear', description: '晴天', icon: '01d' }],
        clouds: { all: 0 },
        wind: {
          speed: 5,
          deg: 180,
          gust: 8,
        },
        visibility: 10000,
        pop: 0,
        dt_txt: '2021-08-26 17:46:40',
      }],
      daily: [{
        dt: 1630000000,
        main: {
          temp: 25,
          feels_like: 26,
          temp_min: 20,
          temp_max: 28,
          pressure: 1015,
          humidity: 60,
        },
        weather: [{ id: 800, main: 'Clear', description: '晴天', icon: '01d' }],
        clouds: { all: 0 },
        wind: {
          speed: 5,
          deg: 180,
          gust: 8,
        },
        pop: 0,
        dt_txt: '2021-08-26 17:46:40',
      }],
      city: {
        id: 1816670,
        name: 'Beijing',
        coord: { lat: 39.9042, lon: 116.4074 },
        country: 'CN',
        population: 11716620,
        timezone: 28800,
        sunrise: 1629979200,
        sunset: 1630027800,
      },
    } as ForecastResponse,
    alerts: [] as CaiyunWeatherAlert[],
    airQuality: {
      aqi: { chn: 50, usa: 50 },
    } as CaiyunAirQuality,
    cityName: 'Beijing',
  };

  const mockWeatherSummary: WeatherSummary = {
    todayOverview: '今天天气晴朗，气温适宜。',
    alertSummary: null,
    futureWarnings: null,
    recommendations: ['适合户外活动', '注意防晒'],
    mood: 'positive'
  };

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Set default mock implementation
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify(mockWeatherSummary),
      candidates: [{
        content: {
          parts: [{
            text: JSON.stringify(mockWeatherSummary)
          }],
          role: "model"
        },
        finishReason: "STOP",
        index: 0
      }],
      usageMetadata: {
        promptTokenCount: 5,
        candidatesTokenCount: 1128,
        totalTokenCount: 2550,
        promptTokensDetails: [
          {
            modality: "TEXT",
            tokenCount: 5
          }
        ],
        thoughtsTokenCount: 1417
      },
      modelVersion: "gemini-2.5-flash",
      responseId: "mock_response_id_12345"
    } as GenerateContentResponse);

    // Set test API key
    process.env.EXPO_PUBLIC_GEMINI_API_KEY = 'test_api_key';
  });

  describe('generateWeatherSummary', () => {
    it('should generate weather summary successfully', async () => {
      const testGeminiService = new GeminiService('test_api_key');
      const result = await testGeminiService.generateWeatherSummary(mockInput);
      expect(result).toEqual(mockWeatherSummary);
    });

    it('should handle API error', async () => {
      mockGenerateContent.mockRejectedValueOnce(new Error('API Error') as never);

      const testGeminiService = new GeminiService('test_api_key');
      await expect(testGeminiService.generateWeatherSummary(mockInput))
        .rejects
        .toThrow('API Error');
    });

    it('should handle invalid API response', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        text: 'Invalid JSON',
        candidates: [{
          content: {
            parts: [{
              text: 'Invalid JSON'
            }],
            role: "model"
          },
          finishReason: "STOP",
          index: 0
        }],
        modelVersion: "gemini-2.5-flash"
      } as GenerateContentResponse);

      const testGeminiService = new GeminiService('test_api_key');
      const result = await testGeminiService.generateWeatherSummary(mockInput);

      // Should return fallback response
      expect(result).toEqual({
        todayOverview: 'Weather data is available. Check the details below for current conditions.',
        alertSummary: null,
        futureWarnings: null,
        recommendations: ['Check the detailed weather information', 'Stay updated with weather changes'],
        mood: 'neutral'
      });
    });

    it('should throw error when API key is not configured', async () => {
      // Store original API key
      const originalApiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
      process.env.EXPO_PUBLIC_GEMINI_API_KEY = 'your_gemini_api_key_here';

      // Create new instance with invalid API key
      const testGeminiService = new GeminiService('your_gemini_api_key_here');

      await expect(testGeminiService.generateWeatherSummary(mockInput))
        .rejects
        .toThrow('Gemini API key not configured');

      // Restore API key
      process.env.EXPO_PUBLIC_GEMINI_API_KEY = originalApiKey;
    });
  });
});
