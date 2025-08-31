import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';
import * as weatherStorage from '../../utils/weatherStorage';
import type { CurrentWeather, ForecastResponse, CaiyunWeatherAlert, CaiyunAirQuality, LocationCoords } from '../../types/weather';
import type { WeatherSummary } from '../../services/geminiService';
import type { AlertTracker } from '../../services/alertTracker';
import type { ApiLogEntry } from '../../services/apiLogger';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

describe('Weather Storage', () => {
  beforeEach(() => {
    mockAsyncStorage.clear();
    jest.clearAllMocks();
  });

  describe('Weather Data Storage', () => {
    const mockCurrentWeather: CurrentWeather = {
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
    };

    const mockForecast: ForecastResponse = {
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
        },
        visibility: 10000,
        pop: 0,
        dt_txt: '2021-08-26 17:46:40',
      }],
      daily: [],
      city: {
        id: 1816670,
        name: 'Beijing',
        coord: { lat: 39.9042, lon: 116.4074 },
        country: 'CN',
        population: 11716620,
        timezone: 28800,
        sunrise: 1629979200,
        sunset: 1630027800,
      }
    };

    const mockWeatherAlerts: CaiyunWeatherAlert[] = [{
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
    }];

    const mockAirQuality: CaiyunAirQuality = {
      aqi: { chn: 50, usa: 50 },
    };

    const mockWeatherSummary: WeatherSummary = {
      todayOverview: '今天天气晴朗，气温适宜。',
      alertSummary: null,
      futureWarnings: null,
      recommendations: ['适合户外活动', '注意防晒'],
      mood: 'positive'
    };

    const mockLocation: LocationCoords = {
      latitude: 39.9042,
      longitude: 116.4074,
    };

    describe('currentWeather', () => {
      it('should save and load current weather', async () => {
        await weatherStorage.saveCurrentWeather(mockCurrentWeather);
        const loadedWeather = await weatherStorage.loadCurrentWeather();
        expect(loadedWeather).toEqual(mockCurrentWeather);
      });

      it('should handle null current weather', async () => {
        await weatherStorage.saveCurrentWeather(null);
        const loadedWeather = await weatherStorage.loadCurrentWeather();
        expect(loadedWeather).toBeNull();
      });
    });

    describe('forecast', () => {
      it('should save and load forecast', async () => {
        await weatherStorage.saveForecast(mockForecast);
        const loadedForecast = await weatherStorage.loadForecast();
        expect(loadedForecast).toEqual(mockForecast);
      });

      it('should handle null forecast', async () => {
        await weatherStorage.saveForecast(null);
        const loadedForecast = await weatherStorage.loadForecast();
        expect(loadedForecast).toBeNull();
      });
    });

    describe('weatherAlerts', () => {
      it('should save and load weather alerts', async () => {
        await weatherStorage.saveWeatherAlerts(mockWeatherAlerts);
        const loadedAlerts = await weatherStorage.loadWeatherAlerts();
        expect(loadedAlerts).toEqual(mockWeatherAlerts);
      });

      it('should return empty array when no alerts stored', async () => {
        const loadedAlerts = await weatherStorage.loadWeatherAlerts();
        expect(loadedAlerts).toEqual([]);
      });
    });

    describe('airQuality', () => {
      it('should save and load air quality', async () => {
        await weatherStorage.saveWeatherAirQuality(mockAirQuality);
        const loadedAirQuality = await weatherStorage.loadWeatherAirQuality();
        expect(loadedAirQuality).toEqual(mockAirQuality);
      });

      it('should handle null air quality', async () => {
        const loadedAirQuality = await weatherStorage.loadWeatherAirQuality();
        expect(loadedAirQuality).toBeNull();
      });
    });

    describe('weatherSummary', () => {
      it('should save and load weather summary with timestamp', async () => {
        jest.useFakeTimers().setSystemTime(new Date('2025-08-30'));
        
        await weatherStorage.saveWeatherSummary(mockWeatherSummary);
        const loadedSummary = await weatherStorage.loadWeatherSummary();
        expect(loadedSummary).toEqual({ ...mockWeatherSummary, generatedAt: Date.now() });

        jest.useRealTimers();
      });

      it('should handle null weather summary', async () => {
        await weatherStorage.saveWeatherSummary(null);
        const loadedSummary = await weatherStorage.loadWeatherSummary();
        expect(loadedSummary).toBeNull();
      });
    });

    describe('location', () => {
      it('should save and load location', async () => {
        await weatherStorage.saveLocation(mockLocation);
        const loadedLocation = await weatherStorage.loadLocation();
        expect(loadedLocation).toEqual(mockLocation);
      });

      it('should handle null location', async () => {
        await weatherStorage.saveLocation(null);
        const loadedLocation = await weatherStorage.loadLocation();
        expect(loadedLocation).toBeNull();
      });
    });

    describe('cityName', () => {
      it('should save and load city name', async () => {
        const cityName = 'Beijing';
        await weatherStorage.saveCityName(cityName);
        const loadedCityName = await weatherStorage.loadCityName();
        expect(loadedCityName).toBe(cityName);
      });

      it('should handle null city name', async () => {
        const loadedCityName = await weatherStorage.loadCityName();
        expect(loadedCityName).toBeNull();
      });
    });
  });

  describe('App Preferences Storage', () => {
    describe('lastUpdated', () => {
      it('should save and load last updated timestamp', async () => {
        const timestamp = Date.now();
        await weatherStorage.saveLastUpdated(timestamp);
        const loadedTimestamp = await weatherStorage.loadLastUpdated();
        expect(loadedTimestamp).toBe(timestamp);
      });
    });

    describe('darkMode', () => {
      it('should save and load dark mode setting', async () => {
        await weatherStorage.saveDarkMode(true);
        const isDarkMode = await weatherStorage.loadDarkMode();
        expect(isDarkMode).toBe(true);
      });
    });

    describe('refreshRate', () => {
      it('should save and load refresh rate', async () => {
        const rate = 300000; // 5 minutes
        await weatherStorage.saveRefreshRate(rate);
        const loadedRate = await weatherStorage.loadRefreshRate();
        expect(loadedRate).toBe(rate);
      });
    });
  });

  describe('AlertTracker Storage', () => {
    const mockAlertTracker: AlertTracker = {
      recentAlertIds: ['alertId1', 'alertId2'],
      lastUpdated: Date.now(),
    };

    it('should save and load alert tracker', async () => {
      await weatherStorage.saveAlertTracker(mockAlertTracker);
      const loadedTracker = await weatherStorage.loadAlertTracker();
      expect(loadedTracker).toEqual(mockAlertTracker);
    });

    it('should clear alert tracker', async () => {
      await weatherStorage.clearAlertTracker();
      const loadedTracker = await weatherStorage.loadAlertTracker();
      expect(loadedTracker).toBeNull();
    });
  });

  describe('ApiLogger Storage', () => {
    const mockApiLogs: ApiLogEntry[] = [{
      id: `${Date.now()}-test`,
      timestamp: Date.now(),
      endpoint: 'test-endpoint',
      method: 'GET',
      status: 'success',
      trigger: 'manual',
      responseTime: 100,
      provider: 'caiyun',
    }];

    it('should save and load API logs', async () => {
      await weatherStorage.saveApiLogs(mockApiLogs);
      const loadedLogs = await weatherStorage.loadApiLogs();
      expect(loadedLogs).toEqual(mockApiLogs);
    });

    it('should handle null or empty API logs', async () => {
      const nullLogs = await weatherStorage.loadApiLogs();
      expect(nullLogs).toBeNull();

      await weatherStorage.saveApiLogs([]);
      const loadedLogs = await weatherStorage.loadApiLogs();
      expect(loadedLogs).toEqual([]);
    });

    it('should clear API logs', async () => {
      await weatherStorage.clearApiLogs();
      const loadedLogs = await weatherStorage.loadApiLogs();
      expect(loadedLogs).toBeNull();
    });

  });
});
