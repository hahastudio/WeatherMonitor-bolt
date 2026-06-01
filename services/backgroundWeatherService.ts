import BackgroundFetch from 'react-native-background-fetch';
import { Platform, AppState } from 'react-native';
import { weatherService } from './weatherService';
import { caiyunService } from './caiyunService';
import { locationService } from './locationService';
import { notificationService } from './notificationService';
import { alertTracker } from './alertTracker';
import { LocationCoords } from '../types/weather';
import {
  saveCurrentWeather,
  saveForecast,
  saveWeatherAlerts,
  saveWeatherAirQuality,
  saveLastUpdated,
  loadRefreshRate,
  loadLastUpdated,
  loadLocation,
  loadApiKeys,
  acquireFetchLock,
  releaseFetchLock,
} from '../utils/weatherStorage';
import { setApiKeys } from './apiKeyManager';

export async function weatherTask(taskId: string) {
  console.log('🔄 Background weather fetch event triggered:', taskId);

  if (Platform.OS !== 'web' && AppState.currentState === 'active') {
    console.log(
      '⏭️ BackgroundFetch: App is currently in the foreground, skipping background task',
    );
    BackgroundFetch.finish(taskId);
    return;
  }

  console.log('🔄 BackgroundFetch: app is not in foreground, continue.');

  const acquired = await acquireFetchLock('background');
  if (!acquired) {
    console.log(
      '⏭️ BackgroundFetch: Fetch lock is currently held, skipping background fetch',
    );
    BackgroundFetch.finish(taskId);
    return;
  }

  console.log('🔄 BackgroundFetch: got fetch lock, continue.');

  try {
    console.log('🔄 BackgroundFetch: processing...');
    // Get refresh rate from storage
    let refreshRate = 15;
    const storedRefreshRate = await loadRefreshRate();
    if (storedRefreshRate) {
      refreshRate = storedRefreshRate;
    }

    // Get last updated time
    let lastUpdated = await loadLastUpdated();
    if (!lastUpdated) {
      lastUpdated = 0;
    }

    const now = Date.now();
    if (now - lastUpdated < refreshRate * 60 * 1000 * 0.9) {
      console.log('⏭️ BackgroundFetch: Data is still fresh, skipping refresh');
      BackgroundFetch.finish(taskId);
      return;
    }

    // Get location from storage first, fallback to current location
    let coords: LocationCoords | null = await loadLocation();
    if (!coords) {
      coords = await locationService.getCurrentLocation();
    }

    if (!coords) {
      console.log('❌ BackgroundFetch: No location available');
      BackgroundFetch.finish(taskId);
      return;
    }

    // Get API keys from storage
    const storedKeys = await loadApiKeys();
    if (storedKeys) {
      setApiKeys(storedKeys);
    }

    // Use the new One Call API to get both current weather and forecast in a single call
    const { currentWeather: weatherData, forecast: forecastData } =
      await weatherService.getWeatherData(coords, 'auto');

    // Save data to storage (this will be picked up by UI when app opens)
    await Promise.all([
      saveCurrentWeather(weatherData),
      saveForecast(forecastData),
      saveLastUpdated(now),
    ]);

    console.log('✅ BackgroundFetch: Weather data updated successfully');

    // Fetch weather alerts and data from Caiyun
    try {
      const caiyunResponse = await caiyunService.getWeatherData(coords, 'auto');

      // Merge Caiyun Current Weather
      console.log('✅ BackgroundFetch: Merging Caiyun current weather data');
      const mergedWeather = caiyunService.mergeCaiyunCurrentWeather(
        weatherData,
        caiyunResponse,
      );
      Object.assign(weatherData, mergedWeather);
      await saveCurrentWeather(weatherData);

      // Merge Caiyun Hourly Forecast (Next 4 hours)
      if (forecastData.hourly.length > 0) {
        console.log('✅ BackgroundFetch: Merging Caiyun hourly forecast data');
        const mergedForecastHourly = caiyunService.mergeCaiyunHourlyForecast(
          forecastData.hourly,
          caiyunResponse,
        );
        forecastData.hourly = mergedForecastHourly;
        await saveForecast(forecastData);
      }
      if (
        caiyunResponse.result?.alert?.content &&
        caiyunResponse.result.alert.content.length > 0
      ) {
        const alerts = caiyunResponse.result.alert.content;
        await saveWeatherAlerts(alerts);

        // Filter out alerts that have already been notified
        const alertIds = alerts.map((alert) => alert.alertId);
        const newAlertIds = await alertTracker.filterNewAlerts(alertIds);
        const newAlerts = alerts.filter((alert) =>
          newAlertIds.includes(alert.alertId),
        );

        // Show notifications only for new alerts
        for (const alert of newAlerts) {
          await notificationService.showWeatherAlert(alert);
        }

        if (alertIds.length > 0) {
          await alertTracker.addMultipleAlertIds(alertIds);
        }
      } else {
        await saveWeatherAlerts([]);
      }

      if (caiyunResponse.result?.realtime?.air_quality) {
        await saveWeatherAirQuality(caiyunResponse.result.realtime.air_quality);
      }

      console.log('✅ BackgroundFetch: Weather alerts fetched successfully');
    } catch (e) {
      // Ignore alert errors in background
      console.log(
        '⚠️ BackgroundFetch: Alert fetch failed, continuing without alerts',
      );
    }

    console.log('✅ BackgroundFetch event completed');
  } catch (e) {
    console.error('❌ BackgroundFetch event failed:', e);
  } finally {
    await releaseFetchLock();
    BackgroundFetch.finish(taskId);
  }
}

export async function initBackgroundFetch() {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    console.log(
      '⏭️ BackgroundFetch is not supported on this platform, skipping init.',
    );
    return;
  }
  const status = await BackgroundFetch.configure(
    {
      requiredNetworkType: BackgroundFetch.NETWORK_TYPE_NONE,
      minimumFetchInterval: 15, // minutes
      stopOnTerminate: false,
      startOnBoot: true,
      enableHeadless: true,
    },
    weatherTask,
    (taskId) => {
      console.warn('❌ BackgroundFetch failed to start:', taskId);
      BackgroundFetch.finish(taskId);
    },
  );

  console.log('BackgroundFetch configure status: ', status);
}
