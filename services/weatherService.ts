import { CurrentWeather, ForecastResponse, AlertsResponse, LocationCoords } from '../types/weather';

const API_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

class WeatherService {
  async getCurrentWeather(coords: LocationCoords): Promise<CurrentWeather> {
    if (!API_KEY || API_KEY === 'your_openweathermap_api_key_here') {
      throw new Error('OpenWeatherMap API key not configured. Please add your API key to .env file.');
    }

    const url = `${BASE_URL}/weather?lat=${coords.latitude}&lon=${coords.longitude}&appid=${API_KEY}&units=metric`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }

  async getForecast(coords: LocationCoords): Promise<ForecastResponse> {
    if (!API_KEY || API_KEY === 'your_openweathermap_api_key_here') {
      throw new Error('OpenWeatherMap API key not configured. Please add your API key to .env file.');
    }

    const url = `${BASE_URL}/forecast?lat=${coords.latitude}&lon=${coords.longitude}&appid=${API_KEY}&units=metric`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Forecast API error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }

  async getWeatherAlerts(coords: LocationCoords): Promise<AlertsResponse> {
    if (!API_KEY || API_KEY === 'your_openweathermap_api_key_here') {
      throw new Error('OpenWeatherMap API key not configured. Please add your API key to .env file.');
    }

    const url = `${BASE_URL}/onecall?lat=${coords.latitude}&lon=${coords.longitude}&appid=${API_KEY}&exclude=minutely,hourly,daily`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      // Alerts API might not be available for all locations
      return {};
    }
    
    return response.json();
  }
}

export const weatherService = new WeatherService();