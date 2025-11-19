import { locationService } from '../../services/locationService';
import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { fetch } from 'expo/fetch';
import { getApiKey } from '../../services/apiKeyManager';
import { apiLogger } from '../../services/apiLogger';

// Mock dependencies
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  reverseGeocodeAsync: jest.fn(),
  Accuracy: {
    Balanced: 4,
  },
}));
jest.mock('expo/fetch');
jest.mock('../../services/apiKeyManager');
jest.mock('../../services/apiLogger');

const mockedFetch = fetch as jest.Mock;
const mockedGetApiKey = getApiKey as jest.Mock;

describe('LocationService', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Mock global navigator
    Object.defineProperty(global.navigator, 'geolocation', {
      value: {
        getCurrentPosition: jest.fn(),
      },
      writable: true,
    });
  });

  describe('getCurrentLocation', () => {
    it('should return current location when permission is granted', async () => {
      (
        Location.requestForegroundPermissionsAsync as jest.Mock
      ).mockResolvedValue({
        status: 'granted',
      });
      (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
        coords: { latitude: 34.0522, longitude: -118.2437 },
      });

      const location = await locationService.getCurrentLocation();
      expect(location).toEqual({ latitude: 34.0522, longitude: -118.2437 });
      expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalledTimes(
        1,
      );
      expect(Location.getCurrentPositionAsync).toHaveBeenCalledTimes(1);
    });

    it('should throw an error when permission is denied', async () => {
      (
        Location.requestForegroundPermissionsAsync as jest.Mock
      ).mockResolvedValue({
        status: 'denied',
      });

      await expect(locationService.getCurrentLocation()).rejects.toThrow(
        'Location permission denied',
      );
    });

    it('should fallback to web location on web when native location fails', async () => {
      Platform.OS = 'web';
      (
        Location.requestForegroundPermissionsAsync as jest.Mock
      ).mockResolvedValue({
        status: 'granted',
      });
      (Location.getCurrentPositionAsync as jest.Mock).mockRejectedValue(
        new Error('Native location failed'),
      );

      // Mock web geolocation success
      const mockWebPosition = {
        coords: { latitude: 51.5074, longitude: -0.1278 },
      };
      (
        navigator.geolocation.getCurrentPosition as jest.Mock
      ).mockImplementationOnce((success) => success(mockWebPosition));

      const location = await locationService.getCurrentLocation();
      expect(location).toEqual({ latitude: 51.5074, longitude: -0.1278 });
    });

    it('should throw an error on non-web platforms when native location fails', async () => {
      Platform.OS = 'ios';
      (
        Location.requestForegroundPermissionsAsync as jest.Mock
      ).mockResolvedValue({
        status: 'granted',
      });
      (Location.getCurrentPositionAsync as jest.Mock).mockRejectedValue(
        new Error('Native location failed'),
      );

      await expect(locationService.getCurrentLocation()).rejects.toThrow(
        'Native location failed',
      );
    });

    it('should fallback to default location on web when geolocation fails', async () => {
      Platform.OS = 'web';
      (
        Location.requestForegroundPermissionsAsync as jest.Mock
      ).mockResolvedValue({
        status: 'granted',
      });
      (Location.getCurrentPositionAsync as jest.Mock).mockRejectedValue(
        new Error('Native location failed'),
      );

      // Mock web geolocation error
      (
        navigator.geolocation.getCurrentPosition as jest.Mock
      ).mockImplementationOnce((success, error) =>
        error({ code: 1, message: 'User denied Geolocation' }),
      );

      const location = await locationService.getCurrentLocation();
      expect(location).toEqual({ latitude: 40.7128, longitude: -74.006 });
    });

    it('should reject if geolocation is not supported on web', async () => {
      Platform.OS = 'web';
      (
        Location.requestForegroundPermissionsAsync as jest.Mock
      ).mockResolvedValue({
        status: 'granted',
      });
      (Location.getCurrentPositionAsync as jest.Mock).mockRejectedValue(
        new Error('Native location failed'),
      );

      Object.defineProperty(global.navigator, 'geolocation', {
        value: undefined,
        writable: true,
      });

      await expect(locationService.getCurrentLocation()).rejects.toThrow(
        'Geolocation not supported',
      );
    });
  });

  describe('getCityName', () => {
    const coords = { latitude: 34.0522, longitude: -118.2437 };

    it('should return city name from Expo reverse geocoding', async () => {
      (Location.reverseGeocodeAsync as jest.Mock).mockResolvedValue([
        { city: 'Los Angeles' },
      ]);

      const cityName = await locationService.getCityName(coords);
      expect(cityName).toBe('Los Angeles');
      expect(Location.reverseGeocodeAsync).toHaveBeenCalledWith(coords);
    });

    it('should return subregion when city is not available', async () => {
      (Location.reverseGeocodeAsync as jest.Mock).mockResolvedValue([
        { subregion: 'Manhattan' },
      ]);

      const cityName = await locationService.getCityName(coords);
      expect(cityName).toBe('Manhattan');
    });

    it('should fallback to OpenWeatherMap when Expo geocoding returns no city name', async () => {
      (Location.reverseGeocodeAsync as jest.Mock).mockResolvedValue([
        { region: 'California' },
      ]);
      mockedGetApiKey.mockReturnValue('fake-api-key');
      mockedFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([{ name: 'LA from OWM' }]),
      } as Response);

      const cityName = await locationService.getCityName(coords);
      expect(cityName).toBe('LA from OWM');
      expect(mockedFetch).toHaveBeenCalledTimes(1);
    });

    it('should fallback to OpenWeatherMap when Expo geocoding fails', async () => {
      (Location.reverseGeocodeAsync as jest.Mock).mockRejectedValue(
        new Error('Expo geocoding failed'),
      );
      mockedGetApiKey.mockReturnValue('fake-api-key');
      mockedFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve([{ local_names: { en: 'LA from OWM (en)' } }]),
      } as Response);

      const cityName = await locationService.getCityName(coords);
      expect(cityName).toBe('LA from OWM (en)');
      expect(mockedFetch).toHaveBeenCalledTimes(1);
    });

    it('should return "Unknown Location" if all geocoding fails', async () => {
      (Location.reverseGeocodeAsync as jest.Mock).mockRejectedValue(
        new Error('Expo geocoding failed'),
      );
      mockedGetApiKey.mockReturnValue('fake-api-key');
      mockedFetch.mockRejectedValue(new Error('Network error'));

      const cityName = await locationService.getCityName(coords);
      expect(cityName).toBe('Unknown Location');
      expect(apiLogger.logRequest).toHaveBeenCalledWith(
        'geocoding (reverse)',
        'GET',
        'error',
        'auto',
        expect.any(Number),
        'Network error',
        'openweather',
      );
    });

    it('should handle OpenWeatherMap API key not being configured', async () => {
      (Location.reverseGeocodeAsync as jest.Mock).mockResolvedValue([]);
      mockedGetApiKey.mockReturnValue(null);

      const cityName = await locationService.getCityName(coords);
      expect(cityName).toBe('Unknown Location');
      expect(apiLogger.logRequest).toHaveBeenCalledWith(
        'geocoding (reverse)',
        'GET',
        'error',
        'auto',
        expect.any(Number),
        'OpenWeatherMap API key not configured',
        'openweather',
      );
    });

    it('should handle OpenWeatherMap API failure', async () => {
      (Location.reverseGeocodeAsync as jest.Mock).mockResolvedValue([]);
      mockedGetApiKey.mockReturnValue('fake-api-key');
      mockedFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      } as Response);

      const cityName = await locationService.getCityName(coords);
      expect(cityName).toBe('Unknown Location');
      expect(apiLogger.logRequest).toHaveBeenCalledWith(
        'geocoding (reverse)',
        'GET',
        'error',
        'auto',
        expect.any(Number),
        '401 Unauthorized',
        'openweather',
      );
    });

    it('should handle no location data from OpenWeatherMap', async () => {
      (Location.reverseGeocodeAsync as jest.Mock).mockResolvedValue([]);
      mockedGetApiKey.mockReturnValue('fake-api-key');
      mockedFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      } as Response);

      const cityName = await locationService.getCityName(coords);
      expect(cityName).toBe('Unknown Location');
      expect(apiLogger.logRequest).toHaveBeenCalledWith(
        'geocoding (reverse)',
        'GET',
        'error',
        'auto',
        expect.any(Number),
        'No location data returned',
        'openweather',
      );
    });
  });
});
