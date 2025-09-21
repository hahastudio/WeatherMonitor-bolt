import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert, Text, View } from 'react-native';
import ApiKeySettingsScreen from '../../components/ApiKeySettings';
import { useApiKeys } from '../../contexts/ApiKeyContext';
import { useWeather } from '../../contexts/WeatherContext';
const mockUseApiKeys = useApiKeys as jest.Mock;
const mockUseWeather = useWeather as jest.Mock;

jest.mock('../../contexts/ApiKeyContext');
jest.mock('../../contexts/WeatherContext');
import { weatherService } from '../../services/weatherService';
import { caiyunService } from '../../services/caiyunService';
import { geminiService } from '../../services/geminiService';
import { defaultTheme, WeatherTheme } from '../../utils/weatherTheme';

jest.mock('../../services/weatherService');
jest.mock('../../services/caiyunService');
jest.mock('../../services/geminiService');

jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.Alert.alert = jest.fn((...args) => {});
  const AI = RN.ActivityIndicator;
  const ActivityIndicatorComponent = (props: any) => (
    <AI {...props} testID="activity-indicator" />
  );
  ActivityIndicatorComponent.displayName = 'ActivityIndicator';
  RN.ActivityIndicator = ActivityIndicatorComponent;
  return RN;
});

jest.mock('lucide-react-native', () => {
  const { Text } = require('react-native');
  return {
    CheckCircle: (props: any) => <Text testID="check-icon">CheckCircle</Text>,
    XCircle: (props: any) => <Text testID="x-icon">XCircle</Text>,
    Eye: (props: any) => <Text testID="eye-icon">Eye</Text>,
    EyeOff: (props: any) => <Text testID="eye-off-icon">EyeOff</Text>,
  };
});

jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: jest.fn(),
  }),
}));

jest.mock('expo-linear-gradient', () => {
  const { View } = require('react-native');
  return {
    LinearGradient: ({ children }: { children: React.ReactNode }) => (
      <View testID="linear-gradient">{children}</View>
    ),
  };
});

const mockTheme: WeatherTheme = defaultTheme;

