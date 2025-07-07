import { fetch } from 'expo/fetch';
import { CurrentWeather, ForecastResponse, LocationCoords, HourlyForecast } from '../types/weather';
import { apiLogger } from './apiLogger';

const API_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/3.0/onecall';

interface OneCallResponse {
  lat: number;
  lon: number;
  timezone: string;
  timezone_offset: number;
  current: {
    dt: number;
    sunrise: number;
    sunset: number;
    temp: number;
    feels_like: number;
    pressure: number;
    humidity: number;
    dew_point: number;
    uvi: number;
    clouds: number;
    visibility: number;
    wind_speed: number;
    wind_deg: number;
    wind_gust?: number;
    weather: Array<{
      id: number;
      main: string;
      description: string;
      icon: string;
    }>;
    rain?: {
      '1h': number;
    };
    snow?: {
      '1h': number;
    };
  };
  hourly: Array<{
    dt: number;
    temp: number;
    feels_like: number;
    pressure: number;
    humidity: number;
    dew_point: number;
    uvi: number;
    clouds: number;
    visibility: number;
    wind_speed: number;
    wind_deg: number;
    wind_gust?: number;
    weather: Array<{
      id: number;
      main: string;
      description: string;
      icon: string;
    }>;
    pop: number;
    rain?: {
      '1h': number;
    };
    snow?: {
      '1h': number;
    };
  }>;
  daily: Array<{
    dt: number;
    sunrise: number;
    sunset: number;
    moonrise: number;
    moonset: number;
    moon_phase: number;
    summary: string;
    temp: {
      day: number;
      min: number;
      max: number;
      night: number;
      eve: number;
      morn: number;
    };
    feels_like: {
      day: number;
      night: number;
      eve: number;
      morn: number;
    };
    pressure: number;
    humidity: number;
    dew_point: number;
    wind_speed: number;
    wind_deg: number;
    wind_gust?: number;
    weather: Array<{
      id: number;
      main: string;
      description: string;
      icon: string;
    }>;
    clouds: number;
    pop: number;
    rain?: number;
    snow?: number;
    uvi: number;
  }>;
}

class WeatherService {
  private transformOneCallToCurrentWeather(data: OneCallResponse): CurrentWeather {
    return {
      coord: {
        lon: data.lon,
        lat: data.lat,
      },
      weather: data.current.weather,
      base: 'stations',
      main: {
        temp: data.current.temp,
        feels_like: data.current.feels_like,
        temp_min: data.daily[0]?.temp.min || data.current.temp,
        temp_max: data.daily[0]?.temp.max || data.current.temp,
        pressure: data.current.pressure,
        humidity: data.current.humidity,
      },
      visibility: data.current.visibility,
      wind: {
        speed: data.current.wind_speed,
        deg: data.current.wind_deg,
        gust: data.current.wind_gust,
      },
      clouds: {
        all: data.current.clouds,
      },
      rain: data.current.rain,
      snow: data.current.snow,
      dt: data.current.dt,
      sys: {
        country: '', // Not available in One Call API
        sunrise: data.current.sunrise,
        sunset: data.current.sunset,
      },
      timezone: data.timezone_offset,
      id: 0, // Not available in One Call API
      name: '', // Will be set by location service
      cod: 200,
    };
  }

  private transformOneCallToForecast(data: OneCallResponse): ForecastResponse {
    // Convert hourly data to 3-hour intervals to match the old API format
    const hourlyForecasts: HourlyForecast[] = [];
    
    // Take every 3rd hour to simulate 3-hour intervals (up to 40 entries for 5 days)
    for (let i = 0; i < Math.min(data.hourly.length, 40); i += 3) {
      const hourly = data.hourly[i];
      if (!hourly) continue;

      hourlyForecasts.push({
        dt: hourly.dt,
        main: {
          temp: hourly.temp,
          feels_like: hourly.feels_like,
          temp_min: hourly.temp,
          temp_max: hourly.temp,
          pressure: hourly.pressure,
          humidity: hourly.humidity,
        },
        weather: hourly.weather,
        clouds: {
          all: hourly.clouds,
        },
        wind: {
          speed: hourly.wind_speed,
          deg: hourly.wind_deg,
          gust: hourly.wind_gust,
        },
        visibility: hourly.visibility,
        pop: hourly.pop,
        dt_txt: new Date(hourly.dt * 1000).toISOString().replace('T', ' ').slice(0, 19),
        rain: hourly.rain ? { '3h': hourly.rain['1h'] * 3 } : undefined,
        snow: hourly.snow ? { '3h': hourly.snow['1h'] * 3 } : undefined,
      });
    }

    return {
      cod: '200',
      message: 0,
      cnt: hourlyForecasts.length,
      list: hourlyForecasts,
      city: {
        id: 0,
        name: '',
        coord: {
          lat: data.lat,
          lon: data.lon,
        },
        country: '',
        population: 0,
        timezone: data.timezone_offset,
        sunrise: data.current.sunrise,
        sunset: data.current.sunset,
      },
    };
  }

  async getWeatherData(coords: LocationCoords, trigger: 'manual' | 'auto' | 'tab_switch' | 'app_start' = 'manual'): Promise<{
    currentWeather: CurrentWeather;
    forecast: ForecastResponse;
  }> {
    if (!API_KEY || API_KEY === 'your_openweathermap_api_key_here') {
      throw new Error('OpenWeatherMap API key not configured. Please add your API key to .env file.');
    }

    const url = `${BASE_URL}?lat=${coords.latitude}&lon=${coords.longitude}&appid=${API_KEY}&units=metric&exclude=minutely,alerts`;
    const startTime = Date.now();
    
    try {
      console.log('🌐 Loading weather data with One Call API 3.0...');
      const response = await fetch(url);
      const responseTime = Date.now() - startTime;
      
      if (!response.ok) {
        console.log(`❌ Error fetching weather data: ${response.status} ${response.statusText}`);
        await apiLogger.logRequest(
          'getWeatherData (One Call 3.0)',
          'GET',
          'error',
          trigger,
          responseTime,
          `${response.status} ${response.statusText}`,
          'openweather'
        );
        throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
      }
      
      const data: OneCallResponse = await response.json();
      console.log('✅ Got weather data successfully with One Call API 3.0');
      await apiLogger.logRequest('getWeatherData (One Call 3.0)', 'GET', 'success', trigger, responseTime, undefined, 'openweather');
      
      // Transform the One Call API response to match our existing interfaces
      const currentWeather = this.transformOneCallToCurrentWeather(data);
      const forecast = this.transformOneCallToForecast(data);
      
      return {
        currentWeather,
        forecast,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      await apiLogger.logRequest(
        'getWeatherData (One Call 3.0)',
        'GET',
        'error',
        trigger,
        responseTime,
        error instanceof Error ? error.message : 'Unknown error',
        'openweather'
      );
      throw error;
    }
  }

  // Legacy methods for backward compatibility
  async getCurrentWeather(coords: LocationCoords, trigger: 'manual' | 'auto' | 'tab_switch' | 'app_start' = 'manual'): Promise<CurrentWeather> {
    const { currentWeather } = await this.getWeatherData(coords, trigger);
    return currentWeather;
  }

  async getForecast(coords: LocationCoords, trigger: 'manual' | 'auto' | 'tab_switch' | 'app_start' = 'manual'): Promise<ForecastResponse> {
    const { forecast } = await this.getWeatherData(coords, trigger);
    return forecast;
  }
}

export const weatherService = new WeatherService();