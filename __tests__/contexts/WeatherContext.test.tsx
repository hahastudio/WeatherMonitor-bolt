import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { WeatherProvider, useWeather } from '../../contexts/WeatherContext';
import { locationService } from '../../services/locationService';
import { weatherService } from '../../services/weatherService';
import { geminiService } from '../../services/geminiService';
import * as storage from '../../utils/weatherStorage';
import { mockCurrentWeather, mockForecast, mockLocation } from '../mocks';

jest.mock('../../services/locationService', () => ({
  locationService: { getCurrentLocation: jest.fn(), getCityName: jest.fn() },
}));
jest.mock('../../services/weatherService', () => ({
  weatherService: { getWeatherData: jest.fn() },
}));
jest.mock('../../services/caiyunService', () => ({
  caiyunService: {
    getWeatherData: jest.fn(async () => ({ result: {} })),
    mergeCaiyunCurrentWeather: jest.fn((weather) => weather),
    mergeCaiyunHourlyForecast: jest.fn((hourly) => hourly),
  },
}));
jest.mock('../../services/notificationService', () => ({
  notificationService: { requestPermissions: jest.fn() },
}));
jest.mock('../../services/alertTracker', () => ({ alertTracker: {} }));
jest.mock('../../services/geminiService', () => ({
  geminiService: { generateWeatherSummary: jest.fn() },
}));
jest.mock('../../services/backgroundWeatherService', () => ({
  initBackgroundFetch: jest.fn(),
}));
jest.mock('../../utils/weatherStorage');

const newLocation = { latitude: 34.0522, longitude: -118.2437 };

describe('WeatherProvider location refresh', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(storage.loadLocation).mockResolvedValue(mockLocation);
    jest.mocked(storage.loadCityName).mockResolvedValue('San Francisco');
    jest
      .mocked(storage.loadCurrentWeather)
      .mockResolvedValue(mockCurrentWeather);
    jest.mocked(storage.loadForecast).mockResolvedValue(mockForecast);
    jest.mocked(storage.loadLastUpdated).mockResolvedValue(Date.now());
    jest.mocked(storage.acquireFetchLock).mockResolvedValue(true);
    jest
      .mocked(locationService.getCurrentLocation)
      .mockResolvedValue(newLocation);
    jest.mocked(locationService.getCityName).mockResolvedValue('Los Angeles');
    jest.mocked(weatherService.getWeatherData).mockResolvedValue({
      currentWeather: {
        ...mockCurrentWeather,
        coord: { lat: newLocation.latitude, lon: newLocation.longitude },
      },
      forecast: { ...mockForecast, hourly: [] },
    });
  });

  const renderWeather = async () => {
    const hook = renderHook(() => useWeather(), {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <WeatherProvider>{children}</WeatherProvider>
      ),
    });
    await waitFor(() =>
      expect(hook.result.current.location).toEqual(mockLocation),
    );
    return hook;
  };

  it('refreshes weather and the summary using the newly obtained location in the same call', async () => {
    const { result } = await renderWeather();
    // Keep the callback from the old render, as Settings does while awaiting it.
    const refreshLocation = result.current.refreshLocation;
    await act(async () => {
      await refreshLocation();
    });

    expect(locationService.getCurrentLocation).toHaveBeenCalledWith({
      fresh: true,
    });
    expect(weatherService.getWeatherData).toHaveBeenCalledTimes(1);
    expect(weatherService.getWeatherData).toHaveBeenCalledWith(
      newLocation,
      'manual',
    );
    expect(storage.saveLocation).toHaveBeenCalledWith(newLocation);
    expect(storage.saveCityName).toHaveBeenCalledWith('Los Angeles');
    expect(result.current.location).toEqual(newLocation);
    expect(result.current.cityName).toBe('Los Angeles');
    expect(result.current.currentWeather?.coord).toEqual({
      lat: newLocation.latitude,
      lon: newLocation.longitude,
    });
    expect(geminiService.generateWeatherSummary).toHaveBeenCalledWith(
      expect.objectContaining({ cityName: 'Los Angeles' }),
      'manual',
    );
  });

  it('rejects a failed location request without fetching weather or replacing the previous location', async () => {
    const { result } = await renderWeather();
    jest
      .mocked(locationService.getCurrentLocation)
      .mockRejectedValueOnce(new Error('Location permission denied'));
    await act(async () => {
      await expect(result.current.refreshLocation()).rejects.toThrow(
        'Location permission denied',
      );
    });
    expect(weatherService.getWeatherData).not.toHaveBeenCalled();
    expect(storage.saveLocation).not.toHaveBeenCalled();
    expect(result.current.location).toEqual(mockLocation);
    expect(result.current.error).toBe('Location permission denied');
  });

  it('rejects a weather failure so Settings cannot report successful weather refresh', async () => {
    const { result } = await renderWeather();
    jest
      .mocked(weatherService.getWeatherData)
      .mockRejectedValueOnce(new Error('Network unavailable'));
    await act(async () => {
      await expect(result.current.refreshLocation()).rejects.toThrow(
        'Network unavailable',
      );
    });
    expect(result.current.error).toBe('Network unavailable');
    expect(result.current.loading).toBe(false);
    expect(storage.releaseFetchLock).toHaveBeenCalledTimes(1);
  });

  it('obtains a location on first launch and fetches weather only once', async () => {
    jest.mocked(storage.loadLocation).mockResolvedValue(null);
    jest.mocked(storage.loadLastUpdated).mockResolvedValue(null);
    const { result } = renderHook(() => useWeather(), {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <WeatherProvider>{children}</WeatherProvider>
      ),
    });
    await waitFor(() =>
      expect(weatherService.getWeatherData).toHaveBeenCalledTimes(1),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(weatherService.getWeatherData).toHaveBeenCalledWith(
      newLocation,
      'app_start',
    );
    expect(geminiService.generateWeatherSummary).not.toHaveBeenCalled();
  });
});
