import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import WelcomeScreen from '../../app/welcome';

// Mock expo-router
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

describe('WelcomeScreen', () => {
  it('renders correctly', () => {
    const { getByText } = render(<WelcomeScreen />);
    expect(getByText('Welcome to WeatherMonitor')).toBeTruthy();
    expect(
      getByText(
        'To get started, you need to configure your API keys for the weather and AI services. These keys will enable real-time weather data, forecasts, and AI-powered summaries.',
      ),
    ).toBeTruthy();
    expect(getByText('Configure API Keys')).toBeTruthy();
  });

  it('navigates to settings on button press', () => {
    const { getByText } = render(<WelcomeScreen />);
    fireEvent.press(getByText('Configure API Keys'));
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)/settings');
  });
});
