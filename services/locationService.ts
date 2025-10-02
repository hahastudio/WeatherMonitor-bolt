import { fetch } from 'expo/fetch';
import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { LocationCoords } from '../types/weather';
import { apiLogger } from './apiLogger';
import { getApiKey } from './apiKeyManager';

class LocationService {
  async getCurrentLocation(): Promise<LocationCoords> {
    try {
      // Request permissions
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        throw new Error('Location permission denied');
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      // Fallback to a default location (New York) if location services fail
      if (Platform.OS === 'web') {
        // Try HTML5 geolocation on web
        return this.getWebLocation();
      }
      throw error;
    }
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
        (error) => {
          // Fallback to default location (New York)
          resolve({
            latitude: 40.7128,
            longitude: -74.006,
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
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
