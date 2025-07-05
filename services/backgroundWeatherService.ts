import * as BackgroundTask from 'expo-background-task';
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

const BACKGROUND_WEATHER_TASK = 'background-weather-fetch';

TaskManager.defineTask(BACKGROUND_WEATHER_TASK, async () => {
  try {
    console.log('🔄 Background weather task started');
    
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
    if (now - lastUpdated < refreshRate * 60 * 1000) {
      console.log('⏭️ Background task: Data is still fresh, skipping refresh');
      return BackgroundTask.BackgroundTaskResult.Success;
    }

    // Get location from storage first, fallback to current location
    let coords: LocationCoords | null = await loadLocation();
    if (!coords) {
      coords = await locationService.getCurrentLocation();
    }

    if (!coords) {
      console.log('❌ Background task: No location available');
      return BackgroundTask.BackgroundTaskResult.Failed;
    }

    // Fetch weather data
    const [weatherData, forecastData] = await Promise.all([
      weatherService.getCurrentWeather(coords, 'auto'),
      weatherService.getForecast(coords, 'auto'),
    ]);

    // Save data to storage (this will be picked up by UI when app opens)
    await Promise.all([
      saveCurrentWeather(weatherData),
      saveForecast(forecastData),
      saveLastUpdated(now)
    ]);

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
    } catch (e) {
      // Ignore alert errors in background
      console.log('⚠️ Background task: Alert fetch failed, continuing without alerts');
    }

    console.log('✅ Background weather task completed successfully');
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (e) {
    console.error('❌ Background weather task failed:', e);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

export async function registerBackgroundWeatherTask() {
  try {
    const status = await BackgroundTask.getStatusAsync();
    if (status === BackgroundTask.BackgroundTaskStatus.Restricted) {
      console.log('⚠️ Background tasks are restricted on this device');
      return;
    }
    
    await BackgroundTask.registerTaskAsync(BACKGROUND_WEATHER_TASK, {
      minimumInterval: 15, // 15 minutes (Expo minimum)
    });
    
    console.log('✅ Background weather task registered');
  } catch (error) {
    console.error('❌ Failed to register background weather task:', error);
  }
}

export async function unregisterBackgroundWeatherTask() {
  try {
    await BackgroundTask.unregisterTaskAsync(BACKGROUND_WEATHER_TASK);
    console.log('✅ Background weather task unregistered');
  } catch (error) {
    console.error('❌ Failed to unregister background weather task:', error);
  }
}