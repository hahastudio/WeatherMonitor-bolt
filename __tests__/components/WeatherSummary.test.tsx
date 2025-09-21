import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { WeatherSummary } from '../../components/WeatherSummary';
import { useWeather } from '../../contexts/WeatherContext';
import { mockWeatherContext, mockCurrentWeather, mockForecast } from '../mocks';
import { getTheme } from '../../utils/weatherTheme';

// Mock lucide-react-native icons
jest.mock('lucide-react-native', () => {
  const React = require('react');
  const MockIcon = ({
    name,
    ...props
  }: {
    name: string;
    [key: string]: any;
  }) => {
    const { children, ...otherProps } = props;
    // Create a mock component that can have children
    return React.createElement('MockIcon', { name, ...otherProps }, children);
  };

  return {
    __esModule: true,
    Sparkles: (props: any) => <MockIcon name="Sparkles" {...props} />,
    TriangleAlert: (props: any) => <MockIcon name="AlertTriangle" {...props} />,
    ThumbsDown: (props: any) => <MockIcon name="ThumbsDown" {...props} />,
    ThumbsUp: (props: any) => <MockIcon name="ThumbsUp" {...props} />,
    Cloud: (props: any) => <MockIcon name="Cloud" {...props} />,
    RefreshCw: (props: any) => <MockIcon name="RefreshCw" {...props} />,
    ChevronDown: (props: any) => <MockIcon name="ChevronDown" {...props} />,
    ChevronUp: (props: any) => <MockIcon name="ChevronUp" {...props} />,
    Lightbulb: (props: any) => <MockIcon name="Lightbulb" {...props} />,
  };
});

// Mock the useWeather hook
jest.mock('../../contexts/WeatherContext');

jest.mock('../../services/caiyunService', () => ({
  caiyunService: {
    getWeatherData: jest.fn(),
  },
}));

const mockedUseWeather = useWeather as jest.Mock;

const mockSummary = {
  mood: 'positive',
  todayOverview: 'A beautiful day ahead!',
  alertSummary: 'No active alerts.',
  futureWarnings: 'Slight chance of rain tomorrow.',
  recommendations: ['Wear sunscreen', 'Stay hydrated'],
};

