import * as BackgroundFetch from 'expo-background-fetch';
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
    console.log('🔄 Background fetch task started');
    
    // Get refresh rate from storage
    let refreshRate = 15;
    try {
      const storedRefreshRate = await loadRefreshRate();
      if (storedRefreshRate) {
        refreshRate = storedRefreshRate;
      }
    } catch (error) {
      console.log('⚠️ Could not load refresh rate, using default:', error);
    }

    // Get last updated time
    let lastUpdated = 0;
    try {
      const storedLastUpdated = await loadLastUpdated();
      if (storedLastUpdated) {
        lastUpdated = storedLastUpdated;
      }
    } catch (error) {
      console.log('⚠️ Could not load last updated time:', error);
    }
    
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdated;
    const refreshIntervalMs = refreshRate * 60 * 1000;
    
    // Only fetch if enough time has passed (with 10% tolerance)
    if (timeSinceLastUpdate < refreshIntervalMs * 0.9) {
      console.log('⏭️ Background fetch: Data is still fresh, skipping refresh');
      console.log(`⏰ Time since last update: ${Math.round(timeSinceLastUpdate / 1000 / 60)} minutes`);
      console.log(`⏰ Refresh interval: ${refreshRate} minutes`);
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    // Get location from storage first, fallback to current location
    let coords: LocationCoords | null = null;
    try {
      coords = await loadLocation();
      if (!coords) {
        console.log('📍 No stored location, getting current location...');
        coords = await locationService.getCurrentLocation();
      }
    } catch (error) {
      console.log('❌ Background fetch: Could not get location:', error);
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }

    if (!coords) {
      console.log('❌ Background fetch: No location available');
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }

    console.log('🌐 Background fetch: Fetching weather data...');

    // Fetch weather data with timeout protection
    const fetchPromises = [
      weatherService.getCurrentWeather(coords, 'auto'),
      weatherService.getForecast(coords, 'auto'),
    ];

    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Background fetch timeout')), 25000); // 25 second timeout
    });

    const [weatherData, forecastData] = await Promise.race([
      Promise.all(fetchPromises),
      timeoutPromise
    ]) as [any, any];

    console.log('✅ Background fetch: Weather data received');

    // Save data to storage (this will be picked up by UI when app opens)
    await Promise.all([
      saveCurrentWeather(weatherData),
      saveForecast(forecastData),
      saveLastUpdated(now)
    ]);

    console.log('💾 Background fetch: Weather data saved to storage');

    // Fetch weather alerts (with shorter timeout for alerts)
    try {
      console.log('🌩️ Background fetch: Fetching weather alerts...');
      
      const alertTimeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Alert fetch timeout')), 15000); // 15 second timeout
      });

      const alertsResponse = await Promise.race([
        caiyunService.getWeatherAlerts(coords, 'auto'),
        alertTimeoutPromise
      ]) as any;

      if (alertsResponse.result?.alert?.content && alertsResponse.result.alert.content.length > 0) {
        const alerts = alertsResponse.result.alert.content;
        await saveWeatherAlerts(alerts);
        
        // Filter out alerts that have already been notified
        const alertIds = alerts.map((alert: any) => alert.alertId);
        const newAlertIds = await alertTracker.filterNewAlerts(alertIds);
        const newAlerts = alerts.filter((alert: any) => newAlertIds.includes(alert.alertId));
        
        console.log(`📊 Background fetch: Total alerts: ${alerts.length}, New alerts: ${newAlerts.length}`);
        
        // Show notifications only for new alerts
        for (const alert of newAlerts) {
          console.log('📢 Background fetch: Showing notification for new alert:', alert.title);
          await notificationService.showWeatherAlert(alert);
        }
        
        if (alertIds.length > 0) {
          await alertTracker.addMultipleAlertIds(alertIds);
          console.log(`✅ Background fetch: Tracked ${alertIds.length} alert IDs`);
        }
      } else {
        console.log('ℹ️ Background fetch: No weather alerts found');
        await saveWeatherAlerts([]);
      }
    } catch (alertError) {
      // Don't fail the entire background fetch if alerts fail
      console.log('⚠️ Background fetch: Alert fetch failed, continuing without alerts:', alertError);
      await saveWeatherAlerts([]);
    }

    console.log('✅ Background fetch task completed successfully');
    return BackgroundFetch.BackgroundFetchResult.NewData;
    
  } catch (error) {
    console.error('❌ Background fetch task failed:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerBackgroundWeatherTask() {
  try {
    // Check if background fetch is available
    const status = await BackgroundFetch.getStatusAsync();
    if (status === BackgroundFetch.BackgroundFetchStatus.Restricted) {
      console.log('⚠️ Background fetch is restricted on this device');
      return;
    }

    if (status === BackgroundFetch.BackgroundFetchStatus.Denied) {
      console.log('⚠️ Background fetch is denied on this device');
      return;
    }

    // Check if task is already registered
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
    if (isRegistered) {
      console.log('✅ Background fetch task is already registered');
      return;
    }

    // Register the background fetch task
    await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: 15 * 60, // 15 minutes (minimum allowed by iOS)
      stopOnTerminate: false, // Continue running when app is terminated
      startOnBoot: true, // Start when device boots up
    });
    
    console.log('✅ Background fetch task registered successfully');
    
    // Set background fetch interval (this is a hint to the system)
    await BackgroundFetch.setMinimumIntervalAsync(15 * 60); // 15 minutes
    
  } catch (error) {
    console.error('❌ Failed to register background fetch task:', error);
  }
}

export async function unregisterBackgroundWeatherTask() {
  try {
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
    console.log('✅ Background fetch task unregistered');
  } catch (error) {
    console.error('❌ Failed to unregister background fetch task:', error);
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
      status: BackgroundFetch.BackgroundFetchStatus.Denied,
      isRegistered: false,
      statusText: 'Error checking status',
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

// For testing purposes - manually trigger background fetch
export async function testBackgroundFetch() {
  try {
    console.log('🧪 Testing background fetch manually...');
    const result = await TaskManager.getTaskOptionsAsync(BACKGROUND_FETCH_TASK);
    console.log('🧪 Task options:', result);
    
    // Note: We can't manually trigger the actual background fetch,
    // but we can test the task function directly
    const taskResult = await TaskManager.getRegisteredTasksAsync();
    console.log('🧪 Registered tasks:', taskResult);
    
    return true;
  } catch (error) {
    console.error('🧪 Background fetch test failed:', error);
    return false;
  }
}