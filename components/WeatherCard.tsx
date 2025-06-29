import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useWeather } from '../contexts/WeatherContext';
import { WeatherIcon } from './WeatherIcon';
import { formatTemperature, capitalizeWords } from '../utils/weatherTheme';

interface WeatherCardProps {
  title: string;
  temperature: number;
  description: string;
  weatherMain: string;
  time?: string;
  showDetails?: boolean;
  humidity?: number;
  windSpeed?: number;
}

export const WeatherCard: React.FC<WeatherCardProps> = ({
  title,
  temperature,
  description,
  weatherMain,
  time,
  showDetails = false,
  humidity,
  windSpeed,
}) => {
  const { theme } = useWeather();

  const styles = StyleSheet.create({
    card: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 16,
      marginVertical: 8,
      // Use Platform.select to prevent Android grey borders
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        android: {
          elevation: 3,
        },
        web: {
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        },
      }),
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    title: {
      color: theme.text,
      fontSize: 18,
      fontWeight: '600',
    },
    time: {
      color: theme.textSecondary,
      fontSize: 14,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    leftContent: {
      flex: 1,
    },
    temperatureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    temperature: {
      color: theme.text,
      fontSize: 32,
      fontWeight: '700',
      lineHeight: 38,
      marginRight: 12, // Space between temperature and icon
    },
    iconContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: -2, // Fine-tune vertical alignment with temperature
    },
    description: {
      color: theme.textSecondary,
      fontSize: 16,
      marginBottom: showDetails ? 8 : 0,
    },
    details: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    detailItem: {
      alignItems: 'center',
    },
    detailLabel: {
      color: theme.textSecondary,
      fontSize: 12,
      marginBottom: 2,
    },
    detailValue: {
      color: theme.text,
      fontSize: 14,
      fontWeight: '600',
    },
  });

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {time && <Text style={styles.time}>{time}</Text>}
      </View>
      
      <View style={styles.content}>
        <View style={styles.leftContent}>
          <View style={styles.temperatureRow}>
            <Text style={styles.temperature}>
              {formatTemperature(temperature)}
            </Text>
            <View style={styles.iconContainer}>
              <WeatherIcon 
                weatherMain={weatherMain}
                size={64}
                color={theme.primary}
              />
            </View>
          </View>
          
          <Text style={styles.description}>
            {capitalizeWords(description)}
          </Text>
          
          {showDetails && (humidity !== undefined || windSpeed !== undefined) && (
            <View style={styles.details}>
              {humidity !== undefined && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Humidity</Text>
                  <Text style={styles.detailValue}>{humidity}%</Text>
                </View>
              )}
              {windSpeed !== undefined && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Wind</Text>
                  <Text style={styles.detailValue}>{windSpeed} m/s</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </View>
  );
};