describe('WeatherSummary', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockedUseWeather.mockReturnValue({
      ...mockWeatherContext,
      currentWeather: mockCurrentWeather,
      forecast: mockForecast,
      weatherSummary: null,
      summaryGeneratedAt: null,
      generateWeatherSummary: jest.fn(),
      theme: getTheme('clear'),
    });
  });

  it('renders null if currentWeather is not available', () => {
    mockedUseWeather.mockReturnValueOnce({
      ...mockWeatherContext,
      currentWeather: null,
      theme: getTheme('clear'),
    });
    const { queryByText } = render(<WeatherSummary />);
    expect(queryByText('AI Weather Summary')).toBeNull();
  });

  it('renders initial state without a summary', () => {
    const { getByText, queryByTestId } = render(<WeatherSummary />);
    expect(getByText('AI Weather Summary')).toBeTruthy();
    expect(queryByTestId('loading-container')).toBeNull();
    expect(queryByTestId('error-container')).toBeNull();
  });

  it('shows loading indicator when generating summary', async () => {
    jest.useFakeTimers();
    const generateWeatherSummary = jest.fn(
      () => new Promise((resolve) => setTimeout(resolve, 100)),
    );
    mockedUseWeather.mockReturnValue({
      ...mockWeatherContext,
      currentWeather: mockCurrentWeather,
      forecast: mockForecast,
      generateWeatherSummary,
      theme: getTheme('clear'),
    });

    const { getByTestId, findByTestId, queryByTestId } = render(
      <WeatherSummary />,
    );
    const refreshButton = getByTestId('refresh-summary-button');

    fireEvent.press(refreshButton, { stopPropagation: jest.fn() });

    await findByTestId('loading-container');

    // Advance timers to trigger promise resolution
    await act(async () => {
      jest.advanceTimersByTime(100);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(queryByTestId('loading-container')).toBeNull();
    });

    expect(generateWeatherSummary).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });

  it('displays an error message on failure and allows retry', async () => {
    const error = new Error('Failed to connect to AI');
    const generateWeatherSummary = jest.fn().mockRejectedValue(error);
    mockedUseWeather.mockReturnValue({
      ...mockWeatherContext,
      currentWeather: mockCurrentWeather,
      forecast: mockForecast,
      generateWeatherSummary,
      theme: getTheme('clear'),
    });

    const { getByTestId, findByText } = render(<WeatherSummary />);
    const refreshButton = getByTestId('refresh-summary-button');

    fireEvent.press(refreshButton, { stopPropagation: jest.fn() });

    const errorMessage = await findByText(error.message);
    expect(errorMessage).toBeTruthy();

    const retryButton = getByTestId('retry-summary-button');
    fireEvent.press(retryButton);

    await waitFor(() => {
      expect(generateWeatherSummary).toHaveBeenCalledTimes(2);
    });
  });

  it('displays the weather summary when available', () => {
    const summaryWithAlerts = {
      ...mockSummary,
      alertSummary: 'High winds expected this afternoon.',
    };
    mockedUseWeather.mockReturnValue({
      ...mockWeatherContext,
      currentWeather: mockCurrentWeather,
      forecast: mockForecast,
      weatherSummary: summaryWithAlerts,
      summaryGeneratedAt: Date.now(),
      theme: getTheme('clear'),
    });

    const { getByText } = render(<WeatherSummary />);
    expect(getByText(summaryWithAlerts.todayOverview)).toBeTruthy();
    expect(getByText('⚠️ Active Weather Alerts')).toBeTruthy();
    expect(getByText(summaryWithAlerts.alertSummary)).toBeTruthy();
    expect(getByText('positive')).toBeTruthy();
    expect(getByText('Just now')).toBeTruthy();
  });

  it('expands and collapses the card on press', () => {
    mockedUseWeather.mockReturnValue({
      ...mockWeatherContext,
      currentWeather: mockCurrentWeather,
      forecast: mockForecast,
      weatherSummary: mockSummary,
      theme: getTheme('clear'),
    });

    const { getByTestId, queryByTestId, getByText } = render(
      <WeatherSummary />,
    );
    const card = getByTestId('weather-summary-card');

    // Initially collapsed
    expect(queryByTestId('expanded-content')).toBeNull();
    expect(getByText('Tap to see detailed recommendations')).toBeTruthy();

    // Expand
    fireEvent.press(card);
    expect(getByTestId('expanded-content')).toBeTruthy();
    expect(getByText(mockSummary.futureWarnings)).toBeTruthy();
    expect(getByText(mockSummary.recommendations[0])).toBeTruthy();
    expect(queryByTestId('Tap to see detailed recommendations')).toBeNull();

    // Collapse
    fireEvent.press(card);
    expect(queryByTestId('expanded-content')).toBeNull();
    expect(getByText('Tap to see detailed recommendations')).toBeTruthy();
  });

  it('formats generated time correctly', () => {
    const now = Date.now();
    const fiveMinutesAgo = now - 5 * 60 * 1000;
    const twoHoursAgo = now - 2 * 60 * 60 * 1000;
    const twoDaysAgo = now - 2 * 24 * 60 * 60 * 1000;

    const TestComponent = ({ timestamp }: { timestamp: number }) => {
      mockedUseWeather.mockReturnValue({
        ...mockWeatherContext,
        currentWeather: mockCurrentWeather,
        forecast: mockForecast,
        weatherSummary: mockSummary,
        summaryGeneratedAt: timestamp,
        theme: getTheme('clear'),
      });
      return <WeatherSummary />;
    };

    const { rerender, getByText } = render(
      <TestComponent timestamp={fiveMinutesAgo} />,
    );
    expect(getByText('5m ago')).toBeTruthy();

    rerender(<TestComponent timestamp={twoHoursAgo} />);
    expect(getByText('2h ago')).toBeTruthy();

    rerender(<TestComponent timestamp={twoDaysAgo} />);
    expect(
      getByText(
        new Date(twoDaysAgo).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }),
      ),
    ).toBeTruthy();
  });

  it('stops propagation on refresh button press', async () => {
    jest.useFakeTimers();
    const generateWeatherSummary = jest.fn(
      () => new Promise((resolve) => setTimeout(resolve, 100)),
    );
    mockedUseWeather.mockReturnValue({
      ...mockWeatherContext,
      currentWeather: mockCurrentWeather,
      forecast: mockForecast,
      weatherSummary: mockSummary,
      generateWeatherSummary,
      theme: getTheme('clear'),
    });

    const { getByTestId, findByTestId, queryByTestId } = render(
      <WeatherSummary />,
    );
    const card = getByTestId('weather-summary-card');
    const refreshButton = getByTestId('refresh-summary-button');

    // Card is collapsed, expand it
    act(() => {
      fireEvent.press(card);
    });
    expect(getByTestId('expanded-content')).toBeTruthy();

    // Press refresh
    act(() => {
      fireEvent.press(refreshButton, { stopPropagation: jest.fn() });
    });
    await queryByTestId('loading-container');

    // Advance timers to trigger promise resolution
    await act(async () => {
      jest.advanceTimersByTime(100);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(queryByTestId('loading-container')).toBeNull();
    });

    expect(generateWeatherSummary).toHaveBeenCalledTimes(1);
    // Card should still be expanded
    expect(getByTestId('expanded-content')).toBeTruthy();

    jest.useRealTimers();
  });
});
