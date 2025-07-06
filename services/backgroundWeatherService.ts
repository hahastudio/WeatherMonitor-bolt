import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { weatherService } from './weatherService';
import { caiyunService } from './caiyunService';
import { locationService } from './locationService';
import { notificationService } from './notificationService';
import { alertTracker } from './alertTracker';
import { geminiService } from './geminiService';
import { LocationCoords } from '../types/weather';
import { 
  saveCurrentWeather, 
  saveForecast, 
  saveWeatherAlerts, 
  saveWeatherSummary,
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
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    // Get location from storage first, fallback to current location
    let coords: LocationCoords | null = await loadLocation();
    if (!coords) {
      coords = await locationService.getCurrentLocation();
    }

    if (!coords) {
      console.log('❌ Background fetch: No location available');
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }

    // Create timeout promise for weather data
    const weatherTimeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Weather fetch timeout')), 25000);
    });

    // Fetch weather data with timeout
    const weatherPromise = Promise.all([
      weatherService.getCurrentWeather(coords, 'auto'),
      weatherService.getForecast(coords, 'auto'),
    ]);

    const [weatherData, forecastData] = await Promise.race([
      weatherPromise,
      weatherTimeout
    ]) as any;

    // Save data to storage (this will be picked up by UI when app opens)
    await Promise.all([
      saveCurrentWeather(weatherData),
      saveForecast(forecastData),
      saveLastUpdated(now)
    ]);

    console.log('✅ Background fetch: Weather data updated successfully');

    // Fetch weather alerts with timeout (don't fail entire background fetch if this fails)
    try {
      const alertTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Alert fetch timeout')), 15000);
      });

      const alertsResponse = await Promise.race([
        caiyunService.getWeatherAlerts(coords, 'auto'),
        alertTimeout
      ]) as any;

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

        // Auto-generate weather summary if we have new alerts
        if (newAlerts.length > 0) {
          try {
            const summary = await geminiService.generateWeatherSummary({
              currentWeather: weatherData,
              forecast: forecastData,
              alerts,
              cityName: await locationService.getCityName(coords),
            }, 'auto');
            await saveWeatherSummary(summary);
            console.log('✅ Background fetch: Weather summary generated');
          } catch (summaryError) {
            console.log('⚠️ Background fetch: Summary generation failed, continuing');
          }
        }
      } else {
        await saveWeatherAlerts([]);
      }
      console.log('✅ Background fetch: Weather alerts processed successfully');
    } catch (alertError) {
      // Ignore alert errors in background - don't fail the entire background fetch
      console.log('⚠️ Background fetch: Alert fetch failed, continuing without alerts');
      await saveWeatherAlerts([]);
    }

    console.log('✅ Background weather fetch completed successfully');
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (e) {
    console.error('❌ Background weather fetch failed:', e);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerBackgroundWeatherTask() {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
    if (isRegistered) {
      console.log('✅ Background weather fetch is already registered');
      return;
    }

    const status = await BackgroundFetch.getStatusAsync();
    if (status === BackgroundFetch.BackgroundFetchStatus.Restricted) {
      console.log('⚠️ Background fetch is restricted on this device');
      return;
    }
    
    await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
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
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
    console.log('✅ Background weather fetch unregistered');
  } catch (error) {
    console.error('❌ Failed to unregister background weather fetch:', error);
  }
}

export async function getBackgroundFetchStatus() {
  try {
    const status = await BackgroundFetch.getStatusAsync();
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
    
    return {
      status,
      isRegistered,
      statusText: getStatusText(status),
    };
  } catch (error) {
    console.error('❌ Failed to get background fetch status:', error);
    return {
      status: BackgroundFetch.BackgroundFetchStatus.Restricted,
      isRegistered: false,
      statusText: 'Unknown',
    };
  }
}

function getStatusText(status: BackgroundFetch.BackgroundFetchStatus): string {
  switch (status) {
    case BackgroundFetch.BackgroundFetchStatus.Available:
      return 'Available';
    case BackgroundFetch.BackgroundFetchStatus.Denied:
      return 'Denied';
    case BackgroundFetch.BackgroundFetchStatus.Restricted:
      return 'Restricted';
    default:
      return 'Unknown';
  }
}

export async function testBackgroundFetch() {
  try {
    console.log('🧪 Testing background fetch manually...');
    const result = await TaskManager.getTaskOptionsAsync(BACKGROUND_FETCH_TASK);
    console.log('📋 Background fetch task options:', result);
    
    // Manually trigger the background fetch function
    const taskResult = await TaskManager.executeTaskAsync(BACKGROUND_FETCH_TASK);
    console.log('✅ Background fetch test completed:', taskResult);
    
    return taskResult;
  } catch (error) {
    console.error('❌ Background fetch test failed:', error);
    throw error;
  }
}