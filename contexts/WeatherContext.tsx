import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CurrentWeather, ForecastResponse, LocationCoords, WeatherCondition, CaiyunWeatherAlert } from '../types/weather';
import { weatherService } from '../services/weatherService';
import { caiyunService } from '../services/caiyunService';
import { locationService } from '../services/locationService';
import { notificationService } from '../services/notificationService';
import { alertTracker } from '../services/alertTracker';
import { getWeatherCondition, getWeatherTheme, WeatherTheme } from '../utils/weatherTheme';
import { registerBackgroundWeatherTask } from '../services/backgroundWeatherService';
import { saveCurrentWeather, saveForecast, saveWeatherAlerts, saveLastUpdated, loadLastUpdated, saveDarkMode, loadDarkMode, saveRefreshRate, loadRefreshRate, loadCurrentWeather, loadForecast, loadWeatherAlerts } from '../utils/weatherStorage';

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
  lastUpdated: number | null;
  refreshWeather: () => Promise<void>;
  toggleDarkMode: () => void;
  setRefreshRate: (minutes: number) => Promise<void>;
  setCurrentWeather: (weather: CurrentWeather | null) => Promise<void>;
  setForecast: (forecast: ForecastResponse | null) => Promise<void>;
  setWeatherAlerts: (alerts: CaiyunWeatherAlert[]) => Promise<void>;
}

const WeatherContext = createContext<WeatherContextType | undefined>(undefined);

interface WeatherProviderProps {
  children: ReactNode;
}

