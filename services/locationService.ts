import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { LocationCoords } from '../types/weather';

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
        accuracy: Location.Accuracy.Balanced,
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
            longitude: -74.0060,
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        }
      );
    });
  }

  async getCityName(coords: LocationCoords): Promise<string> {
    try {
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });

      if (reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        return address.city || address.subregion || address.region || 'Unknown Location';
      }
      
      return 'Unknown Location';
    } catch (error) {
      return 'Unknown Location';
    }
  }
}

export const locationService = new LocationService();