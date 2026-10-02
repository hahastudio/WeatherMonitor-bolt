import { fetch } from 'expo/fetch';
import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { LocationCoords } from '../types/weather';
import { apiLogger } from './apiLogger';
import { getApiKey } from './apiKeyManager';

class LocationService {
  async getCurrentLocation({ fresh = false } = {}): Promise<LocationCoords> {
    try {
      if (fresh && Platform.OS === 'web') return await this.getWebLocation();

      // Request permissions
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        throw new Error('Location permission denied');
      }

      // Android's one-shot provider can reuse a cached fix. Actively subscribe
      // until a fix taken after this request arrives, then stop the subscription.
      const location =
        fresh && Platform.OS === 'android'
          ? await this.getFreshAndroidLocation()
          : await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.High,
            });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      if (Platform.OS === 'web' && !fresh) {
        // Try HTML5 geolocation on web
        return this.getWebLocation();
      }
      throw error;
    }
  }

  private getFreshAndroidLocation(): Promise<Location.LocationObject> {
    const requestedAt = Date.now();

    return new Promise((resolve, reject) => {
      let subscription: Location.LocationSubscription | undefined;
      let settled = false;

      const finish = (location?: Location.LocationObject, error?: Error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        subscription?.remove();
        if (location) {
          resolve(location);
        } else {
          reject(error);
        }
      };

      const timeout = setTimeout(
        () =>
          finish(
            undefined,
            new Error(
              'Could not get a fresh location. Check that location services are enabled and try again.',
            ),
          ),
        30000,
      );

      Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000,
          distanceInterval: 0,
          mayShowUserSettingsDialog: true,
        },
        (location) => {
          if (location.timestamp >= requestedAt) finish(location);
        },
        (reason) => finish(undefined, new Error(reason)),
      )
        .then((watch) => {
          subscription = watch;
          // A fix or timeout can arrive before native subscription setup ends.
          if (settled) watch.remove();
        })
        .catch((error) => finish(undefined, error));
    });
  }

  private getWebLocation(): Promise<LocationCoords> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => reject(new Error(error.message)),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        },
      );
    });
  }

  private async getOpenWeatherMapLocation(
    coords: LocationCoords,
  ): Promise<string> {
    const endpoint = 'geocoding (reverse)';
    const startTime = Date.now();

    try {
      console.log('Fetching OpenWeatherMap location for coords:', coords);
      const apiKey = getApiKey('openWeatherMap');
      if (!apiKey) {
        throw new Error('OpenWeatherMap API key not configured');
      }
      const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/reverse?lat=${coords.latitude}&lon=${coords.longitude}&limit=1&appid=${apiKey}`,
      );

      const responseTime = Date.now() - startTime;
      if (!response.ok) {
        await apiLogger.logRequest(
          endpoint,
          'GET',
          'error',
          'auto',
          responseTime,
          `${response.status} ${response.statusText}`,
          'openweather',
        );
        throw new Error('OpenWeatherMap geocoding failed');
      }

      const data = await response.json();
      if (data && data.length > 0) {
        const location = data[0];
        await apiLogger.logRequest(
          endpoint,
          'GET',
          'success',
          'auto',
          responseTime,
          undefined,
          'openweather',
        );
        if (location.local_names?.en) {
          return location.local_names.en;
        }
        return location.name || 'Unknown Location';
      }

      await apiLogger.logRequest(
        endpoint,
        'GET',
        'error',
        'auto',
        responseTime,
        'No location data returned',
        'openweather',
      );
      throw new Error('No location data');
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.warn('OpenWeatherMap geocoding error:', error);
      await apiLogger.logRequest(
        endpoint,
        'GET',
        'error',
        'auto',
        responseTime,
        error instanceof Error ? error.message : 'Unknown error',
        'openweather',
      );
      return 'Unknown Location';
    }
  }

  async getCityName(coords: LocationCoords): Promise<string> {
    try {
      // First try Expo's reverse geocoding
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });

      if (reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        console.log('Expo geocoding result:', address);
        const cityName = address.city || address.subregion;
        if (cityName) {
          return cityName;
        }
      }

      // If Expo geocoding doesn't return useful results, try OpenWeatherMap
      console.log('Falling back to OpenWeatherMap geocoding');
      return await this.getOpenWeatherMapLocation(coords);
    } catch (error) {
      console.warn('Geocoding error:', error);
      // Try OpenWeatherMap as fallback even if Expo geocoding throws error
      return await this.getOpenWeatherMapLocation(coords);
    }
  }
}

export const locationService = new LocationService();