const DEFAULT_REFRESH_RATE = 15; // 15 minutes

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
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);

  const weatherCondition: WeatherCondition = currentWeather 
    ? getWeatherCondition(currentWeather.weather[0].main)
    : 'clear';

  const theme = getWeatherTheme(weatherCondition, isDarkMode);

  const updateLastUpdatedTime = async () => {
    const now = Date.now();
    setLastUpdated(now);
    try {
      await saveLastUpdated(now);
    } catch (error) {
      console.error('Failed to save last updated time:', error);
    }
  };

  const getLastUpdatedTime = async (): Promise<number | null> => {
    try {
      const time = await loadLastUpdated();
      if (time) {
        setLastUpdated(time);
        return time;
      }
    } catch (error) {
      console.error('Failed to get last updated time:', error);
    }
    return null;
  };

  const shouldAutoRefresh = async (): Promise<boolean> => {
    const lastUpdateTime = await getLastUpdatedTime();
    if (!lastUpdateTime) {
      return true; // No previous update, should refresh
    }

    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateTime;
    const refreshIntervalMs = refreshRate * 60 * 1000; // Convert minutes to milliseconds

    console.log(`⏰ Time since last update: ${Math.round(timeSinceLastUpdate / 1000 / 60)} minutes`);
    console.log(`⏰ Refresh interval: ${refreshRate} minutes`);
    console.log(`⏰ Should auto refresh: ${timeSinceLastUpdate > refreshIntervalMs}`);

    return timeSinceLastUpdate > refreshIntervalMs;
  };

  const fetchWeatherData = async (coords: LocationCoords, trigger: 'manual' | 'auto' | 'tab_switch' | 'app_start' = 'manual') => {
    try {
      setLoading(true);
      setError(null);

      // Fetch current weather and forecast in parallel
      const [weatherData, forecastData] = await Promise.all([
        weatherService.getCurrentWeather(coords, trigger),
        weatherService.getForecast(coords, trigger),
      ]);

      await setCurrentWeatherAndStore(weatherData);
      await setForecastAndStore(forecastData);

      // Update last updated time
      await updateLastUpdatedTime();

      // Get city name
      const city = await locationService.getCityName(coords);
      setCityName(city);

      // Fetch weather alerts (only on manual refresh or app start to avoid too many requests)
      if (trigger === 'manual' || trigger === 'app_start') {
        try {
          console.log('🌩️ Fetching weather alerts from Caiyun API...');
          
          const alertsResponse = await caiyunService.getWeatherAlerts(coords, trigger);
          
          if (alertsResponse.result?.alert?.content && alertsResponse.result.alert.content.length > 0) {
            const alerts = alertsResponse.result.alert.content;
            setWeatherAlerts(alerts);

            // Filter out alerts that have already been notified
            const alertIds = alerts.map(alert => alert.alertId);
            const newAlertIds = await alertTracker.filterNewAlerts(alertIds);
            
            console.log(`📊 Total alerts: ${alerts.length}, New alerts: ${newAlertIds.length}`);

            // Show notifications only for new alerts
            const newAlerts = alerts.filter(alert => newAlertIds.includes(alert.alertId));
            
            for (const alert of newAlerts) {
              console.log('📢 Showing notification for new alert:', alert.title);
              await notificationService.showWeatherAlert(alert);
            }

            // Track all alert IDs to prevent future duplicates
            if (alertIds.length > 0) {
              await alertTracker.addMultipleAlertIds(alertIds);
              console.log(`✅ Tracked ${alertIds.length} alert IDs for duplicate prevention`);
            }
            
            console.log(`✅ Loaded ${alerts.length} weather alerts from Caiyun API (${newAlerts.length} new notifications sent)`);
          } else {
            console.log('ℹ️ No weather alerts found for this location');
            setWeatherAlerts([]);
          }
        } catch (alertError) {
          console.log('⚠️ Weather alerts not available for this location:', alertError);
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
      
      // Check if we should auto-refresh based on last update time
      const shouldRefresh = await shouldAutoRefresh();
      const trigger = isInitialLoad ? 'app_start' : (shouldRefresh ? 'auto' : 'manual');
      
      if (shouldRefresh || isInitialLoad) {
        console.log(`🔄 Auto-refreshing weather data (trigger: ${trigger})`);
        await fetchWeatherData(coords, trigger);
      } else {
        console.log('⏭️ Skipping auto-refresh, data is still fresh');
        // Still get city name if we don't have it
        if (!cityName) {
          const city = await locationService.getCityName(coords);
          setCityName(city);
        }
        setLoading(false);
      }
      
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
      await saveDarkMode(newDarkMode);
    } catch (error) {
      console.error('Failed to save dark mode preference:', error);
    }
  };

  const setRefreshRate = async (minutes: number) => {
    setRefreshRateState(minutes);
    try {
      await saveRefreshRate(minutes);
      
      // Clear existing interval
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
      
      // Set up new interval with the updated rate
      const newInterval = setInterval(() => {
        if (location) {
          fetchWeatherData(location, 'auto');
        }
      }, minutes * 60 * 1000) as unknown as NodeJS.Timeout;
      setRefreshInterval(newInterval);
    } catch (error) {
      console.error('Failed to save refresh rate preference:', error);
    }
  };

  const loadStoredPreferences = async () => {
    try {
      // Load dark mode preference
      const storedDarkMode = await loadDarkMode();
      if (storedDarkMode !== null && storedDarkMode !== undefined) {
        setIsDarkMode(storedDarkMode);
      }

      // Load refresh rate preference
      let rate = DEFAULT_REFRESH_RATE;
      const storedRefreshRate = await loadRefreshRate();
      if (storedRefreshRate !== null && storedRefreshRate !== undefined) {
        rate = storedRefreshRate;
        setRefreshRateState(rate);
      }

      // Load last updated time
      await getLastUpdatedTime();
      return rate;
    } catch (error) {
      console.error('Failed to load stored preferences:', error);
      return DEFAULT_REFRESH_RATE;
    }
  };

  // Load cached weather data on app start
  const loadCachedWeatherData = async () => {
    try {
      const cachedWeather = await loadCurrentWeather();
      if (cachedWeather) {
        setCurrentWeather(cachedWeather);
      }
      const cachedForecast = await loadForecast();
      if (cachedForecast) {
        setForecast(cachedForecast);
      }
      const cachedAlerts = await loadWeatherAlerts();
      if (cachedAlerts) {
        setWeatherAlerts(cachedAlerts);
      }
    } catch (e) {
      console.error('Failed to load cached weather data:', e);
    }
  };

  // Move these outside fetchWeatherData so they're available in the component scope
  const setCurrentWeatherAndStore = async (weather: CurrentWeather | null) => {
    setCurrentWeather(weather);
    try {
      await saveCurrentWeather(weather);
    } catch (e) {
      console.error('Failed to save currentWeather:', e);
    }
  };

  const setForecastAndStore = async (forecast: ForecastResponse | null) => {
    setForecast(forecast);
    try {
      await saveForecast(forecast);
    } catch (e) {
      console.error('Failed to save forecast:', e);
    }
  };

  const setWeatherAlertsAndStore = async (alerts: CaiyunWeatherAlert[]) => {
    setWeatherAlerts(alerts);
    try {
      await saveWeatherAlerts(alerts);
    } catch (e) {
      console.error('Failed to save weatherAlerts:', e);
    }
  };

  useEffect(() => {
    const initializeApp = async () => {
      // Initialize notifications
      notificationService.requestPermissions();

      // Register background weather fetch task
      await registerBackgroundWeatherTask();

      // Load cached weather data first
      await loadCachedWeatherData();

      // Load stored preferences
      const rate = await loadStoredPreferences();

      // Get initial location and weather
      await getCurrentLocation();

      // Set up periodic weather updates with the loaded refresh rate
      const interval = setInterval(() => {
        if (location) {
          fetchWeatherData(location, 'auto');
        }
      }, rate * 60 * 1000) as unknown as NodeJS.Timeout;

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
    lastUpdated,
    refreshWeather,
    toggleDarkMode,
    setRefreshRate,
    setCurrentWeather: setCurrentWeatherAndStore,
    setForecast: setForecastAndStore,
    setWeatherAlerts: setWeatherAlertsAndStore,
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