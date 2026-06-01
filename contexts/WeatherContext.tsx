import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import {
  CurrentWeather,
  ForecastResponse,
  LocationCoords,
  WeatherCondition,
  CaiyunWeatherAlert,
  CaiyunAirQuality,
} from '../types/weather';
import { weatherService } from '../services/weatherService';
import { caiyunService } from '../services/caiyunService';
import { locationService } from '../services/locationService';
import { notificationService } from '../services/notificationService';
import { alertTracker } from '../services/alertTracker';
import { geminiService, WeatherSummary } from '../services/geminiService';
import {
  getWeatherCondition,
  getTheme,
  WeatherTheme,
} from '../utils/weatherTheme';
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
  loadCityName,
  acquireFetchLock,
  releaseFetchLock,
} from '../utils/weatherStorage';
import { AppState, AppStateStatus } from 'react-native';

export interface WeatherContextType {
  currentWeather: CurrentWeather | null;
  forecast: ForecastResponse | null;
  weatherAlerts: CaiyunWeatherAlert[];
  weatherAirQuality: CaiyunAirQuality | null;
  weatherSummary: WeatherSummary | null;
  summaryGeneratedAt: number | null;
  location: LocationCoords | null;
  cityName: string;
  refreshLocation: () => Promise<void>;
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
  setRefreshRate: (minutes: number) => Promise<void>;
}

const WeatherContext = createContext<WeatherContextType | undefined>(undefined);

interface WeatherProviderProps {
  children: ReactNode;
}

const DEFAULT_REFRESH_RATE = 15; // 15 minutes