describe('ApiKeySettingsScreen', () => {
  const mockWeatherValidate = weatherService.validateApiKey as jest.Mock;
  const mockCaiyunValidate = caiyunService.validateApiKey as jest.Mock;
  const mockGeminiValidate = geminiService.validateApiKey as jest.Mock;
  const mockAlert = Alert.alert as jest.Mock;
  const mockUpdateApiKeys = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockUseWeather.mockReturnValue({ theme: mockTheme });
    mockUseApiKeys.mockReturnValue({
      updateApiKeys: mockUpdateApiKeys,
      apiKeys: {
        openWeatherMap: 'initial_openWeatherMap',
        caiyun: 'initial_caiyun',
        gemini: 'initial_gemini',
      },
    });
    mockUpdateApiKeys.mockResolvedValue(undefined);
  });

  afterEach(() => {
    // Restore console logs
    jest.restoreAllMocks();
  });

  describe('Rendering and Initialization', () => {
    it('renders correctly and initializes with existing keys', () => {
      const { getByPlaceholderText } = render(<ApiKeySettingsScreen />);

      expect(
        getByPlaceholderText('Enter OpenWeatherMap API key').props.value,
      ).toBe('initial_openWeatherMap');
      expect(getByPlaceholderText('Enter Caiyun API key').props.value).toBe(
        'initial_caiyun',
      );
      expect(getByPlaceholderText('Enter Gemini API key').props.value).toBe(
        'initial_gemini',
      );
    });
  });

  describe('Input Handling', () => {
    it('updates input values on change', () => {
      const { getByPlaceholderText } = render(<ApiKeySettingsScreen />);
      const openWeatherInput = getByPlaceholderText(
        'Enter OpenWeatherMap API key',
      );
      fireEvent.changeText(openWeatherInput, 'new_owm_key');
      expect(openWeatherInput.props.value).toBe('new_owm_key');

      const caiyunInput = getByPlaceholderText('Enter Caiyun API key');
      fireEvent.changeText(caiyunInput, 'new_caiyun_key');
      expect(caiyunInput.props.value).toBe('new_caiyun_key');

      const geminiInput = getByPlaceholderText('Enter Gemini API key');
      fireEvent.changeText(geminiInput, 'new_gemini_key');
      expect(geminiInput.props.value).toBe('new_gemini_key');
    });

    it('toggles secure text entry for OpenWeatherMap', () => {
      const { getByPlaceholderText, getAllByTestId, queryAllByTestId } = render(
        <ApiKeySettingsScreen />,
      );
      const input = getByPlaceholderText('Enter OpenWeatherMap API key');
      expect(input.props.secureTextEntry).toBe(true);
      fireEvent.press(getAllByTestId('eye-off-icon')[0]);
      expect(input.props.secureTextEntry).toBe(false);
      expect(getAllByTestId('eye-off-icon').length).toBe(2);
      expect(queryAllByTestId('eye-icon').length).toBe(1);
    });

    it('toggles secure text entry for Caiyun', () => {
      const { getByPlaceholderText, getAllByTestId, queryAllByTestId } = render(
        <ApiKeySettingsScreen />,
      );
      const input = getByPlaceholderText('Enter Caiyun API key');
      expect(input.props.secureTextEntry).toBe(true);
      fireEvent.press(getAllByTestId('eye-off-icon')[1]);
      expect(input.props.secureTextEntry).toBe(false);
      expect(getAllByTestId('eye-off-icon').length).toBe(2);
      expect(queryAllByTestId('eye-icon').length).toBe(1);
    });

    it('toggles secure text entry for Gemini', () => {
      const { getByPlaceholderText, getAllByTestId, queryAllByTestId } = render(
        <ApiKeySettingsScreen />,
      );
      const input = getByPlaceholderText('Enter Gemini API key');
      expect(input.props.secureTextEntry).toBe(true);
      fireEvent.press(getAllByTestId('eye-off-icon')[2]);
      expect(input.props.secureTextEntry).toBe(false);
      expect(getAllByTestId('eye-off-icon').length).toBe(2);
      expect(queryAllByTestId('eye-icon').length).toBe(1);
    });
  });

  describe('Validation', () => {
    it('shows an alert if validation is attempted with an empty key', async () => {
      mockUseApiKeys.mockReturnValue({
        updateApiKeys: mockUpdateApiKeys,
        apiKeys: {
          openWeatherMap: '',
          caiyun: '',
          gemini: '',
        },
      });

      const { getAllByText, getByPlaceholderText } = render(
        <ApiKeySettingsScreen />,
      );

      fireEvent.changeText(
        getByPlaceholderText('Enter OpenWeatherMap API key'),
        '',
      );

      await act(async () => {
        fireEvent.press(getAllByText('Validate')[0]);
      });

      expect(mockAlert).toHaveBeenCalledWith(
        'Error',
        'Please enter a openWeatherMap API key',
      );

      fireEvent.press(getAllByText('Validate')[1]);
      expect(mockAlert).toHaveBeenCalledWith(
        'Error',
        'Please enter a caiyun API key',
      );

      fireEvent.press(getAllByText('Validate')[2]);
      expect(mockAlert).toHaveBeenCalledWith(
        'Error',
        'Please enter a gemini API key',
      );
    });

    describe('OpenWeatherMap', () => {
      it('handles successful validation', async () => {
        mockWeatherValidate.mockResolvedValue(true);
        const { getAllByText, findByTestId } = render(<ApiKeySettingsScreen />);
        fireEvent.press(getAllByText('Validate')[0]);
        await waitFor(() =>
          expect(mockWeatherValidate).toHaveBeenCalledWith(
            'initial_openWeatherMap',
          ),
        );
        expect(await findByTestId('check-icon')).toBeTruthy();
      });

      it('handles invalid validation', async () => {
        mockWeatherValidate.mockResolvedValue(false);
        const { getAllByText, findByTestId } = render(<ApiKeySettingsScreen />);
        fireEvent.press(getAllByText('Validate')[0]);
        await waitFor(() =>
          expect(mockWeatherValidate).toHaveBeenCalledWith(
            'initial_openWeatherMap',
          ),
        );
        expect(await findByTestId('x-icon')).toBeTruthy();
      });

      it('handles validation failure', async () => {
        mockWeatherValidate.mockRejectedValue(new Error('Validation failed'));
        const { getAllByText, findByTestId } = render(<ApiKeySettingsScreen />);
        fireEvent.press(getAllByText('Validate')[0]);
        await waitFor(() =>
          expect(mockWeatherValidate).toHaveBeenCalledWith(
            'initial_openWeatherMap',
          ),
        );
        expect(await findByTestId('x-icon')).toBeTruthy();
      });
    });

    describe('Caiyun', () => {
      it('handles successful validation', async () => {
        mockCaiyunValidate.mockResolvedValue(true);
        const { getAllByText, findByTestId } = render(<ApiKeySettingsScreen />);
        fireEvent.press(getAllByText('Validate')[1]);
        await waitFor(() =>
          expect(mockCaiyunValidate).toHaveBeenCalledWith('initial_caiyun'),
        );
        expect(await findByTestId('check-icon')).toBeTruthy();
      });

      it('handles invalid validation', async () => {
        mockCaiyunValidate.mockResolvedValue(false);
        const { getAllByText, findByTestId } = render(<ApiKeySettingsScreen />);
        fireEvent.press(getAllByText('Validate')[1]);
        await waitFor(() =>
          expect(mockCaiyunValidate).toHaveBeenCalledWith('initial_caiyun'),
        );
        expect(await findByTestId('x-icon')).toBeTruthy();
      });

      it('handles validation failure', async () => {
        mockCaiyunValidate.mockRejectedValue(new Error('Validation failed'));
        const { getAllByText, findByTestId } = render(<ApiKeySettingsScreen />);
        fireEvent.press(getAllByText('Validate')[1]);
        await waitFor(() =>
          expect(mockCaiyunValidate).toHaveBeenCalledWith('initial_caiyun'),
        );
        expect(await findByTestId('x-icon')).toBeTruthy();
      });
    });

    describe('Gemini', () => {
      it('handles successful validation', async () => {
        mockGeminiValidate.mockResolvedValue(true);
        const { getAllByText, findByTestId } = render(<ApiKeySettingsScreen />);
        fireEvent.press(getAllByText('Validate')[2]);
        await waitFor(() =>
          expect(mockGeminiValidate).toHaveBeenCalledWith('initial_gemini'),
        );
        expect(await findByTestId('check-icon')).toBeTruthy();
      });

      it('handles invalid validation', async () => {
        mockGeminiValidate.mockResolvedValue(false);
        const { getAllByText, findByTestId } = render(<ApiKeySettingsScreen />);
        fireEvent.press(getAllByText('Validate')[2]);
        await waitFor(() =>
          expect(mockGeminiValidate).toHaveBeenCalledWith('initial_gemini'),
        );
        expect(await findByTestId('x-icon')).toBeTruthy();
      });

      it('handles validation failure', async () => {
        mockGeminiValidate.mockRejectedValue(new Error('Validation failed'));
        const { getAllByText, findByTestId } = render(<ApiKeySettingsScreen />);
        fireEvent.press(getAllByText('Validate')[2]);
        await waitFor(() =>
          expect(mockGeminiValidate).toHaveBeenCalledWith('initial_gemini'),
        );
        expect(await findByTestId('x-icon')).toBeTruthy();
      });
    });
  });

  describe('Saving', () => {
    it('saves the API keys through context and shows success message', async () => {
      mockUpdateApiKeys.mockResolvedValueOnce(undefined);

      const { getByText, getByPlaceholderText } = render(
        <ApiKeySettingsScreen />,
      );

      // Fill in the form
      fireEvent.changeText(
        getByPlaceholderText('Enter OpenWeatherMap API key'),
        'new_owm_key',
      );
      fireEvent.changeText(
        getByPlaceholderText('Enter Caiyun API key'),
        'new_caiyun_key',
      );
      fireEvent.changeText(
        getByPlaceholderText('Enter Gemini API key'),
        'new_gemini_key',
      );

      // Submit the form
      fireEvent.press(getByText('Save Changes'));

      // Verify the results
      await waitFor(() => {
        expect(mockUpdateApiKeys).toHaveBeenCalledWith({
          openWeatherMap: 'new_owm_key',
          caiyun: 'new_caiyun_key',
          gemini: 'new_gemini_key',
        });
      });

      expect(mockAlert).toHaveBeenCalledWith(
        'Success',
        'API keys saved successfully.',
      );
    });

    it('handles failure when saving API keys', async () => {
      // Mock the updateApiKeys function to throw an error
      mockUpdateApiKeys.mockRejectedValueOnce(new Error('Failed to save'));

      const { getByText } = render(<ApiKeySettingsScreen />);

      // Submit the form
      await act(async () => {
        fireEvent.press(getByText('Save Changes'));
      });

      // Verify error handling
      expect(mockUpdateApiKeys).toHaveBeenCalled();
      expect(mockAlert).toHaveBeenCalledWith(
        'Error',
        'Failed to save API keys',
      );
    });
  });
});
