import React from 'react';
import { render, fireEvent, act, within } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { ApiLogViewer } from '../../components/ApiLogViewer';
import { useWeather } from '../../contexts/WeatherContext';
import {
  apiLogger,
  ApiLogEntry,
  ApiLogSummary,
} from '../../services/apiLogger';

// Mock dependencies
jest.mock('../../contexts/WeatherContext', () => ({
  useWeather: jest.fn(),
}));
jest.mock('../../services/apiLogger', () => ({
  __esModule: true,
  ...jest.requireActual('../../services/apiLogger'),
  apiLogger: {
    getLogs: jest.fn(),
    getLogsSummary: jest.fn(),
    clearLogs: jest.fn(),
  },
}));
jest.spyOn(Alert, 'alert');

const mockApiLogger = apiLogger as jest.Mocked<typeof apiLogger>;

const mockLogs: ApiLogEntry[] = [
  {
    id: '1',
    timestamp: 1678886400000,
    endpoint: 'weather',
    method: 'GET',
    trigger: 'manual',
    provider: 'openweather',
    status: 'success',
    responseTime: 120,
  },
  {
    id: '2',
    timestamp: 1678886300000,
    endpoint: 'forecast',
    method: 'GET',
    trigger: 'auto',
    provider: 'caiyun',
    status: 'error',
    error: 'API Error',
  },
  {
    id: '3',
    timestamp: 1678886200000,
    endpoint: 'summary',
    method: 'POST',
    trigger: 'app_start',
    provider: 'gemini',
    status: 'success',
    responseTime: 800,
  },
];

const mockSummary: ApiLogSummary = {
  totalRequests: 11,
  successfulRequests: 8,
  failedRequests: 3,
  averageResponseTime: 460,
  requestsByTrigger: { manual: 5, auto: 4, app_start: 2, tab_switch: 0 },
  requestsByProvider: { openweather: 6, caiyun: 4, gemini: 1 },
  requestsByHour: [],
};

describe('<ApiLogViewer />', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useWeather as jest.Mock).mockReturnValue({
      theme: {
        background: '#000000',
        text: '#FFFFFF',
        textSecondary: '#AAAAAA',
        surface: '#333333',
        primary: '#BB86FC',
        accent: '#03DAC6',
      },
    });
    mockApiLogger.getLogs.mockResolvedValue([...mockLogs]);
    mockApiLogger.getLogsSummary.mockResolvedValue({ ...mockSummary });
    mockApiLogger.clearLogs.mockResolvedValue(undefined);
  });

  it('renders loading state initially, then displays summary', async () => {
    const { getByText, findByText } = render(
      <ApiLogViewer onClear={jest.fn()} logVersion={0} />,
    );
    expect(getByText('Loading API logs...')).toBeTruthy();
    await findByText('Last 48 Hours Summary');
  });

  it('renders summary and log data after loading', async () => {
    const { findByText, getByTestId } = render(
      <ApiLogViewer onClear={jest.fn()} logVersion={0} />,
    );

    await findByText('Last 48 Hours Summary');

    const summaryCard = getByTestId('summary-card');
    const logList = getByTestId('log-list');

    // Check summary data
    expect(within(summaryCard).getByText('11')).toBeTruthy();
    expect(within(summaryCard).getByText('73%')).toBeTruthy();
    expect(within(summaryCard).getByText('3')).toBeTruthy();
    expect(within(summaryCard).getByText('460ms')).toBeTruthy();

    // Check trigger counts in summary
    expect(within(summaryCard).getByText('Manual Refresh')).toBeTruthy();
    expect(within(summaryCard).getByText('Auto Refresh')).toBeTruthy();
    expect(within(summaryCard).getByText('App Start')).toBeTruthy();

    // Check provider counts in summary
    expect(within(summaryCard).getByText('OpenWeather')).toBeTruthy();
    expect(within(summaryCard).getByText('Caiyun')).toBeTruthy();
    expect(within(summaryCard).getByText('Gemini AI')).toBeTruthy();

    // Check log items in the list
    expect(within(logList).getByText('weather')).toBeTruthy();
    expect(within(logList).getByText('forecast')).toBeTruthy();
    expect(within(logList).getByText('summary')).toBeTruthy();
    expect(within(logList).getByText('API Error')).toBeTruthy();

    // Now check for the ambiguous text within the log list specifically
    expect(within(logList).getByText('Manual Refresh')).toBeTruthy();
  });

  it('renders empty state when there are no logs', async () => {
    mockApiLogger.getLogs.mockResolvedValue([]);
    mockApiLogger.getLogsSummary.mockResolvedValue({
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      requestsByTrigger: { manual: 0, auto: 0, tab_switch: 0, app_start: 0 },
      requestsByProvider: { openweather: 0, caiyun: 0, gemini: 0 },
      requestsByHour: [],
    });

    const { findByText } = render(
      <ApiLogViewer onClear={jest.fn()} logVersion={0} />,
    );

    expect(await findByText(/No API requests logged yet/)).toBeTruthy();
  });

  it('calls loadLogs when refresh button is pressed', async () => {
    const { getByTestId, findByText } = render(
      <ApiLogViewer onClear={jest.fn()} logVersion={0} />,
    );
    await findByText('Last 48 Hours Summary');

    mockApiLogger.getLogs.mockClear();
    mockApiLogger.getLogsSummary.mockClear();

    const refreshButton = getByTestId('refresh-button');

    await act(async () => {
      fireEvent.press(refreshButton);
      await Promise.resolve();
    });

    expect(mockApiLogger.getLogs).toHaveBeenCalledTimes(1);
    expect(mockApiLogger.getLogsSummary).toHaveBeenCalledTimes(1);
  });

  it('calls onClear when clear button is pressed', async () => {
    const onClearMock = jest.fn();
    const { getByTestId, findByText } = render(
      <ApiLogViewer onClear={onClearMock} logVersion={0} />,
    );
    await findByText('Last 48 Hours Summary');

    const clearButton = getByTestId('clear-logs-button');
    fireEvent.press(clearButton);

    expect(onClearMock).toHaveBeenCalledTimes(1);
  });

  it('handles error when fetching logs fails', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const error = new Error('Failed to fetch');
    mockApiLogger.getLogs.mockRejectedValue(error);
    mockApiLogger.getLogsSummary.mockRejectedValue(error);

    const { findByText } = render(
      <ApiLogViewer onClear={jest.fn()} logVersion={0} />,
    );

    expect(await findByText(/No API requests logged yet/)).toBeTruthy();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to load API logs:',
      error,
    );

    consoleErrorSpy.mockRestore();
  });
});
