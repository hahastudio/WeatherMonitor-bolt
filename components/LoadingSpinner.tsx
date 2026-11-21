import React from 'react';
import { ActivityIndicator, Text, StyleSheet } from 'react-native';
import { GlassSurface } from './GlassSurface';
import { useWeather } from '../contexts/WeatherContext';

interface LoadingSpinnerProps {
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading weather data...',
}) => {
  const { theme } = useWeather();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    text: {
      color: theme.text,
      fontSize: 16,
      marginTop: 16,
      textAlign: 'center',
    },
  });

  return (
    <GlassSurface theme={theme} opaque style={styles.container}>
      <ActivityIndicator size="large" color={theme.primary} />
      <Text style={styles.text}>{message}</Text>
    </GlassSurface>
  );
};
