import BackgroundFetch from 'react-native-background-fetch';
import { weatherService } from './weatherService';
import { caiyunService } from './caiyunService';
import { locationService } from './locationService';
import { notificationService } from './notificationService';
import { alertTracker } from './alertTracker';
import { CaiyunWeatherAlert, LocationCoords } from '../types/weather';
import { 
  saveCurrentWeather, 
  saveForecast, 
  saveWeatherAlerts,
  saveWeatherAirQuality,
  saveWeatherSummary,
  saveLastUpdated, 
  loadRefreshRate, 
  loadLastUpdated,
  loadLocation,
  loadCityName,
  loadWeatherSummary,
} from '../utils/weatherStorage';
import { geminiService } from './geminiService';

export async function weatherTask(taskId: string) {
  try {
    console.log('🔄 Background weather fetch event triggered:', taskId);
    
    // Get refresh rate from storage
    let refreshRate = 15;
    const storedRefreshRate = await loadRefreshRate();
    if (storedRefreshRate) {
      refreshRate = storedRefreshRate;
    }

    // Get last updated time and check weather data freshness
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
    var alerts : CaiyunWeatherAlert[] = [];
    var hasNewAlerts = false;
    var airQuality = null;

    try {
      const caiyunResponse = await caiyunService.getWeatherData(coords, 'auto');
      if (caiyunResponse.result?.alert?.content && caiyunResponse.result.alert.content.length > 0) {
        alerts = caiyunResponse.result.alert.content;
        await saveWeatherAlerts(alerts);
        
        // Filter out alerts that have already been notified
        const alertIds = alerts.map(alert => alert.alertId);
        const newAlertIds = await alertTracker.filterNewAlerts(alertIds);
        const newAlerts = alerts.filter(alert => newAlertIds.includes(alert.alertId));
        
        if (newAlerts.length > 0) {
          hasNewAlerts = true;
        }

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
        airQuality = caiyunResponse.result.realtime.air_quality;
        await saveWeatherAirQuality(airQuality);
      }
      
      console.log('✅ BackgroundFetch: Weather alerts fetched successfully');
    } catch (e) {
      // Ignore alert errors in background
      console.log('⚠️ BackgroundFetch: Alert fetch failed, continuing without alerts');
    }

    // Check if we need to update the weather summary
    try {
      const storedSummary = await loadWeatherSummary();
      const summaryAge = now - (storedSummary?.generatedAt || 0);
      const summaryRefreshInterval = 4 * 60 * 60 * 1000; // 4 hours
      
      if ((summaryAge > summaryRefreshInterval) || hasNewAlerts) {
        console.log('🤖 BackgroundFetch: Generating new weather summary...');
        const cityName = await loadCityName();
        const summary = await geminiService.generateWeatherSummary({
          currentWeather: weatherData,
          forecast: forecastData,
          alerts: alerts,
          airQuality: airQuality,
          cityName: cityName || 'Unknown Location',
        }, 'auto');
        
        await saveWeatherSummary(summary);
        console.log('✅ BackgroundFetch: Weather summary updated successfully');
      } else {
        console.log('⏭️ BackgroundFetch: Summary is still fresh, skipping update');
      }
    } catch (e) {
      console.log('⚠️ BackgroundFetch: Summary generation failed:', e);
    }

    console.log('✅ BackgroundFetch event completed');
    BackgroundFetch.finish(taskId);
  } catch (e) {
    console.error('❌ BackgroundFetch event failed:', e);
    BackgroundFetch.finish(taskId);
  }
}

export async function initBackgroundFetch() {
  let status = await BackgroundFetch.configure({
    requiredNetworkType: BackgroundFetch.NETWORK_TYPE_NONE,
    minimumFetchInterval: 15, // minutes
    stopOnTerminate: false,
    startOnBoot: true,
    enableHeadless: true,
  }, weatherTask, (taskId) => {
    console.warn('❌ BackgroundFetch failed to start:', taskId);
    BackgroundFetch.finish(taskId);
  });

  console.log('BackgroundFetch configure status: ', status);
}
