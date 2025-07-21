import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { CurrentWeather, ForecastResponse, LocationCoords, WeatherCondition, CaiyunWeatherAlert, CaiyunAirQuality } from '../types/weather';
import { weatherService } from '../services/weatherService';
import { caiyunService } from '../services/caiyunService';
import { locationService } from '../services/locationService';
import { notificationService } from '../services/notificationService';
import { alertTracker } from '../services/alertTracker';
import { geminiService, WeatherSummary } from '../services/geminiService';
import { getWeatherCondition, getWeatherTheme, WeatherTheme } from '../utils/weatherTheme';
import { initBackgroundFetch } from '../services/backgroundWeatherService';
import { 
  saveCurrentWeather, 
  saveForecast, 
  saveWeatherAlerts,
  saveWeatherAirQuality,
  saveWeatherSummary,
  saveLastUpdated, 
  loadLastUpdated, 
  saveDarkMode, 
  loadDarkMode, 
  saveRefreshRate, 
  loadRefreshRate, 
  loadCurrentWeather, 
  loadForecast, 
  loadWeatherAlerts,
  loadWeatherAirQuality,
  loadWeatherSummary,
  saveLocation,
  loadLocation,
  saveCityName,
  loadCityName
} from '../utils/weatherStorage';
import { AppState, AppStateStatus } from 'react-native';

