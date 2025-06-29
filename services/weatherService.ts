import { CurrentWeather, ForecastResponse, LocationCoords } from '../types/weather';
import { apiLogger } from './apiLogger';

const API_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

class WeatherService {
  async getCurrentWeather(coords: LocationCoords, trigger: 'manual' | 'auto' | 'tab_switch' | 'app_start' = 'manual'): Promise<CurrentWeather> {
    if (!API_KEY || API_KEY === 'your_openweathermap_api_key_here') {
      throw new Error('OpenWeatherMap API key not configured. Please add your API key to .env file.');
    }

    const url = `${BASE_URL}/weather?lat=${coords.latitude}&lon=${coords.longitude}&appid=${API_KEY}&units=metric`;
    const startTime = Date.now();
    
    try {
      const response = await fetch(url);
      const responseTime = Date.now() - startTime;
      
      if (!response.ok) {
        await apiLogger.logRequest(
          'getCurrentWeather',
          'GET',
          'error',
          trigger,
          responseTime,
          `${response.status} ${response.statusText}`
        );
        throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      await apiLogger.logRequest('getCurrentWeather', 'GET', 'success', trigger, responseTime);
      return data;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      await apiLogger.logRequest(
        'getCurrentWeather',
        'GET',
        'error',
        trigger,
        responseTime,
        error instanceof Error ? error.message : 'Unknown error'
      );
      throw error;
    }
  }

  async getForecast(coords: LocationCoords, trigger: 'manual' | 'auto' | 'tab_switch' | 'app_start' = 'manual'): Promise<ForecastResponse> {
    if (!API_KEY || API_KEY === 'your_openweathermap_api_key_here') {
      throw new Error('OpenWeatherMap API key not configured. Please add your API key to .env file.');
    }

    const url = `${BASE_URL}/forecast?lat=${coords.latitude}&lon=${coords.longitude}&appid=${API_KEY}&units=metric`;
    const startTime = Date.now();
    
    try {
      const response = await fetch(url);
      const responseTime = Date.now() - startTime;
      
      if (!response.ok) {
        await apiLogger.logRequest(
          'getForecast',
          'GET',
          'error',
          trigger,
          responseTime,
          `${response.status} ${response.statusText}`
        );
        throw new Error(`Forecast API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      await apiLogger.logRequest('getForecast', 'GET', 'success', trigger, responseTime);
      return data;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      await apiLogger.logRequest(
        'getForecast',
        'GET',
        'error',
        trigger,
        responseTime,
        error instanceof Error ? error.message : 'Unknown error'
      );
      throw error;
    }
  }
}

export const weatherService = new WeatherService();