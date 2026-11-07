import React from 'react';
import {
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react-native';
import { CustomChart, DataPoint } from '../../components/CustomChart';
import { useWeather } from '../../contexts/WeatherContext';

// Mock useWeather context
jest.mock('../../contexts/WeatherContext', () => ({
  useWeather: jest.fn(),
}));

describe('CustomChart', () => {
  const mockUseWeather = useWeather as jest.Mock;

  beforeEach(() => {
    mockUseWeather.mockReturnValue({
      theme: {
        textSecondary: '#666',
        secondary: '#ADD8E6', // Light blue for bar chart
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const sampleData: DataPoint[] = [
    { x: 0, y: 10, label: 'Mon' },
    { x: 1, y: 12, label: 'Tue' },
    { x: 2, y: 8, label: 'Wed' },
    { x: 3, y: 15, label: 'Thu' },
  ];

  it('renders "No data available" when data is empty', () => {
    render(<CustomChart data={[]} color="#FF0000" unit="°C" />);
    expect(screen.getByText('No data available')).toBeTruthy();
  });

  it('renders "No valid data points" when data contains only invalid points', () => {
    const invalidData: DataPoint[] = [
      { x: 0, y: NaN },
      { x: 1, y: Infinity },
      { x: 2, y: -Infinity },
    ];
    render(<CustomChart data={invalidData} color="#FF0000" unit="°C" />);
    expect(screen.getByText('No valid data points')).toBeTruthy();
  });

  it('renders a line chart by default', () => {
    render(<CustomChart data={sampleData} color="#FF0000" unit="°C" />);
    expect(screen.queryByText('No data available')).toBeNull();
    expect(screen.queryByText('No valid data points')).toBeNull();
  });

  it('renders an area chart when type is "area"', () => {
    render(
      <CustomChart data={sampleData} color="#00FF00" unit="°C" type="area" />,
    );
    expect(screen.queryByText('No data available')).toBeNull();
    expect(screen.queryByText('No valid data points')).toBeNull();
  });

  it('renders a bar chart when type is "bar"', () => {
    render(
      <CustomChart data={sampleData} color="#0000FF" unit="°C" type="bar" />,
    );
    expect(screen.queryByText('No data available')).toBeNull();
    expect(screen.queryByText('No valid data points')).toBeNull();
  });

  it('displays Y-axis labels for temperature (°C)', async () => {
    const temp_data: DataPoint[] = [
      { x: 0, y: 0 },
      { x: 1, y: 10 },
      { x: 2, y: 20 },
    ];
    render(<CustomChart data={temp_data} color="#FF0000" unit="°C" />);
    const yLabels = await screen.findAllByTestId('y-label');
    expect(yLabels.length).toBeGreaterThan(0);
  });

  it('displays Y-axis labels for precipitation (mm)', async () => {
    const precip_data: DataPoint[] = [
      { x: 0, y: 0.5 },
      { x: 1, y: 2.1 },
      { x: 2, y: 0 },
    ];
    render(<CustomChart data={precip_data} color="#0000FF" unit="mm" />);
    const yLabels = await screen.findAllByTestId('y-label');
    expect(yLabels.length).toBeGreaterThan(0);
  });

  it('displays Y-axis labels for pressure (hPa)', async () => {
    const pressure_data: DataPoint[] = [
      { x: 0, y: 1000 },
      { x: 1, y: 1015 },
      { x: 2, y: 1020 },
    ];
    render(<CustomChart data={pressure_data} color="#FFA500" unit="hPa" />);
    const yLabels = await screen.findAllByTestId('y-label');
    expect(yLabels.length).toBeGreaterThan(0);
    expect(screen.getByTestId('standard-pressure')).toBeTruthy();
  });

  it('displays X-axis labels when provided in data points', async () => {
    render(<CustomChart data={sampleData} color="#FF0000" unit="°C" />);
    expect(await screen.findByText('Mon')).toBeTruthy();
    expect(await screen.findByText('Tue')).toBeTruthy();
    expect(await screen.findByText('Wed')).toBeTruthy();
    expect(await screen.findByText('Thu')).toBeTruthy();
  });

  it('does not render grid lines when showGrid is false', () => {
    render(
      <CustomChart
        data={sampleData}
        color="#FF0000"
        unit="°C"
        showGrid={false}
      />,
    );
    expect(screen.queryAllByTestId('svg-line-grid')).toHaveLength(0);
  });

  it('renders grid lines when showGrid is true', () => {
    render(
      <CustomChart
        data={sampleData}
        color="#FF0000"
        unit="°C"
        showGrid={true}
      />,
    );
    expect(screen.queryAllByTestId('svg-line-grid').length).toBeGreaterThan(0);
  });

  it('filters out invalid data points and renders with valid ones', () => {
    const mixedData: DataPoint[] = [
      { x: 0, y: 10 },
      { x: 1, y: NaN },
      { x: 2, y: 12 },
      { x: 3, y: Infinity },
      { x: 4, y: 8 },
    ];
    render(<CustomChart data={mixedData} color="#FF0000" unit="°C" />);
    expect(screen.queryByText('No valid data points')).toBeNull();
  });

  it('handles single data point correctly', async () => {
    const singleData: DataPoint[] = [{ x: 0, y: 25, label: 'Today' }];
    render(<CustomChart data={singleData} color="#FF0000" unit="°C" />);
    expect(screen.queryByText('No data available')).toBeNull();
    expect(screen.queryByText('No valid data points')).toBeNull();
    expect(await screen.findByText('Today')).toBeTruthy();
    const labels = await screen.findAllByText(/^25$/);
    expect(labels.length).toBeGreaterThan(0);
  });

  it('renders second line when data2 is provided', () => {
    const data2: DataPoint[] = [
      { x: 0, y: 8 },
      { x: 1, y: 10 },
      { x: 2, y: 6 },
      { x: 3, y: 13 },
    ];
    render(
      <CustomChart
        data={sampleData}
        color="#FF0000"
        data2={data2}
        color2="#0000FF"
        unit="°C"
      />,
    );
    expect(screen.getByTestId('svg-path-2')).toBeTruthy();
  });

  it('scales Y-axis correctly for dual data sources', async () => {
    const data1: DataPoint[] = [{ x: 0, y: 10 }];
    const data2: DataPoint[] = [{ x: 0, y: 30 }]; // Higher value in second dataset
    render(
      <CustomChart
        data={data1}
        color="#FF0000"
        data2={data2}
        color2="#0000FF"
        unit="°C"
      />,
    );
    // Should find label close to 30 (max value)
    const labels = await screen.findAllByTestId('y-label');
    const labelTexts = labels.map((l) => l.props.children);
    // Check if any label is close to 30 or covers the range
    const hasHighValue = labelTexts.some((text) => {
      const val = parseInt(text.toString().replace('°C', ''));
      return val >= 25;
    });
    expect(hasHighValue).toBe(true);
  });
  it('enforces non-negative Y-axis (starts at 0) for AQI charts (empty unit)', async () => {
    const aqiData: DataPoint[] = [
      { x: 0, y: 50 },
      { x: 1, y: 60 },
      { x: 2, y: 55 },
    ];
    render(<CustomChart data={aqiData} color="#00CED1" unit="" />);

    // Should find a label '0' because min Y is forced to 0
    const zeroLabels = await screen.findAllByText(/^0$/);
    expect(zeroLabels.length).toBeGreaterThan(0);
  });
});

it('preserves missing sample positions, secondary values and inspection across resizing', () => {
  const { fireEvent } = require('@testing-library/react-native');
  (useWeather as jest.Mock).mockReturnValue({
    theme: require('../../utils/weatherTheme').defaultTheme,
  });
  const data = [
    { x: 0, y: 0, label: 'Oct 31' },
    { x: 1, y: NaN, label: '12 PM' },
    { x: 2, y: 12, label: 'Nov 1' },
  ];
  const second = data.map((p) => ({ ...p, y: 20 }));
  const view = render(
    <CustomChart
      data={data}
      data2={second}
      color="#123456"
      color2="#654321"
      unit="°C"
      seriesNames={['Temperature', 'Feels like']}
    />,
  );
  // A gap starts a new path at the original x position; no invented zero or compressed domain.
  expect(screen.getByTestId('svg-path').props.d.match(/M /g)).toHaveLength(2);
  fireEvent(screen.getByRole('adjustable'), 'accessibilityAction', {
    nativeEvent: { actionName: 'increment' },
  });
  expect(screen.getByTestId('chart-inspection')).toHaveTextContent(
    /TemperatureUnavailableFeels like20\.0 °C/,
  );
  fireEvent(screen.getByTestId('chart-plot'), 'layout', {
    nativeEvent: { layout: { width: 280 } },
  });
  expect(screen.getByTestId('chart-inspection')).toHaveTextContent(
    /TemperatureUnavailable/,
  );
  view.rerender(
    <CustomChart
      data={data}
      data2={second}
      color="#123456"
      color2="#654321"
      unit="°C"
      seriesNames={['Temperature', 'Feels like']}
      guideSeries={1}
    />,
  );
  expect(screen.getByTestId('svg-path')).toBeTruthy();
  expect(screen.getByTestId('svg-path-2')).toBeTruthy();
  expect(screen.getAllByTestId('chart-extrema-guide')[0].props.stroke).toBe(
    '#654321',
  );
});

it('omits precipitation extrema and uses the axis label color for both midnight and noon bars', () => {
  const { getTheme } = require('../../utils/weatherTheme');
  const data: DataPoint[] = [
    { x: 0, y: 0, label: 'Nov 2', dateLabel: 'Nov 2', timeOfDay: 'midnight' },
    { x: 1, y: 2 },
    { x: 12, y: 3, label: '12:00 PM', timeOfDay: 'noon' },
    { x: 24, y: 1, label: 'Nov 3', dateLabel: 'Nov 3', timeOfDay: 'midnight' },
  ];
  const view = render(
    <CustomChart data={data} color="#1256A0" type="bar" unit="mm" />,
  );
  [false, true].forEach((dark) => {
    const theme = getTheme('rain', dark);
    (useWeather as jest.Mock).mockReturnValue({
      theme,
    });
    view.rerender(
      <CustomChart
        data={data}
        color={dark ? '#8CC8FF' : '#1256A0'}
        type="bar"
        unit="mm"
      />,
    );
    expect(screen.queryAllByTestId('chart-extrema-guide')).toHaveLength(0);
    expect(screen.queryAllByTestId('chart-extrema-marker')).toHaveLength(0);
    const bars = screen.getAllByTestId('svg-rect');
    expect(bars[0].props.height).toBe(0);
    expect(new Set(bars.slice(0, 3).map((bar) => bar.props.stroke)).size).toBe(
      2,
    );
    expect(new Set(bars.slice(0, 3).map((bar) => bar.props.fill)).size).toBe(2);
    expect(bars[0].props.stroke).toBe(theme.textSecondary);
    expect(bars[2].props.stroke).toBe(theme.textSecondary);
    expect(bars[3].props.stroke).toBe(bars[0].props.stroke);
    expect(
      screen.getAllByTestId('x-label').map((tick) => tick.props.fill),
    ).toEqual([theme.textSecondary, theme.textSecondary, theme.textSecondary]);
  });
});

it('tracks the nearest values in a compact readout and keeps touch ownership until release or cancellation', () => {
  const theme = require('../../utils/weatherTheme').defaultTheme;
  (useWeather as jest.Mock).mockReturnValue({ theme });
  const onInteractionChange = jest.fn();
  const data = [
    { x: 0, y: 0, description: 'Nov 2, 12:00 AM' },
    { x: 1, y: 2.5, description: 'Nov 2, 1:00 AM' },
  ];
  const view = render(
    <CustomChart
      data={data}
      color="#1256A0"
      unit="mm"
      seriesNames={['Rain / snow']}
      onInteractionChange={onInteractionChange}
    />,
  );
  fireEvent(screen.getByTestId('chart-plot'), 'layout', {
    nativeEvent: { layout: { width: 280 } },
  });
  const chart = screen.getByRole('adjustable');
  fireEvent(chart, 'responderGrant', { nativeEvent: { locationX: 60 } });
  expect(onInteractionChange).toHaveBeenLastCalledWith(true);
  expect(chart.props.onResponderTerminationRequest()).toBe(false);
  expect(
    within(screen.getByTestId('chart-inspection')).getByText('Nov 2, 12:00 AM'),
  ).toBeTruthy();
  expect(screen.getByTestId('chart-inspection')).toHaveStyle({
    width: 220,
    left: 52,
  });
  expect(screen.getByTestId('chart-inspection-marker').props.cy).toBe(160);
  fireEvent(chart, 'responderMove', {
    nativeEvent: { locationX: 260, locationY: 140 },
  });
  expect(
    within(screen.getByTestId('chart-inspection')).getByText('2.5', {
      exact: false,
    }),
  ).toBeTruthy();
  expect(screen.getByTestId('chart-inspection')).toHaveStyle({ left: 8 });
  fireEvent(chart, 'responderRelease');
  expect(screen.queryByTestId('chart-inspection')).toBeNull();
  expect(onInteractionChange).toHaveBeenLastCalledWith(false);
  fireEvent(chart, 'responderGrant', { nativeEvent: { locationX: 120 } });
  fireEvent(chart, 'responderTerminate');
  expect(screen.queryByTestId('chart-inspection')).toBeNull();
  expect(onInteractionChange).toHaveBeenLastCalledWith(false);
  fireEvent(chart, 'responderGrant', { nativeEvent: { locationX: 120 } });
  view.unmount();
  expect(onInteractionChange).toHaveBeenLastCalledWith(false);
});

it('renders the second series when the first has no measurements, and keeps zero bars at zero', () => {
  (useWeather as jest.Mock).mockReturnValue({
    theme: require('../../utils/weatherTheme').defaultTheme,
  });
  const view = render(
    <CustomChart
      data={[{ x: 0, y: NaN }]}
      data2={[{ x: 0, y: 0 }]}
      color="#123456"
      color2="#654321"
      unit=""
    />,
  );
  expect(screen.getByTestId('svg-path-2')).toBeTruthy();
  expect(screen.queryByText('No valid data points')).toBeNull();
  view.rerender(
    <CustomChart
      data={[
        { x: 0, y: 0 },
        { x: 1, y: 2 },
      ]}
      color="#123456"
      type="bar"
      unit="mm"
    />,
  );
  expect(screen.getAllByTestId('svg-rect')[0].props.height).toBe(0);
});

it('restores single-row clock/date labels and smooth thick curves without dropping samples', () => {
  const { fireEvent } = require('@testing-library/react-native');
  (useWeather as jest.Mock).mockReturnValue({
    theme: require('../../utils/weatherTheme').defaultTheme,
  });
  const data = Array.from({ length: 48 }, (_, x) => ({
    x,
    y: x,
    label:
      x % 12 === 0
        ? x % 24 === 0
          ? x === 0
            ? 'Oct 31'
            : 'Nov 1'
          : '12:00 PM'
        : '',
    dateLabel: x % 24 === 0 ? (x === 0 ? 'Oct 31' : 'Nov 1') : undefined,
  }));
  render(<CustomChart data={data} color="#123456" unit="°C" />);
  fireEvent(screen.getByTestId('chart-plot'), 'layout', {
    nativeEvent: { layout: { width: 260 } },
  });
  const ticks = screen.getAllByTestId('x-label');
  expect(new Set(ticks.map((node) => node.props.y)).size).toBe(1);
  const dates = screen
    .getAllByTestId('x-label')
    .map((node) => node.props.children);
  expect(dates).toContain('Oct 31');
  expect(dates).toContain('Nov 1');
  expect(screen.getByTestId('svg-path').props.strokeWidth).toBe(3);
  expect(screen.getByTestId('svg-path').props.d).toContain('C ');
  expect(screen.getByTestId('svg-path').props.d.match(/[MLC] /g)).toHaveLength(
    48,
  );
});
