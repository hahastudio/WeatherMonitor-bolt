import React from 'react';
import { render, screen } from '@testing-library/react-native';
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
    expect(await screen.findByText('Standard (1013 hPa)')).toBeTruthy();
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
    const labels = await screen.findAllByText(/25°C/);
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
});
