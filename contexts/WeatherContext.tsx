import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
  refreshWeather: () => Promise<void>;
  toggleDarkMode: () => void;
}

const WeatherContext = createContext<WeatherContextType | undefined>(undefined);

interface WeatherProviderProps {
  children: ReactNode;
}

export const WeatherProvider: React.FC<WeatherProviderProps> = ({ children }) => {
  const [currentWeather, setCurrentWeather] = useState<CurrentWeather | null>(null);
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [cityName, setCityName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

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

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  useEffect(() => {
    // Initialize notifications
    notificationService.requestPermissions();

    // Get initial location and weather
    getCurrentLocation();

    // Set up periodic weather updates (every 10 minutes)
    const interval = setInterval(() => {
      if (location) {
        fetchWeatherData(location);
      }
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(interval);
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
    refreshWeather,
    toggleDarkMode,
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