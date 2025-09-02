import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CurrentWeather,
  ForecastResponse,
  CaiyunWeatherAlert,
  CaiyunAirQuality,
  LocationCoords,
} from '../types/weather';
import type { AlertTracker } from '../services/alertTracker';
import type { ApiLogEntry } from '../services/apiLogger';
import type { WeatherSummary } from '../services/geminiService';

const STORAGE_KEYS = {
  DARK_MODE: '@weather_app_dark_mode',
  REFRESH_RATE: '@weather_app_refresh_rate',
  DISMISSED_ALERTS: '@weather_app_dismissed_alerts',
  LAST_UPDATED: '@weather_app_last_updated',
  CURRENT_WEATHER: '@weather_app_current_weather',
  FORECAST: '@weather_app_forecast',
  WEATHER_ALERTS: '@weather_app_weather_alerts',
  WEATHER_AIR_QUALITY: '@weather_app_weather_air_quality',
  WEATHER_SUMMARY: '@weather_app_weather_summary',
  LOCATION: '@weather_app_location',
  CITY_NAME: '@weather_app_city_name',
};

// Weather data storage
export async function saveCurrentWeather(weather: CurrentWeather | null) {
  if (weather) {
    await AsyncStorage.setItem(
      STORAGE_KEYS.CURRENT_WEATHER,
      JSON.stringify(weather),
    );
  } else {
    await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_WEATHER);
  }
}

export async function saveForecast(forecast: ForecastResponse | null) {
  if (forecast) {
    await AsyncStorage.setItem(STORAGE_KEYS.FORECAST, JSON.stringify(forecast));
  } else {
    await AsyncStorage.removeItem(STORAGE_KEYS.FORECAST);
  }
}

export async function saveWeatherAlerts(alerts: CaiyunWeatherAlert[]) {
  await AsyncStorage.setItem(
    STORAGE_KEYS.WEATHER_ALERTS,
    JSON.stringify(alerts),
  );
}

export async function saveWeatherAirQuality(
  airQuality: CaiyunAirQuality | null,
) {
  await AsyncStorage.setItem(
    STORAGE_KEYS.WEATHER_AIR_QUALITY,
    JSON.stringify(airQuality),
  );
}

export async function saveWeatherSummary(summary: WeatherSummary | null) {
  if (summary) {
    const summaryWithTimestamp = {
      ...summary,
      generatedAt: Date.now(),
    };
    await AsyncStorage.setItem(
      STORAGE_KEYS.WEATHER_SUMMARY,
      JSON.stringify(summaryWithTimestamp),
    );
  } else {
    await AsyncStorage.removeItem(STORAGE_KEYS.WEATHER_SUMMARY);
  }
}

export async function saveLocation(location: LocationCoords | null) {
  if (location) {
    await AsyncStorage.setItem(STORAGE_KEYS.LOCATION, JSON.stringify(location));
  } else {
    await AsyncStorage.removeItem(STORAGE_KEYS.LOCATION);
  }
}

export async function saveCityName(cityName: string) {
  await AsyncStorage.setItem(STORAGE_KEYS.CITY_NAME, cityName);
}

export async function loadCurrentWeather(): Promise<CurrentWeather | null> {
  const data = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_WEATHER);
  return data ? JSON.parse(data) : null;
}

export async function loadForecast(): Promise<ForecastResponse | null> {
  const data = await AsyncStorage.getItem(STORAGE_KEYS.FORECAST);
  return data ? JSON.parse(data) : null;
}

export async function loadWeatherAlerts(): Promise<CaiyunWeatherAlert[]> {
  const data = await AsyncStorage.getItem(STORAGE_KEYS.WEATHER_ALERTS);
  return data ? JSON.parse(data) : [];
}

export async function loadWeatherAirQuality(): Promise<CaiyunAirQuality | null> {
  const data = await AsyncStorage.getItem(STORAGE_KEYS.WEATHER_AIR_QUALITY);
  return data ? JSON.parse(data) : null;
}

export async function loadWeatherSummary(): Promise<
  (WeatherSummary & { generatedAt: number }) | null
> {
  const data = await AsyncStorage.getItem(STORAGE_KEYS.WEATHER_SUMMARY);
  return data ? JSON.parse(data) : null;
}

export async function loadLocation(): Promise<LocationCoords | null> {
  const data = await AsyncStorage.getItem(STORAGE_KEYS.LOCATION);
  return data ? JSON.parse(data) : null;
}

export async function loadCityName(): Promise<string | null> {
  return await AsyncStorage.getItem(STORAGE_KEYS.CITY_NAME);
}

// App preferences storage
export async function saveLastUpdated(timestamp: number) {
  await AsyncStorage.setItem(
    STORAGE_KEYS.LAST_UPDATED,
    JSON.stringify(timestamp),
  );
}

export async function loadLastUpdated(): Promise<number | null> {
  const data = await AsyncStorage.getItem(STORAGE_KEYS.LAST_UPDATED);
  return data ? JSON.parse(data) : null;
}

export async function saveDarkMode(isDark: boolean) {
  await AsyncStorage.setItem(STORAGE_KEYS.DARK_MODE, JSON.stringify(isDark));
}

export async function loadDarkMode(): Promise<boolean | null> {
  const data = await AsyncStorage.getItem(STORAGE_KEYS.DARK_MODE);
  return data ? JSON.parse(data) : null;
}

export async function saveRefreshRate(rate: number) {
  await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_RATE, JSON.stringify(rate));
}

export async function loadRefreshRate(): Promise<number | null> {
  const data = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_RATE);
  return data ? JSON.parse(data) : null;
}

// AlertTracker storage helpers
export async function saveAlertTracker(tracker: AlertTracker) {
  await AsyncStorage.setItem(
    '@weather_app_alert_tracker',
    JSON.stringify(tracker),
  );
}

export async function loadAlertTracker(): Promise<AlertTracker | null> {
  const data = await AsyncStorage.getItem('@weather_app_alert_tracker');
  return data ? JSON.parse(data) : null;
}

export async function clearAlertTracker() {
  await AsyncStorage.removeItem('@weather_app_alert_tracker');
}

// ApiLogger storage helpers
export async function saveApiLogs(logs: ApiLogEntry[]) {
  await AsyncStorage.setItem('@weather_app_api_logs', JSON.stringify(logs));
}

export async function loadApiLogs(): Promise<ApiLogEntry[] | null> {
  const data = await AsyncStorage.getItem('@weather_app_api_logs');
  return data ? JSON.parse(data) : null;
}

export async function clearApiLogs() {
  await AsyncStorage.removeItem('@weather_app_api_logs');
}
