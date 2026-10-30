import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { weatherTask } from '../../services/backgroundWeatherService';
import { weatherService } from '../../services/weatherService';
import { loadForecast, saveLocation } from '../../utils/weatherStorage';
import { mockCurrentWeather, mockForecast, mockLocation } from '../mocks';
import { astronomySnapshot } from '../fixtures/astronomy';

jest.mock('../../services/weatherService', () => ({
  weatherService: { getWeatherData: jest.fn() },
}));
jest.mock('../../services/locationService', () => ({
  locationService: { getCurrentLocation: jest.fn() },
}));
jest.mock('../../services/caiyunService', () => ({
  caiyunService: {
    getWeatherData: jest.fn(async () => ({ result: {} })),
    mergeCaiyunCurrentWeather: jest.fn((weather) => weather),
    mergeCaiyunHourlyForecast: jest.fn((hourly) =>
      hourly.map((hour: any) => ({
        ...hour,
        main: { ...hour.main, temp: 99 },
      })),
    ),
  },
}));
jest.mock('../../services/notificationService', () => ({
  notificationService: {},
}));
jest.mock('../../services/alertTracker', () => ({ alertTracker: {} }));

it('round trips astronomy through the actual background storage and Caiyun merge path', async () => {
  await AsyncStorage.clear();
  await saveLocation(mockLocation);
  const oldState = AppState.currentState;
  AppState.currentState = 'background';
  jest.mocked(weatherService.getWeatherData).mockResolvedValueOnce({
    currentWeather: mockCurrentWeather,
    forecast: {
      ...mockForecast,
      hourly: [
        {
          ...mockCurrentWeather,
          rain: undefined,
          snow: undefined,
          pop: 0,
          dt_txt: '2026-10-25 12:00:00',
        },
      ],
      astronomy: astronomySnapshot,
    },
  });
  try {
    await weatherTask('astronomy-round-trip');
    const stored = await loadForecast();
    expect(stored?.astronomy).toEqual(astronomySnapshot);
    expect(stored?.hourly[0].main.temp).toBe(99);
    expect(weatherService.getWeatherData).toHaveBeenCalledTimes(1);
  } finally {
    AppState.currentState = oldState;
  }
});
