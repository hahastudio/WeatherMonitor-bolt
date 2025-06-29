import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CurrentWeather, ForecastResponse, LocationCoords, WeatherCondition, CaiyunWeatherAlert } from '../types/weather';
import { weatherService } from '../services/weatherService';
import { caiyunService } from '../services/caiyunService';
import { locationService } from '../services/locationService';
import { notificationService } from '../services/notificationService';
import { getWeatherCondition, getWeatherTheme, WeatherTheme } from '../utils/weatherTheme';

interface WeatherContextType {
  currentWeather: CurrentWeather | null;
  forecast: ForecastResponse | null;
  weatherAlerts: CaiyunWeatherAlert[];
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
  DISMISSED_ALERTS: '@weather_app_dismissed_alerts',
};

const DEFAULT_REFRESH_RATE = 15; // 15 minutes

// Mock weather alert data for testing - converted to match the updated interface
const MOCK_WEATHER_ALERTS: CaiyunWeatherAlert[] = [
  {
    alertId: "12011641600000_20250629125347",
    title: "滨海新区气象台发布雷电黄色预警/Ⅲ级/较重",
    description: "滨海新区气象台于2025年06月29日12时52分发布雷电黄色预警信号：预计今天下午到夜间，滨海新区所有街镇将有间歇性雷阵雨，雷雨时风力较大，局地短时雨强较大并可能伴有小冰雹，请有关单位和人员做好防范准备。",
    status: "预警中",
    code: "0902",
    province: "天津市",
    city: "天津城区",
    county: "滨海新区",
    location: "天津市滨海新区",
    source: "国家预警信息发布中心",
    pubtimestamp: 1751172827,
    latlon: [39.017809, 117.69641],
    adcode: "120116",
    regionId: "",
    request_status: "ok"
  }
];

export const WeatherProvider: React.FC<WeatherProviderProps> = ({ children }) => {
  const [currentWeather, setCurrentWeather] = useState<CurrentWeather | null>(null);
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [weatherAlerts, setWeatherAlerts] = useState<CaiyunWeatherAlert[]>([]);
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [cityName, setCityName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [refreshRate, setRefreshRateState] = useState<number>(DEFAULT_REFRESH_RATE);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);

  const weatherCondition: WeatherCondition = currentWeather 
    ? getWeatherCondition(currentWeather.weather[0].main)
    : 'clear';

  const theme = getWeatherTheme(weatherCondition, isDarkMode);

  const fetchWeatherData = async (coords: LocationCoords, trigger: 'manual' | 'auto' | 'tab_switch' | 'app_start' = 'manual') => {
    try {
      setLoading(true);
      setError(null);

      // Fetch current weather and forecast in parallel
      const [weatherData, forecastData] = await Promise.all([
        weatherService.getCurrentWeather(coords, trigger),
        weatherService.getForecast(coords, trigger),
      ]);

      setCurrentWeather(weatherData);
      setForecast(forecastData);

      // Get city name
      const city = await locationService.getCityName(coords);
      setCityName(city);

      // Use mock weather alerts for testing (only on manual refresh or app start to avoid too many requests)
      if (trigger === 'manual' || trigger === 'app_start') {
        try {
          console.log('🧪 Using mock weather alerts for testing');
          
          // Simulate API delay
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Use mock data instead of real API call
          const alerts = MOCK_WEATHER_ALERTS;
          setWeatherAlerts(alerts);

          // Show notifications for new alerts
          for (const alert of alerts) {
            console.log('📢 Showing notification for alert:', alert.title);
            await notificationService.showWeatherAlert(alert);
          }
          
          console.log(`✅ Loaded ${alerts.length} mock weather alerts`);
        } catch (alertError) {
          // Alerts API might not be available, continue without errors
          console.log('Weather alerts not available for this location');
          setWeatherAlerts([]);
        }
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
      const trigger = isInitialLoad ? 'app_start' : 'manual';
      await fetchWeatherData(coords, trigger);
      setIsInitialLoad(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get location');
      setLoading(false);
    }
  };

  const refreshWeather = async () => {
    if (location) {
      await fetchWeatherData(location, 'manual');
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
          fetchWeatherData(location, 'auto');
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
      let rate = DEFAULT_REFRESH_RATE;
      if (storedRefreshRate !== null) {
        rate = JSON.parse(storedRefreshRate);
        setRefreshRateState(rate);
      }
      
      return rate;
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
          fetchWeatherData(location, 'auto');
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
    // Update weather when location changes (but don't trigger on initial load)
    if (location && !isInitialLoad) {
      fetchWeatherData(location, 'manual');
    }
  }, [location]);

  const value: WeatherContextType = {
    currentWeather,
    forecast,
    weatherAlerts,
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