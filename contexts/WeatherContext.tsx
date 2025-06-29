import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CurrentWeather, ForecastResponse, LocationCoords, WeatherCondition } from '../types/weather';
import { weatherService } from '../services/weatherService';
import { locationService } from '../services/locationService';
import { notificationService } from '../services/notificationService';
import { getWeatherCondition, getWeatherTheme, WeatherTheme } from '../utils/weatherTheme';

interface WeatherContextType {
  currentWeather: CurrentWeather | null;
  forecast: ForecastResponse | null;
  location: LocationCoords | null;
  cityName: string;
  loading: boolean;
  error: string | null;
  theme: WeatherTheme;
  weatherCondition: WeatherCondition;
  isDarkMode: boolean;
  refreshRate: number;
  refreshWeather: () => Promise<void>;
  toggleDarkMode: () => void;
  setRefreshRate: (minutes: number) => Promise<void>;
}

const WeatherContext = createContext<WeatherContextType | undefined>(undefined);

interface WeatherProviderProps {
  children: ReactNode;
}

const STORAGE_KEYS = {
  DARK_MODE: '@weather_app_dark_mode',
  REFRESH_RATE: '@weather_app_refresh_rate',
};

const DEFAULT_REFRESH_RATE = 15; // 15 minutes

export const WeatherProvider: React.FC<WeatherProviderProps> = ({ children }) => {
  const [currentWeather, setCurrentWeather] = useState<CurrentWeather | null>(null);
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [cityName, setCityName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [refreshRate, setRefreshRateState] = useState<number>(DEFAULT_REFRESH_RATE);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  const weatherCondition: WeatherCondition = currentWeather 
    ? getWeatherCondition(currentWeather.weather[0].main)
    : 'clear';

  const theme = getWeatherTheme(weatherCondition, isDarkMode);

  const fetchWeatherData = async (coords: LocationCoords) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch current weather and forecast in parallel
      const [weatherData, forecastData] = await Promise.all([
        weatherService.getCurrentWeather(coords),
        weatherService.getForecast(coords),
      ]);

      setCurrentWeather(weatherData);
      setForecast(forecastData);

      // Get city name
      const city = await locationService.getCityName(coords);
      setCityName(city);

      // Check for weather alerts
      try {
        const alerts = await weatherService.getWeatherAlerts(coords);
        if (alerts.alerts && alerts.alerts.length > 0) {
          for (const alert of alerts.alerts) {
            await notificationService.showWeatherAlert(alert);
          }
        }
      } catch (alertError) {
        // Alerts API might not be available, continue without errors
        console.log('Weather alerts not available for this location');
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch weather data');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const coords = await locationService.getCurrentLocation();
      setLocation(coords);
      await fetchWeatherData(coords);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get location');
      setLoading(false);
    }
  };

  const refreshWeather = async () => {
    if (location) {
      await fetchWeatherData(location);
    } else {
      await getCurrentLocation();
    }
  };

  const toggleDarkMode = async () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.DARK_MODE, JSON.stringify(newDarkMode));
    } catch (error) {
      console.error('Failed to save dark mode preference:', error);
    }
  };

  const setRefreshRate = async (minutes: number) => {
    setRefreshRateState(minutes);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_RATE, JSON.stringify(minutes));
      
      // Clear existing interval
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
      
      // Set up new interval with the updated rate
      const newInterval = setInterval(() => {
        if (location) {
          fetchWeatherData(location);
        }
      }, minutes * 60 * 1000);
      
      setRefreshInterval(newInterval);
    } catch (error) {
      console.error('Failed to save refresh rate preference:', error);
    }
  };

  const loadStoredPreferences = async () => {
    try {
      // Load dark mode preference
      const storedDarkMode = await AsyncStorage.getItem(STORAGE_KEYS.DARK_MODE);
      if (storedDarkMode !== null) {
        setIsDarkMode(JSON.parse(storedDarkMode));
      }

      // Load refresh rate preference
      const storedRefreshRate = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_RATE);
      if (storedRefreshRate !== null) {
        const rate = JSON.parse(storedRefreshRate);
        setRefreshRateState(rate);
        return rate;
      }
      
      return DEFAULT_REFRESH_RATE;
    } catch (error) {
      console.error('Failed to load stored preferences:', error);
      return DEFAULT_REFRESH_RATE;
    }
  };

  useEffect(() => {
    const initializeApp = async () => {
      // Initialize notifications
      notificationService.requestPermissions();

      // Load stored preferences
      const rate = await loadStoredPreferences();

      // Get initial location and weather
      await getCurrentLocation();

      // Set up periodic weather updates with the loaded refresh rate
      const interval = setInterval(() => {
        if (location) {
          fetchWeatherData(location);
        }
      }, rate * 60 * 1000);

      setRefreshInterval(interval);
    };

    initializeApp();

    // Cleanup interval on unmount
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, []);

  useEffect(() => {
    // Update weather when location changes
    if (location) {
      fetchWeatherData(location);
    }
  }, [location]);

  const value: WeatherContextType = {
    currentWeather,
    forecast,
    location,
    cityName,
    loading,
    error,
    theme,
    weatherCondition,
    isDarkMode,
    refreshRate,
    refreshWeather,
    toggleDarkMode,
    setRefreshRate,
  };

  return (
    <WeatherContext.Provider value={value}>
      {children}
    </WeatherContext.Provider>
  );
};

export const useWeather = (): WeatherContextType => {
  const context = useContext(WeatherContext);
  if (context === undefined) {
    throw new Error('useWeather must be used within a WeatherProvider');
  }
  return context;
};