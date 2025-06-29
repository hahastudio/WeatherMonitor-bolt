import React from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, Eye, Droplets, Wind, Sunrise, Sunset, RefreshCw } from 'lucide-react-native';
import { useWeather } from '../../contexts/WeatherContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorDisplay } from '../../components/ErrorDisplay';
import { WeatherCard } from '../../components/WeatherCard';
import { WeatherIcon } from '../../components/WeatherIcon';
import { WeatherAlerts } from '../../components/WeatherAlerts';
import { formatTemperature, formatTime, capitalizeWords } from '../../utils/weatherTheme';

export default function HomeScreen() {
  const { 
    currentWeather, 
    weatherAlerts,
    cityName, 
    loading, 
    error, 
    theme, 
    refreshWeather,
    dismissAlert
  } = useWeather();

  if (loading && !currentWeather) {
    return <LoadingSpinner message="Getting your location and weather..." />;
  }

  if (error && !currentWeather) {
    return <ErrorDisplay error={error} onRetry={refreshWeather} />;
  }

  if (!currentWeather) {
    return <LoadingSpinner message="Loading weather data..." />;
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    gradient: {
      flex: 1,
      paddingTop: 60,
    },
    header: {
      alignItems: 'center',
      paddingHorizontal: 20,
      marginBottom: 30,
    },
    refreshButton: {
      position: 'absolute',
      top: 20,
      right: 20,
      backgroundColor: theme.surface + '80',
      borderRadius: 25,
      padding: 10,
    },
    locationContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    locationText: {
      color: theme.text,
      fontSize: 18,
      fontWeight: '600',
      marginLeft: 8,
    },
    mainWeatherContainer: {
      alignItems: 'center',
      marginBottom: 20,
    },
    temperature: {
      color: theme.text,
      fontSize: 72,
      fontWeight: '300',
      marginVertical: 16,
    },
    description: {
      color: theme.textSecondary,
      fontSize: 20,
      fontWeight: '500',
      textAlign: 'center',
      marginBottom: 8,
    },
    feelsLike: {
      color: theme.textSecondary,
      fontSize: 16,
    },
    tempRange: {
      color: theme.textSecondary,
      fontSize: 16,
      marginTop: 4,
    },
    content: {
      paddingHorizontal: 20,
      paddingBottom: 100,
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 20,
      fontWeight: '600',
      marginBottom: 16,
      marginTop: 20,
    },
    detailsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginTop: 10,
    },
    detailCard: {
      backgroundColor: theme.surface + '80',
      borderRadius: 12,
      padding: 16,
      width: '48%',
      marginBottom: 12,
      alignItems: 'center',
    },
    detailLabel: {
      color: theme.textSecondary,
      fontSize: 14,
      marginBottom: 8,
      textAlign: 'center',
    },
    detailValue: {
      color: theme.text,
      fontSize: 18,
      fontWeight: '600',
      textAlign: 'center',
    },
    detailIcon: {
      marginBottom: 8,
    },
  });

  const renderDetailCard = (
    icon: React.ReactNode,
    label: string,
    value: string
  ) => (
    <View style={styles.detailCard}>
      <View style={styles.detailIcon}>
        {icon}
      </View>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.gradientStart, theme.gradientEnd]}
        style={styles.gradient}
      >
        <TouchableOpacity style={styles.refreshButton} onPress={refreshWeather}>
          <RefreshCw size={20} color={theme.text} />
        </TouchableOpacity>

        <ScrollView 
          style={styles.scrollView}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={refreshWeather}
              tintColor={theme.primary}
              colors={[theme.primary]}
            />
          }
        >
          <View style={styles.header}>
            <View style={styles.locationContainer}>
              <MapPin size={20} color={theme.text} />
              <Text style={styles.locationText}>{cityName}</Text>
            </View>

            <View style={styles.mainWeatherContainer}>
              <WeatherIcon 
                weatherMain={currentWeather.weather[0].main}
                size={120}
                color={theme.primary}
              />
              <Text style={styles.temperature}>
                {formatTemperature(currentWeather.main.temp)}
              </Text>
              <Text style={styles.description}>
                {capitalizeWords(currentWeather.weather[0].description)}
              </Text>
              <Text style={styles.feelsLike}>
                Feels like {formatTemperature(currentWeather.main.feels_like)}
              </Text>
              <Text style={styles.tempRange}>
                H:{formatTemperature(currentWeather.main.temp_max)} L:{formatTemperature(currentWeather.main.temp_min)}
              </Text>
            </View>
          </View>

          {/* Weather Alerts Section */}
          {weatherAlerts.length > 0 && (
            <WeatherAlerts 
              alerts={weatherAlerts} 
              onDismiss={dismissAlert}
            />
          )}

          <View style={styles.content}>
            <Text style={styles.sectionTitle}>Details</Text>
            
            <View style={styles.detailsGrid}>
              {renderDetailCard(
                <Eye size={24} color={theme.primary} />,
                'Visibility',
                `${(currentWeather.visibility / 1000).toFixed(1)} km`
              )}
              
              {renderDetailCard(
                <Droplets size={24} color={theme.primary} />,
                'Humidity',
                `${currentWeather.main.humidity}%`
              )}
              
              {renderDetailCard(
                <Wind size={24} color={theme.primary} />,
                'Wind Speed',
                `${currentWeather.wind.speed} m/s`
              )}
              
              {renderDetailCard(
                <Wind size={24} color={theme.primary} />,
                'Pressure',
                `${currentWeather.main.pressure} hPa`
              )}
              
              {renderDetailCard(
                <Sunrise size={24} color={theme.primary} />,
                'Sunrise',
                formatTime(currentWeather.sys.sunrise)
              )}
              
              {renderDetailCard(
                <Sunset size={24} color={theme.primary} />,
                'Sunset',
                formatTime(currentWeather.sys.sunset)
              )}
            </View>

            {error && (
              <View style={{ marginTop: 20 }}>
                <Text style={[styles.sectionTitle, { color: theme.accent }]}>
                  ⚠️ {error}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}