import BackgroundFetch from 'react-native-background-fetch';
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
  loadLocation 
} from '../utils/weatherStorage';

export async function initBackgroundFetch() {
  let status = await BackgroundFetch.configure({
    requiredNetworkType: BackgroundFetch.NETWORK_TYPE_NONE,
    minimumFetchInterval: 15, // minutes
    stopOnTerminate: false,
    startOnBoot: true,
    enableHeadless: true,
  }, async (taskId) => {
    try {
      console.log('🔄 Background weather fetch event triggered:', taskId);
      
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

      // Use the new One Call API to get both current weather and forecast in a single call
      const { currentWeather: weatherData, forecast: forecastData } = await weatherService.getWeatherData(coords, 'auto');

      // Save data to storage (this will be picked up by UI when app opens)
      await Promise.all([
        saveCurrentWeather(weatherData),
        saveForecast(forecastData),
        saveLastUpdated(now)
      ]);

      console.log('✅ BackgroundFetch: Weather data updated successfully');

      // Fetch weather alerts
      try {
        const caiyunResponse = await caiyunService.getWeatherData(coords, 'auto');
        if (caiyunResponse.result?.alert?.content && caiyunResponse.result.alert.content.length > 0) {
          const alerts = caiyunResponse.result.alert.content;
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

        if (caiyunResponse.result?.realtime?.air_quality) {
          await saveWeatherAirQuality(caiyunResponse.result.realtime.air_quality);
        }
        
        console.log('✅ BackgroundFetch: Weather alerts fetched successfully');
      } catch (e) {
        // Ignore alert errors in background
        console.log('⚠️ BackgroundFetch: Alert fetch failed, continuing without alerts');
      }

      console.log('✅ BackgroundFetch event completed');
      BackgroundFetch.finish(taskId);
    } catch (e) {
      console.error('❌ BackgroundFetch event failed:', e);
      BackgroundFetch.finish(taskId);
    }
  }, (error) => {
    console.error('❌ BackgroundFetch failed to start:', error);
  });

  console.log('BackgroundFetch configure status: ', status);
}
