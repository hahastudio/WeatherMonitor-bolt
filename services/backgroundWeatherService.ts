import * as TaskManager from 'expo-task-manager';
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
  saveLastUpdated, 
  loadRefreshRate, 
  loadLastUpdated,
  loadLocation 
} from '../utils/weatherStorage';

const BACKGROUND_FETCH_TASK = 'background-weather-fetch';

TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    console.log('🔄 Background weather fetch started');
    
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
      console.log('⏭️ Background fetch: Data is still fresh, skipping refresh');
      return TaskManager.BackgroundFetchResult.NoData;
    }

    // Get location from storage first, fallback to current location
    let coords: LocationCoords | null = await loadLocation();
    if (!coords) {
      coords = await locationService.getCurrentLocation();
    }

    if (!coords) {
      console.log('❌ Background fetch: No location available');
      return TaskManager.BackgroundFetchResult.Failed;
    }

    // Use the new One Call API to get both current weather and forecast in a single call
    const { currentWeather: weatherData, forecast: forecastData } = await weatherService.getWeatherData(coords, 'auto');

    // Save data to storage (this will be picked up by UI when app opens)
    await Promise.all([
      saveCurrentWeather(weatherData),
      saveForecast(forecastData),
      saveLastUpdated(now)
    ]);

    console.log('✅ Background fetch: Weather data updated successfully');

    // Fetch weather alerts
    try {
      const alertsResponse = await caiyunService.getWeatherAlerts(coords, 'auto');
      if (alertsResponse.result?.alert?.content && alertsResponse.result.alert.content.length > 0) {
        const alerts = alertsResponse.result.alert.content;
        await saveWeatherAlerts(alerts);
        
        // Filter out alerts that have already been notified
        const alertIds = alerts.map(alert => alert.alertId);
        const newAlertIds = await alertTracker.filterNewAlerts(alertIds);
        const newAlerts = alerts.filter(alert => newAlertIds.includes(alert.alertId));
        
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
      console.log('✅ Background fetch: Weather alerts fetched successfully');
    } catch (e) {
      // Ignore alert errors in background
      console.log('⚠️ Background fetch: Alert fetch failed, continuing without alerts');
    }

    console.log('✅ Background weather fetch completed successfully');
    return TaskManager.BackgroundFetchResult.NewData;
  } catch (e) {
    console.error('❌ Background weather fetch failed:', e);
    return TaskManager.BackgroundFetchResult.Failed;
  }
});

export async function registerBackgroundWeatherTask() {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
    if (isRegistered) {
      console.log('✅ Background weather fetch is already registered');
      return;
    }

    const status = await TaskManager.getBackgroundFetchStatusAsync();
    if (status === TaskManager.BackgroundFetchStatus.Restricted) {
      console.log('⚠️ Background fetch is restricted on this device');
      return;
    }
    
    await TaskManager.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: 15 * 60, // 15 minutes (iOS minimum)
      stopOnTerminate: false,   // Continue when app is terminated
      startOnBoot: true,        // Start when device boots
    });
    
    console.log('✅ Background weather fetch registered');
  } catch (error) {
    console.error('❌ Failed to register background weather fetch:', error);
  }
}

export async function unregisterBackgroundWeatherTask() {
  try {
    await TaskManager.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
    console.log('✅ Background weather fetch unregistered');
  } catch (error) {
    console.error('❌ Failed to unregister background weather fetch:', error);
  }
}