import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react-native';
import { useWeather } from '../contexts/WeatherContext';
import { useApiKeys } from '../contexts/ApiKeyContext';
import { ApiKeys } from '../types/weather';
import { weatherService } from '../services/weatherService';
import { caiyunService } from '../services/caiyunService';
import { geminiService } from '../services/geminiService';

type ValidationStatus = 'idle' | 'validating' | 'valid' | 'invalid';

// This component doesn't accept any props
type ApiKeySettingsProps = object;

const ApiKeySettingsScreen: React.FC<ApiKeySettingsProps> = () => {
  const router = useRouter();
  const { theme } = useWeather();
  const { updateApiKeys, apiKeys } = useApiKeys();
  const [keys, setKeys] = useState<ApiKeys>({
    openWeatherMap: apiKeys?.openWeatherMap || '',
    caiyun: apiKeys?.caiyun || '',
    gemini: apiKeys?.gemini || '',
  });

  const [secureTextEntry, setSecureTextEntry] = useState({
    openWeatherMap: true,
    caiyun: true,
    gemini: true,
  });

  const [validationStatus, setValidationStatus] = useState<{
    openWeatherMap: ValidationStatus;
    caiyun: ValidationStatus;
    gemini: ValidationStatus;
  }>({
    openWeatherMap: 'idle',
    caiyun: 'idle',
    gemini: 'idle',
  });

  const toggleSecureTextEntry = (service: keyof ApiKeys) => {
    setSecureTextEntry((prev) => ({ ...prev, [service]: !prev[service] }));
  };

  const validateKey = async (service: keyof ApiKeys) => {
    if (!keys[service]) {
      Alert.alert('Error', `Please enter a ${String(service)} API key`);
      return;
    }

    setValidationStatus((prev) => ({ ...prev, [service]: 'validating' }));
    let isValid = false;
    try {
      switch (service) {
        case 'openWeatherMap':
          isValid = await weatherService.validateApiKey(keys.openWeatherMap);
          break;
        case 'caiyun':
          isValid = await caiyunService.validateApiKey(keys.caiyun);
          break;
        case 'gemini':
          isValid = await geminiService.validateApiKey(keys.gemini);
          break;
      }

      setValidationStatus((prev) => ({
        ...prev,
        [service]: isValid ? 'valid' : 'invalid',
      }));
    } catch (err) {
      console.error(`Failed to validate ${String(service)} API key:`, err);
      setValidationStatus((prev) => ({
        ...prev,
        [service]: 'invalid',
      }));
    }
  };

  const handleSave = async () => {
    try {
      await updateApiKeys(keys);
      Alert.alert('Success', 'API keys saved successfully.');
      router.replace('/(tabs)');
    } catch (err) {
      console.error('Failed to save API keys:', err);
      Alert.alert('Error', 'Failed to save API keys');
    }
  };

  const renderValidationStatus = (service: keyof ApiKeys) => {
    switch (validationStatus[service]) {
      case 'validating':
        return <ActivityIndicator size="small" color={theme.primary} />;
      case 'valid':
        return <CheckCircle size={24} color={theme.primary} />;
      case 'invalid':
        return <XCircle size={24} color={theme.accent} />;
      default:
        return null;
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    gradient: {
      flex: 1,
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 60,
      paddingBottom: 100,
    },
    section: {
      marginBottom: 16,
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 20,
      fontWeight: '600',
      marginBottom: 8,
    },
    sectionDescription: {
      color: theme.textSecondary,
      fontSize: 14,
      marginBottom: 12,
      lineHeight: 20,
    },
    inputContainer: {
      backgroundColor: theme.surface + '90',
      borderRadius: 12,
      padding: 16,
      marginBottom: 8,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.background,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.textSecondary + '40',
    },
    input: {
      flex: 1,
      color: theme.text,
      fontSize: 16,
      padding: 12,
    },
    eyeButton: {
      padding: 12,
    },
    actionsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 16,
    },
    validateButton: {
      backgroundColor: theme.primary + '20',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 6,
      marginRight: 12,
    },
    validateButtonText: {
      color: theme.primary,
      fontSize: 14,
      fontWeight: '600',
    },
    saveButton: {
      backgroundColor: theme.primary + '20',
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginHorizontal: 20,
      marginTop: 16,
    },
    saveButtonText: {
      color: theme.primary,
      fontSize: 16,
      fontWeight: '600',
    },
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.gradientStart, theme.gradientEnd]}
        style={styles.gradient}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {/* OpenWeatherMap API Key */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>OpenWeatherMap API Key</Text>
            <Text style={styles.sectionDescription}>
              Required for current weather and forecast data. Get your API key
              from the OpenWeatherMap website.
            </Text>
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={keys.openWeatherMap}
                  onChangeText={(text) =>
                    setKeys({ ...keys, openWeatherMap: text })
                  }
                  placeholder="Enter OpenWeatherMap API key"
                  placeholderTextColor={theme.textSecondary}
                  autoCapitalize="none"
                  autoCorrect={false}
                  secureTextEntry={secureTextEntry.openWeatherMap}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => toggleSecureTextEntry('openWeatherMap')}
                >
                  {secureTextEntry.openWeatherMap ? (
                    <EyeOff size={20} color={theme.textSecondary} />
                  ) : (
                    <Eye size={20} color={theme.textSecondary} />
                  )}
                </TouchableOpacity>
              </View>
              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  style={styles.validateButton}
                  onPress={() => validateKey('openWeatherMap')}
                >
                  <Text style={styles.validateButtonText}>Validate</Text>
                </TouchableOpacity>
                {renderValidationStatus('openWeatherMap')}
              </View>
            </View>
          </View>

          {/* Caiyun API Key */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Caiyun API Key</Text>
            <Text style={styles.sectionDescription}>
              Required for weather alerts in China. Get your API key from the
              Caiyun Weather website.
            </Text>
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={keys.caiyun}
                  onChangeText={(text) => setKeys({ ...keys, caiyun: text })}
                  placeholder="Enter Caiyun API key"
                  placeholderTextColor={theme.textSecondary}
                  autoCapitalize="none"
                  autoCorrect={false}
                  secureTextEntry={secureTextEntry.caiyun}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => toggleSecureTextEntry('caiyun')}
                >
                  {secureTextEntry.caiyun ? (
                    <EyeOff size={20} color={theme.textSecondary} />
                  ) : (
                    <Eye size={20} color={theme.textSecondary} />
                  )}
                </TouchableOpacity>
              </View>
              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  style={styles.validateButton}
                  onPress={() => validateKey('caiyun')}
                >
                  <Text style={styles.validateButtonText}>Validate</Text>
                </TouchableOpacity>
                {renderValidationStatus('caiyun')}
              </View>
            </View>
          </View>

          {/* Gemini API Key */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Gemini API Key</Text>
            <Text style={styles.sectionDescription}>
              Required for weather summaries and recommendations. Get your API
              key from the Google Cloud Console.
            </Text>
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={keys.gemini}
                  onChangeText={(text) => setKeys({ ...keys, gemini: text })}
                  placeholder="Enter Gemini API key"
                  placeholderTextColor={theme.textSecondary}
                  autoCapitalize="none"
                  autoCorrect={false}
                  secureTextEntry={secureTextEntry.gemini}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => toggleSecureTextEntry('gemini')}
                >
                  {secureTextEntry.gemini ? (
                    <EyeOff size={20} color={theme.textSecondary} />
                  ) : (
                    <Eye size={20} color={theme.textSecondary} />
                  )}
                </TouchableOpacity>
              </View>
              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  style={styles.validateButton}
                  onPress={() => validateKey('gemini')}
                >
                  <Text style={styles.validateButtonText}>Validate</Text>
                </TouchableOpacity>
                {renderValidationStatus('gemini')}
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

export default ApiKeySettingsScreen;
