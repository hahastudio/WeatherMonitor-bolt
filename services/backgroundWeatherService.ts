import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { weatherService } from './weatherService';
import { caiyunService } from './caiyunService';
import { locationService } from './locationService';
import { notificationService } from './notificationService';
import { alertTracker } from './alertTracker';
import { LocationCoords } from '../types/weather';
import { saveCurrentWeather, saveForecast, saveWeatherAlerts, saveLastUpdated, loadRefreshRate, loadLastUpdated } from '../utils/weatherStorage';

const BACKGROUND_WEATHER_TASK = 'background-weather-fetch';
TaskManager.defineTask(BACKGROUND_WEATHER_TASK, async () => {
  try {
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
      return BackgroundTask.BackgroundTaskResult.Success;
    }

    // Get current location
    const coords: LocationCoords = await locationService.getCurrentLocation();
    // Fetch weather data
    const [weatherData, forecastData] = await Promise.all([
      weatherService.getCurrentWeather(coords, 'auto'),
      weatherService.getForecast(coords, 'auto'),
    ]);
    await saveLastUpdated(now);

    // Save weather data using storage utils
    await saveCurrentWeather(weatherData);
    await saveForecast(forecastData);

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
        for (const alert of newAlerts) {
          await notificationService.showWeatherAlert(alert);
        }
        if (alertIds.length > 0) {
          await alertTracker.addMultipleAlertIds(alertIds);
        }
      }
    } catch (e) {
      // Ignore alert errors in background
    }
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (e) {
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

export async function registerBackgroundWeatherTask() {
  const status = await BackgroundTask.getStatusAsync();
  if (status === BackgroundTask.BackgroundTaskStatus.Restricted) {
    return;
  }
  await BackgroundTask.registerTaskAsync(BACKGROUND_WEATHER_TASK, {
    minimumInterval: 15, // 15 minutes (Expo minimum)
  });
}

export async function unregisterBackgroundWeatherTask() {
  await BackgroundTask.unregisterTaskAsync(BACKGROUND_WEATHER_TASK);
}