export const WeatherProvider: React.FC<WeatherProviderProps> = ({
  children,
}) => {
  const [currentWeather, setCurrentWeather] = useState<CurrentWeather | null>(
    null,
  );
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [weatherAlerts, setWeatherAlerts] = useState<CaiyunWeatherAlert[]>([]);
  const [weatherAirQuality, setWeatherAirQuality] =
    useState<CaiyunAirQuality | null>(null);
  const [weatherSummary, setWeatherSummary] = useState<WeatherSummary | null>(
    null,
  );
  const [summaryGeneratedAt, setSummaryGeneratedAt] = useState<number | null>(
    null,
  );
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [cityName, setCityName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [refreshRate, setRefreshRateState] =
    useState<number>(DEFAULT_REFRESH_RATE);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const appState = React.useRef(AppState.currentState);
  let isInitializing = false;

  const weatherCondition: WeatherCondition = currentWeather
    ? getWeatherCondition(currentWeather.weather[0].main)
    : 'clear';

  const theme = getTheme(weatherCondition, isDarkMode);

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
        storedRefreshRate,
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
        loadRefreshRate(),
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
        refreshRate: storedRefreshRate || DEFAULT_REFRESH_RATE,
      };
    } catch (error) {
      console.error('❌ Failed to load data from storage:', error);
      return {
        hasWeatherData: false,
        location: null,
        lastUpdated: null,
        refreshRate: DEFAULT_REFRESH_RATE,
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

  const shouldAutoRefresh = (
    lastUpdateTime: number | null,
    refreshRateMinutes: number,
  ): boolean => {
    if (!lastUpdateTime) {
      console.log('🔄 No previous update time found, should refresh');
      return true; // No previous update, should refresh
    }

    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateTime;
    const refreshIntervalMs = refreshRateMinutes * 60 * 1000; // Convert minutes to milliseconds

    console.log(
      `⏰ Time since last update: ${Math.round(timeSinceLastUpdate / 1000 / 60)} minutes`,
    );
    console.log(`⏰ Refresh interval: ${refreshRateMinutes} minutes`);
    console.log(
      `⏰ Should auto refresh: ${timeSinceLastUpdate > refreshIntervalMs}`,
    );

    return timeSinceLastUpdate > refreshIntervalMs;
  };

  const shouldRegenerateSummary = (
    summaryGeneratedTime: number | null,
  ): boolean => {
    if (!summaryGeneratedTime) {
      console.log(
        '🔄 No previous summary generated time found, should regenerate',
      );
      return true; // No previous summary, should generate
    }

    const now = Date.now();
    const timeSinceGenerated = now - summaryGeneratedTime;
    const summaryRefreshInterval = 4 * 60 * 60 * 1000; // 4 hours

    return timeSinceGenerated > summaryRefreshInterval;
  };

  const generateWeatherSummary = async () => {
    if (!currentWeather || !forecast) {
      console.log('⚠️ Cannot generate summary: missing weather data');
      return;
    }

    try {
      console.log('🤖 Generating AI weather summary...');
      const summary = await geminiService.generateWeatherSummary(
        {
          currentWeather,
          forecast,
          alerts: weatherAlerts,
          airQuality: weatherAirQuality,
          cityName,
        },
        'manual',
      );

      await saveDataToStorage({ summary });
      console.log('✅ Weather summary generated and saved');
    } catch (error) {
      console.error('❌ Failed to generate weather summary:', error);
    }
  };

  const fetchWeatherData = async (
    coords: LocationCoords,
    trigger: 'manual' | 'auto' | 'tab_switch' | 'app_start' = 'manual',
  ) => {
    // Attempt to acquire the fetch lock with retries
    const clientId = trigger === 'manual' ? 'foreground_manual' : 'foreground';
    let acquired = false;
    let retries = 0;
    const maxRetries = 5;
    const sleep = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    while (!acquired && retries < maxRetries) {
      acquired = await acquireFetchLock(clientId);
      if (!acquired) {
        console.log(
          `🔒 [Context] Fetch lock held by another thread, retrying in 2 seconds... (retry ${retries + 1}/${maxRetries})`,
        );
        await sleep(2000);
        retries++;
      }
    }

    if (!acquired) {
      console.log(
        '❌ [Context] Could not acquire fetch lock after retries, skipping fetch to prevent redundant calls.',
      );
      return;
    }

    try {
      // Double check if data was recently refreshed by another context (e.g. background fetch) while we were waiting
      if (trigger !== 'manual') {
        const lastUpdatedTime = await loadLastUpdated();
        const storedRefreshRate =
          (await loadRefreshRate()) || DEFAULT_REFRESH_RATE;
        if (!shouldAutoRefresh(lastUpdatedTime, storedRefreshRate)) {
          console.log(
            '✅ [Context] Weather data was recently updated by another context, skipping actual API fetch.',
          );
          await loadDataFromStorage();
          return;
        }
      }

      if (loading) {
        console.log('🔄 Already fetching weather data, skipping...');
        return;
      }
      console.log(`🔄 Fetching weather data (trigger: ${trigger})...`);
      setLoading(true);
      setError(null);

      // Use the new One Call API to get both current weather and forecast in a single call
      const { currentWeather: weatherData, forecast: forecastData } =
        await weatherService.getWeatherData(coords, trigger);

      // Save all data to storage and update UI
      // We will update this again after Caiyun data is merged, but save first to have something
      await saveDataToStorage({
        weather: weatherData,
        forecast: forecastData,
      });

      let alerts = weatherAlerts;
      var hasNewAlerts = false;

      try {
        console.log('🌩️ Fetching weather data from Caiyun API...');

        const caiyunResponse = await caiyunService.getWeatherData(
          coords,
          trigger,
        );

        // Merge Caiyun Current Weather
        console.log('✅ Merging Caiyun current weather data');
        const mergedWeather = caiyunService.mergeCaiyunCurrentWeather(
          weatherData,
          caiyunResponse,
        );
        Object.assign(weatherData, mergedWeather);
        await saveDataToStorage({ weather: weatherData });

        // Merge Caiyun Hourly Forecast (Next 4 hours)
        console.log('✅ Merging Caiyun hourly forecast data (next 4 hours)');
        const mergedForecastHourly = caiyunService.mergeCaiyunHourlyForecast(
          forecastData.hourly,
          caiyunResponse,
        );
        forecastData.hourly = mergedForecastHourly;
        await saveDataToStorage({ forecast: forecastData });

        if (
          caiyunResponse.result?.alert?.content &&
          caiyunResponse.result.alert.content.length > 0
        ) {
          alerts = caiyunResponse.result.alert.content;

          // Save alerts to storage and update UI
          await saveDataToStorage({ alerts });

          // Filter out alerts that have already been notified
          const alertIds = alerts.map((alert) => alert.alertId);
          const newAlertIds = await alertTracker.filterNewAlerts(alertIds);

          console.log(
            `📊 Total alerts: ${alerts.length}, New alerts: ${newAlertIds.length}`,
          );

          // Show notifications only for new alerts
          const newAlerts = alerts.filter((alert) =>
            newAlertIds.includes(alert.alertId),
          );
          if (newAlerts.length > 0) {
            hasNewAlerts = true;
          }

          for (const alert of newAlerts) {
            console.log('📢 Showing notification for new alert:', alert.title);
            await notificationService.showWeatherAlert(alert);
          }

          // Track all alert IDs to prevent future duplicates
          if (alertIds.length > 0) {
            await alertTracker.addMultipleAlertIds(alertIds);
            console.log(
              `✅ Tracked ${alertIds.length} alert IDs for duplicate prevention`,
            );
          }

          console.log(
            `✅ Loaded ${alerts.length} weather alerts from Caiyun API (${newAlerts.length} new notifications sent)`,
          );
        } else {
          console.log('ℹ️ No weather alerts found for this location');
          await saveDataToStorage({ alerts: [] });
        }

        if (caiyunResponse?.result?.realtime?.air_quality?.aqi) {
          const airQuality: CaiyunAirQuality =
            caiyunResponse.result.realtime.air_quality;
          await saveDataToStorage({ airQuality });
          setWeatherAirQuality(airQuality);
          console.log('✅ Loaded weather air quality data from Caiyun API');
        }
      } catch (alertError) {
        console.log(
          '⚠️ Weather alerts not available for this location:',
          alertError,
        );
        await saveDataToStorage({ alerts: [] });
      }

      // Save last updated time
      const now = Date.now();
      await saveDataToStorage({ lastUpdated: now });
      setLastUpdated(now);

      // Auto-generate weather summary if needed (only on manual refresh)
      if (trigger === 'manual') {
        try {
          console.log('🤖 Generating weather summary...');
          const summary = await geminiService.generateWeatherSummary(
            {
              currentWeather: weatherData,
              forecast: forecastData,
              alerts: alerts,
              airQuality: weatherAirQuality,
              cityName: cityName,
            },
            trigger,
          );

          await saveDataToStorage({ summary });
          console.log('✅ Weather summary generated and saved');
        } catch (summaryError) {
          console.log('⚠️ Failed to generate weather summary:', summaryError);
        }
      }

      console.log('✅ Weather data fetch completed successfully');
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch weather data';
      console.error('❌ Weather data fetch failed:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
      await releaseFetchLock();
    }
  };

  const getCurrentLocation = async () => {
    try {
      console.log('📍 Getting current location...');
      const coords = await locationService.getCurrentLocation();
      console.log('📍 Location obtained:', coords);
      return coords;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to get location';
      console.error('❌ Location fetch failed:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  };

  const refreshLocation = async () => {
    try {
      console.log('🔄 Refreshing location...');
      const coords = await getCurrentLocation();
      if (coords) {
        await saveDataToStorage({ location: coords });
        setLocation(coords);
        const city = await locationService.getCityName(coords);
        await saveDataToStorage({ cityName: city });
        setCityName(city);
        console.log('✅ Location refreshed successfully');
      } else {
        console.log('⚠️ No location available to refresh');
      }
    } catch (error) {
      console.error('❌ Failed to refresh location:', error);
      setError('Failed to refresh location');
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

  const setRefreshRate = async (minutes: number) => {
    try {
      await saveRefreshRate(minutes);
      console.log(`✅ Refresh rate updated to ${minutes} minutes`);
    } catch (error) {
      console.error('❌ Failed to save refresh rate:', error);
    }
  };

  const initWeatherData = async () => {
    // Step 1: Load all data from storage first
    const storageData = await loadDataFromStorage();

    // Step 2: Get current location
    let coords = storageData.location;
    if (!coords) {
      await refreshLocation();
      coords = await loadLocation();
    }

    // Step 3: Check if we need to refresh data
    const needsRefresh =
      !storageData.hasWeatherData ||
      shouldAutoRefresh(storageData.lastUpdated, storageData.refreshRate);

    if (needsRefresh && coords) {
      console.log('🔄 Data needs refresh, fetching new data...');
      await fetchWeatherData(coords, 'app_start');
    } else {
      console.log('✅ Using cached data, no refresh needed');
      setLoading(false);
    }
  };

  // Function to handle AppState changes
  const handleAppStateChange = useCallback(
    async (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('App has come to the foreground!');
        if (!isInitializing) {
          await initWeatherData();
        }
      }
      appState.current = nextAppState;
      console.log('AppState', appState.current);
    },
    [],
  );

  // Initialize app on mount
  useEffect(() => {
    const initializeApp = async () => {
      try {
        isInitializing = true;
        console.log('🚀 Initializing WeatherMonitor NT...');

        // Initialize notifications
        await notificationService.requestPermissions();

        // Register background weather fetch task
        await initBackgroundFetch();

        await initWeatherData();

        console.log('🚀 WeatherMonitor NT initialization completed');
      } catch (error) {
        console.error('❌ App initialization failed:', error);
        setError('Failed to initialize app');
      } finally {
        isInitializing = false;
      }
    };

    initializeApp();
    // Set up AppState listener
    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );

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
    refreshLocation,
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
    setRefreshRate,
  };

  return (
    <WeatherContext.Provider value={value}>{children}</WeatherContext.Provider>
  );
};

export const useWeather = (): WeatherContextType => {
  const context = useContext(WeatherContext);
  if (context === undefined) {
    throw new Error('useWeather must be used within a WeatherProvider');
  }
  return context;
};
