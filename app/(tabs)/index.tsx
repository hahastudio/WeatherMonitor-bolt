import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  MapPin,
  Eye,
  Droplets,
  Sunrise,
  Sunset,
  RefreshCw,
  CloudRain,
  CloudSnow,
  Clock,
  Gauge,
  AirVent,
  MousePointer2,
} from 'lucide-react-native';
import { useWeather } from '../../contexts/WeatherContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorDisplay } from '../../components/ErrorDisplay';
import { WeatherIcon } from '../../components/WeatherIcon';
import { WeatherAlerts } from '../../components/WeatherAlerts';
import { WeatherSummary } from '../../components/WeatherSummary';
import {
  formatTemperature,
  formatTime,
  capitalizeWords,
} from '../../utils/weatherTheme';

const windSectors = [
  'N',
  'NNE',
  'NE',
  'ENE',
  'E',
  'ESE',
  'SE',
  'SSE',
  'S',
  'SSW',
  'SW',
  'WSW',
  'W',
  'WNW',
  'NW',
  'NNW',
  'N',
];

export default function HomeScreen() {
  const {
    currentWeather,
    weatherAlerts,
    weatherAirQuality,
    cityName,
    loading,
    error,
    theme,
    lastUpdated,
    refreshWeather,
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

  const formatLastUpdated = (timestamp: number | null): string => {
    if (!timestamp) return 'Never';

    const now = Date.now();
    const diffMs = now - timestamp;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);

    if (diffMinutes < 1) {
      return 'Just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return new Date(timestamp).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    }
  };

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
      marginBottom: 8,
    },
    locationText: {
      color: theme.text,
      fontSize: 18,
      fontWeight: '600',
      marginLeft: 8,
    },
    lastUpdatedContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
      opacity: 0.8,
    },
    lastUpdatedText: {
      color: theme.textSecondary,
      fontSize: 14,
      marginLeft: 6,
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
    value: string,
  ) => (
    <View style={styles.detailCard}>
      <View style={styles.detailIcon}>{icon}</View>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );

  // Get wind direction
  const pos = ((currentWeather.wind.deg % 360) / 22.5) | 0;
  const windDirection = windSectors[pos];

  // Check if there's current rain data
  const hasRainData = currentWeather.rain?.['1h'];
  const rainAmount = hasRainData ? currentWeather.rain?.['1h'] : 0;

  // Check if there's current snow data
  const hasSnowData = currentWeather.snow?.['1h'];
  const snowAmount = hasSnowData ? currentWeather.snow?.['1h'] : 0;

  // Check if there's current air quality data
  const hasAirQualityData = weatherAirQuality?.aqi?.usa !== undefined;

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

            <View style={styles.lastUpdatedContainer}>
              <Clock size={14} color={theme.textSecondary} />
              <Text style={styles.lastUpdatedText}>
                Updated {formatLastUpdated(lastUpdated)}
              </Text>
            </View>

            <View style={styles.mainWeatherContainer}>
              <WeatherIcon
                weatherMain={currentWeather.weather[0].main}
                size={120}
                color={theme.primary}
                isNight={
                  new Date().getTime() / 1000 < currentWeather.sys.sunrise ||
                  new Date().getTime() / 1000 > currentWeather.sys.sunset
                }
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
                H:{formatTemperature(currentWeather.main.temp_max)} L:
                {formatTemperature(currentWeather.main.temp_min)}
              </Text>
            </View>
          </View>

          <View style={styles.content}>
            {/* AI Weather Summary */}
            <WeatherSummary />

            {/* Weather Alerts Section */}
            {weatherAlerts.length > 0 && (
              <WeatherAlerts alerts={weatherAlerts} />
            )}

            <Text style={styles.sectionTitle}>Details</Text>

            <View style={styles.detailsGrid}>
              {/* Show rain amount if there's current rain data */}
              {!hasSnowData &&
                renderDetailCard(
                  <CloudRain size={24} color={theme.primary} />,
                  'Rain (1h)',
                  `${rainAmount!.toFixed(1)} mm`,
                )}

              {/* Show snow amount if there's current rain data */}
              {!hasRainData &&
                hasSnowData &&
                renderDetailCard(
                  <CloudSnow size={24} color={theme.primary} />,
                  'Snow (1h)',
                  `${snowAmount!.toFixed(1)} mm`,
                )}

              {/* Show rain & snow amount if there's current rain data */}
              {hasRainData &&
                hasSnowData &&
                renderDetailCard(
                  <CloudSnow size={24} color={theme.primary} />,
                  'Rain/Snow (1h)',
                  `${((rainAmount || 0) + (snowAmount || 0)).toFixed(1)} mm`,
                )}

              {renderDetailCard(
                <View
                  style={{
                    transform: [
                      { rotate: `${currentWeather.wind.deg + 225}deg` },
                    ],
                  }}
                >
                  <MousePointer2 size={24} color={theme.primary} />
                </View>,
                'Wind',
                `${(currentWeather.wind.speed * 3.6).toFixed(1)} km/h ${windDirection}`,
              )}

              {/* Show air quality data if available */}
              {hasAirQualityData &&
                renderDetailCard(
                  <AirVent size={24} color={theme.primary} />,
                  'Air Quality',
                  `AQI ${weatherAirQuality.aqi.usa.toFixed(1)}`,
                )}

              {renderDetailCard(
                <Eye size={24} color={theme.primary} />,
                'Visibility',
                `${(currentWeather.visibility / 1000).toFixed(1)} km`,
              )}

              {renderDetailCard(
                <Droplets size={24} color={theme.primary} />,
                'Humidity',
                `${currentWeather.main.humidity.toFixed(1)}%`,
              )}

              {renderDetailCard(
                <Gauge size={24} color={theme.primary} />,
                'Pressure',
                `${currentWeather.main.pressure.toFixed(1)} hPa`,
              )}

              {renderDetailCard(
                <Sunrise size={24} color={theme.primary} />,
                'Sunrise',
                formatTime(currentWeather.sys.sunrise),
              )}

              {renderDetailCard(
                <Sunset size={24} color={theme.primary} />,
                'Sunset',
                formatTime(currentWeather.sys.sunset),
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