interface WeatherContextType {
  currentWeather: CurrentWeather | null;
  forecast: ForecastResponse | null;
  weatherAlerts: CaiyunWeatherAlert[];
  weatherAirQuality: CaiyunAirQuality | null;
  weatherSummary: WeatherSummary | null;
  summaryGeneratedAt: number | null;
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
  generateWeatherSummary: () => Promise<void>;
  toggleDarkMode: () => void;
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
  const [weatherAirQuality, setWeatherAirQuality] = useState<CaiyunAirQuality | null>(null);
  const [weatherSummary, setWeatherSummary] = useState<WeatherSummary | null>(null);
  const [summaryGeneratedAt, setSummaryGeneratedAt] = useState<number | null>(null);
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [cityName, setCityName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [refreshRate, setRefreshRateState] = useState<number>(DEFAULT_REFRESH_RATE);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const appState = React.useRef(AppState.currentState);

  const weatherCondition: WeatherCondition = currentWeather 
    ? getWeatherCondition(currentWeather.weather[0].main)
    : 'clear';

  const theme = getWeatherTheme(weatherCondition, isDarkMode);

  // Load all data from storage and update UI
  const loadDataFromStorage = async () => {
    try {
      console.log('📱 Loading data from storage...');
      
      // Load all data in parallel
      const [
        storedWeather,
        storedForecast,
        storedAlerts,
        storedAirQuality,
        storedSummary,
        storedLocation,
        storedCityName,
        storedLastUpdated,
        storedDarkMode,
        storedRefreshRate
      ] = await Promise.all([
        loadCurrentWeather(),
        loadForecast(),
        loadWeatherAlerts(),
        loadWeatherAirQuality(),
        loadWeatherSummary(),
        loadLocation(),
        loadCityName(),
        loadLastUpdated(),
        loadDarkMode(),
        loadRefreshRate()
      ]);

      // Update state with stored data
      if (storedWeather) {
        setCurrentWeather(storedWeather);
        console.log('✅ Loaded current weather from storage');
      }
      
      if (storedForecast) {
        setForecast(storedForecast);
        console.log('✅ Loaded forecast from storage');
      }
      
      if (storedAlerts) {
        setWeatherAlerts(storedAlerts);
        console.log('✅ Loaded weather alerts from storage');
      }

      if (storedAirQuality) {
        setWeatherAirQuality(storedAirQuality);
        console.log('✅ Loaded weather air quality from storage');
      }

      if (storedSummary) {
        setWeatherSummary(storedSummary);
        setSummaryGeneratedAt(storedSummary.generatedAt);
        console.log('✅ Loaded weather summary from storage');
      }
      
      if (storedLocation) {
        setLocation(storedLocation);
        console.log('✅ Loaded location from storage');
      }
      
      if (storedCityName) {
        setCityName(storedCityName);
        console.log('✅ Loaded city name from storage');
      }
      
      if (storedLastUpdated) {
        setLastUpdated(storedLastUpdated);
        console.log('✅ Loaded last updated time from storage');
      }
      
      if (storedDarkMode !== null && storedDarkMode !== undefined) {
        setIsDarkMode(storedDarkMode);
        console.log('✅ Loaded dark mode preference from storage');
      }
      
      if (storedRefreshRate !== null && storedRefreshRate !== undefined) {
        setRefreshRateState(storedRefreshRate);
        console.log('✅ Loaded refresh rate from storage');
      }

      console.log('📱 All data loaded from storage successfully');
      return {
        hasWeatherData: !!(storedWeather && storedForecast),
        location: storedLocation,
        lastUpdated: storedLastUpdated,
        refreshRate: storedRefreshRate || DEFAULT_REFRESH_RATE
      };
    } catch (error) {
      console.error('❌ Failed to load data from storage:', error);
      return {
        hasWeatherData: false,
        location: null,
        lastUpdated: null,
        refreshRate: DEFAULT_REFRESH_RATE
      };
    }
  };

  // Save data to storage and update UI
  const saveDataToStorage = async (data: {
    weather?: CurrentWeather | null;
    forecast?: ForecastResponse | null;
    alerts?: CaiyunWeatherAlert[];
    airQuality?: CaiyunAirQuality | null;
    summary?: WeatherSummary | null;
    location?: LocationCoords | null;
    cityName?: string;
    lastUpdated?: number;
  }) => {
    try {
      console.log('💾 Saving data to storage...');
      
      const savePromises = [];
      
      if (data.weather !== undefined) {
        savePromises.push(saveCurrentWeather(data.weather));
        setCurrentWeather(data.weather);
      }
      
      if (data.forecast !== undefined) {
        savePromises.push(saveForecast(data.forecast));
        setForecast(data.forecast);
      }
      
      if (data.alerts !== undefined) {
        savePromises.push(saveWeatherAlerts(data.alerts));
        setWeatherAlerts(data.alerts);
      }

      if (data.airQuality !== undefined) {
        savePromises.push(saveWeatherAirQuality(data.airQuality));
        setWeatherAirQuality(data.airQuality);
      }

      if (data.summary !== undefined) {
        savePromises.push(saveWeatherSummary(data.summary));
        setWeatherSummary(data.summary);
        setSummaryGeneratedAt(data.summary ? Date.now() : null);
      }
      
      if (data.location !== undefined) {
        savePromises.push(saveLocation(data.location));
        setLocation(data.location);
      }
      
      if (data.cityName !== undefined) {
        savePromises.push(saveCityName(data.cityName));
        setCityName(data.cityName);
      }
      
      if (data.lastUpdated !== undefined) {
        savePromises.push(saveLastUpdated(data.lastUpdated));
        setLastUpdated(data.lastUpdated);
      }
      
      await Promise.all(savePromises);
      console.log('💾 Data saved to storage and UI updated');
    } catch (error) {
      console.error('❌ Failed to save data to storage:', error);
    }
  };

  const shouldAutoRefresh = (lastUpdateTime: number | null, refreshRateMinutes: number): boolean => {
    if (!lastUpdateTime) {
      return true; // No previous update, should refresh
    }

    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateTime;
    const refreshIntervalMs = refreshRateMinutes * 60 * 1000; // Convert minutes to milliseconds

    console.log(`⏰ Time since last update: ${Math.round(timeSinceLastUpdate / 1000 / 60)} minutes`);
    console.log(`⏰ Refresh interval: ${refreshRateMinutes} minutes`);
    console.log(`⏰ Should auto refresh: ${timeSinceLastUpdate > refreshIntervalMs}`);

    return timeSinceLastUpdate > refreshIntervalMs;
  };

  const shouldRegenerateSummary = (summaryGeneratedTime: number | null): boolean => {
    if (!summaryGeneratedTime) {
      return true; // No previous summary, should generate
    }

    const now = Date.now();
    const timeSinceGenerated = now - summaryGeneratedTime;
    const summaryRefreshInterval = 30 * 60 * 1000; // 30 minutes

    return timeSinceGenerated > summaryRefreshInterval;
  };

  const generateWeatherSummary = async () => {
    if (!currentWeather || !forecast) {
      console.log('⚠️ Cannot generate summary: missing weather data');
      return;
    }

    try {
      console.log('🤖 Generating AI weather summary...');
      const summary = await geminiService.generateWeatherSummary({
        currentWeather,
        forecast,
        alerts: weatherAlerts,
        cityName,
      }, 'manual');

      await saveDataToStorage({ summary });
      console.log('✅ Weather summary generated and saved');
    } catch (error) {
      console.error('❌ Failed to generate weather summary:', error);
    }
  };

  const fetchWeatherData = async (coords: LocationCoords, trigger: 'manual' | 'auto' | 'tab_switch' | 'app_start' = 'manual') => {
    try {
      console.log(`🔄 Fetching weather data (trigger: ${trigger})...`);
      setLoading(true);
      setError(null);

      // Use the new One Call API to get both current weather and forecast in a single call
      const { currentWeather: weatherData, forecast: forecastData } = await weatherService.getWeatherData(coords, trigger);

      // Get city name
      const city = await locationService.getCityName(coords);

      // Update last updated time
      const now = Date.now();

      // Save all data to storage and update UI
      await saveDataToStorage({
        weather: weatherData,
        forecast: forecastData,
        location: coords,
        cityName: city,
        lastUpdated: now
      });

      let alerts = weatherAlerts;
      
      try {
        console.log('🌩️ Fetching weather alerts from Caiyun API...');
        
        const caiyunResponse = await caiyunService.getWeatherData(coords, trigger);
        
        if (caiyunResponse.result?.alert?.content && caiyunResponse.result.alert.content.length > 0) {
            alerts = caiyunResponse.result.alert.content;
          
          // Save alerts to storage and update UI
          await saveDataToStorage({ alerts });

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
          await saveDataToStorage({ alerts: [] });
        }

        if (caiyunResponse?.result?.realtime?.air_quality?.aqi) {
          const airQuality: CaiyunAirQuality = caiyunResponse.result.realtime.air_quality;
          await saveDataToStorage({ airQuality });
          setWeatherAirQuality(airQuality);
          console.log('✅ Loaded weather air quality data from Caiyun API');
        }

      } catch (alertError) {
        console.log('⚠️ Weather alerts not available for this location:', alertError);
        await saveDataToStorage({ alerts: [] });
      }

      // Auto-generate weather summary if needed (only on manual refresh or app start)
      if ((trigger === 'manual' || trigger === 'app_start') && shouldRegenerateSummary(summaryGeneratedAt)) {
        try {
          console.log('🤖 Auto-generating weather summary...');
          const summary = await geminiService.generateWeatherSummary({
            currentWeather: weatherData,
            forecast: forecastData,
            alerts: alerts,
            airQuality: weatherAirQuality,
            cityName: city,
          }, trigger);

          await saveDataToStorage({ summary });
          console.log('✅ Weather summary auto-generated and saved');
        } catch (summaryError) {
          console.log('⚠️ Failed to auto-generate weather summary:', summaryError);
        }
      }

      console.log('✅ Weather data fetch completed successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch weather data';
      console.error('❌ Weather data fetch failed:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      console.log('📍 Getting current location...');
      const coords = await locationService.getCurrentLocation();
      console.log('📍 Location obtained:', coords);
      return coords;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get location';
      console.error('❌ Location fetch failed:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  };

  const refreshWeather = async () => {
    try {
      let coords = location;
      
      // If we don't have location, get it first
      if (!coords) {
        coords = await getCurrentLocation();
      }
      
      if (coords) {
        await fetchWeatherData(coords, 'manual');
      }
    } catch (err) {
      console.error('❌ Manual refresh failed:', err);
    }
  };

  const toggleDarkMode = async () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    try {
      await saveDarkMode(newDarkMode);
      console.log('✅ Dark mode preference saved');
    } catch (error) {
      console.error('❌ Failed to save dark mode preference:', error);
    }
  };

  const initWeatherData = async () => {
    // Step 1: Load all data from storage first
    const storageData = await loadDataFromStorage();
    
    // Step 2: Get current location
    let coords = storageData.location;
    if (!coords) {
      try {
        coords = await getCurrentLocation();
        if (coords) {
          await saveDataToStorage({ location: coords });
        }
      } catch (locationError) {
        console.error('❌ Failed to get location:', locationError);
        setLoading(false);
        setIsInitialized(true);
        return;
      }
    }

    // Step 3: Check if we need to refresh data
    const needsRefresh = !storageData.hasWeatherData || 
                        shouldAutoRefresh(storageData.lastUpdated, storageData.refreshRate);

    if (needsRefresh && coords) {
      console.log('🔄 Data needs refresh, fetching new data...');
      await fetchWeatherData(coords, 'app_start');
    } else {
      console.log('✅ Using cached data, no refresh needed');
      setLoading(false);
    }
  }

  // Function to handle AppState changes
  const handleAppStateChange = useCallback(async (nextAppState: AppStateStatus) => {
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      console.log('App has come to the foreground! Reloading data...');
      await initWeatherData();
    }
    appState.current = nextAppState;
    console.log('AppState', appState.current);
  }, []);

  // Initialize app on mount
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 Initializing WeatherMonitor NT...');
        
        // Initialize notifications
        notificationService.requestPermissions();

        // Register background weather fetch task
        await initBackgroundFetch();

        await initWeatherData();

        setIsInitialized(true);
        console.log('🚀 WeatherMonitor NT initialization completed');
      } catch (error) {
        console.error('❌ App initialization failed:', error);
        setError('Failed to initialize app');
        setLoading(false);
        setIsInitialized(true);
      }
    };

    initializeApp();
    // Set up AppState listener
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Cleanup interval on unmount
    return () => {
      if (subscription) {
        subscription.remove();
      }
      console.log('🧹 Cleaned up WeatherMonitor NT resources');
    };
  }, []);

  const value: WeatherContextType = {
    currentWeather,
    forecast,
    weatherAlerts,
    weatherAirQuality,
    weatherSummary,
    summaryGeneratedAt,
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
    generateWeatherSummary,
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