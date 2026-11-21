import React from 'react';
import { View, Text, ScrollView, StyleSheet, FlexStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MousePointer2 } from 'lucide-react-native';
import { useWeather } from '../../contexts/WeatherContext';
import { GlassSurface } from '../../components/GlassSurface';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { WeatherIcon } from '../../components/WeatherIcon';
import { formatTime } from '../../utils/weatherTheme';

export function ForecastContent() {
  const { forecast, loading, theme } = useWeather();

  if (!forecast) {
    return loading ? (
      <LoadingSpinner message="Loading forecast data..." />
    ) : (
      <Text style={{ color: theme.heroSecondary, textAlign: 'center' }}>
        No forecast available
      </Text>
    );
  }

  const styles = StyleSheet.create({
    content: {
      flexGrow: 1,
      gap: 12,
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 20,
      fontWeight: '600',
      marginBottom: 12,
    },
    // Hourly forecast styles
    hourlyContainer: {
      padding: 14,
    },
    hourlyScrollView: {
      paddingVertical: 8,
    },
    hourlyItem: {
      borderRadius: 12,
      padding: 6,
      marginRight: 8,
      alignItems: 'center',
      minWidth: 80,
      // Remove shadow/elevation to prevent Android grey borders
    },
    hourlyTime: {
      color: theme.textSecondary,
      fontSize: 12,
      fontWeight: '500',
      marginBottom: 8,
    },
    hourlyIcon: {
      marginBottom: 8,
    },
    hourlyTemp: {
      color: theme.text,
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 4,
    },
    hourlyPrecip: {
      color: theme.primary,
      fontSize: 12,
      fontWeight: '500',
    },
    windContainer: {
      alignItems: 'center',
      marginTop: 4,
      marginBottom: 4,
    },
    windIcon: {
      marginBottom: 2,
    },
    windSpeed: {
      color: theme.textSecondary,
      fontSize: 10,
      fontWeight: '500',
      textAlign: 'center',
    },
    // Seven-day forecast styles
    dailyContainer: {
      flexGrow: 1,
      padding: 14,
    },
    dailyItem: {
      minHeight: 64,
      paddingVertical: 6,
      borderTopWidth: 1,
      borderTopColor: theme.divider,
      flexDirection: 'row',
      alignItems: 'center',
      // Remove shadow/elevation to prevent Android grey borders
    },
    dailyLeft: {
      width: 62,
      marginRight: 10,
    },
    dailyDate: {
      color: theme.text,
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 2,
    },
    dailyDesc: {
      color: theme.textSecondary,
      fontSize: 14,
    },
    dailyCenter: {
      flex: 1,
      alignItems: 'center',
      marginRight: 10,
    },
    dailyRight: {
      alignItems: 'center',
      width: 76,
    },
    tempRange: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
      width: '100%',
    },
    tempLow: {
      color: theme.textSecondary,
      fontSize: 16,
      fontWeight: '500',
      marginRight: 8,
    },
    tempHigh: {
      color: theme.text,
      fontSize: 16,
      fontWeight: '700',
    },
    tempBar: {
      height: 4,
      backgroundColor: theme.textSecondary + '20',
      borderRadius: 2,
      marginBottom: 4,
      width: '100%',
    },
    tempBarFill: {
      height: '100%',
      borderRadius: 2,
    },
    precipChance: {
      flex: 1,
      color: theme.primary,
      fontSize: 12,
      fontWeight: '500',
      fontVariant: ['tabular-nums'],
    },
    precipRow: { flexDirection: 'row', gap: 4, width: '100%' },
  });

  // Get next 48 hours forecast
  const next48Hours = forecast.hourly;

  // Keep every daily forecast row visible.
  const dailyForecast = forecast.daily.map((dayItem) => {
    return {
      date: dayItem.dt,
      weather: dayItem.weather[0],
      maxTemp: dayItem.main.temp_max,
      minTemp: dayItem.main.temp_min,
      precipChance: dayItem.pop * 100, // Convert to percentage
      rain: (dayItem.rain || 0) + (dayItem.snow || 0), // Combine rain and snow
    };
  });

  // Calculate temperature range for the bar visualization
  const allTemps = dailyForecast.flatMap((day) => [day.maxTemp, day.minTemp]);
  const globalMin = Math.min(...allTemps);
  const globalMax = Math.max(...allTemps);
  const globalMiddle = (globalMin + globalMax) / 2.0;
  const tempRange = Math.max(globalMax - globalMin, 10.0);
  const fixedGlobalMin = globalMiddle - tempRange / 2.0;
  // const fixedGlobalMax = globalMiddle + tempRange / 2.0;

  const getTempBarGradient = (minTemp: number, maxTemp: number): FlexStyle => {
    const minPosition = ((minTemp - fixedGlobalMin) / tempRange) * 100;
    const maxPosition = ((maxTemp - fixedGlobalMin) / tempRange) * 100;

    return {
      marginLeft: `${minPosition}%`,
      width: `${maxPosition - minPosition}%`,
    };
  };

  const formatDayName = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    }
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <View style={styles.content}>
      {/* 48-Hour Forecast */}
      <GlassSurface theme={theme} style={styles.hourlyContainer}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          Next 48 Hours
        </Text>
        {next48Hours.length === 0 && (
          <Text style={{ color: theme.textSecondary }}>
            No hourly forecast data available
          </Text>
        )}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.hourlyScrollView}
          contentContainerStyle={{ paddingRight: 20 }}
        >
          {next48Hours.map((item, index) => (
            <View key={index} testID="forecast-hour" style={styles.hourlyItem}>
              <Text style={styles.hourlyTime}>
                {index === 0 ? 'Now' : formatTime(item.dt)}
              </Text>

              <View style={styles.hourlyIcon}>
                <WeatherIcon
                  weatherMain={item.weather[0].main}
                  size={32}
                  color={theme.primary}
                  isNight={
                    item.sys.sunrise !== undefined &&
                    item.sys.sunset !== undefined
                      ? item.dt < item.sys.sunrise || item.dt >= item.sys.sunset
                      : item.weather[0].icon.endsWith('n')
                  }
                />
              </View>

              <Text style={styles.hourlyTemp}>
                {Math.round(item.main.temp)}°
              </Text>

              <Text style={styles.hourlyPrecip}>
                {Math.round(item.pop * 100)}%
              </Text>

              <Text style={styles.hourlyPrecip}>
                {((item.rain?.['1h'] || 0) + (item.snow?.['1h'] || 0)).toFixed(
                  1,
                )}{' '}
                mm
              </Text>

              <View style={styles.windContainer}>
                <View
                  style={[
                    styles.windIcon,
                    {
                      transform: [{ rotate: `${item.wind.deg + 225}deg` }],
                    },
                  ]}
                >
                  <MousePointer2 size={16} color={theme.textSecondary} />
                </View>
                <Text style={styles.windSpeed}>
                  {(item.wind.speed * 3.6).toFixed(1)} km/h
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </GlassSurface>

      {/* 7-Day Forecast */}
      <GlassSurface theme={theme} style={styles.dailyContainer}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          7-Day Forecast
        </Text>
        {dailyForecast.length === 0 && (
          <Text style={{ color: theme.textSecondary }}>
            No daily forecast data available
          </Text>
        )}
        {dailyForecast.map((day, index) => (
          <View
            key={index}
            style={styles.dailyItem}
            testID="forecast-day"
            accessible
            accessibilityLabel={`${formatDayName(day.date)}, ${formatDate(day.date)}, ${day.weather.description}, low ${Math.round(day.minTemp)}°, high ${Math.round(day.maxTemp)}°, rain ${Math.round(day.precipChance)}%, ${day.rain.toFixed(1)} millimetres`}
          >
            <View style={styles.dailyLeft}>
              <Text style={styles.dailyDate}>{formatDayName(day.date)}</Text>
              <Text style={styles.dailyDesc}>{formatDate(day.date)}</Text>
            </View>

            <View style={styles.dailyCenter}>
              <View style={styles.tempRange}>
                <Text style={styles.tempLow}>{Math.round(day.minTemp)}°</Text>
                <Text style={styles.tempHigh}>{Math.round(day.maxTemp)}°</Text>
              </View>

              <View testID="forecast-temperature-track" style={styles.tempBar}>
                <LinearGradient
                  colors={[theme.primary + '60', theme.primary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.tempBarFill,
                    getTempBarGradient(day.minTemp, day.maxTemp),
                  ]}
                />
              </View>
            </View>

            <View style={styles.dailyRight}>
              <WeatherIcon
                weatherMain={day.weather.main}
                size={24}
                color={theme.primary}
                isNight={false} // Daily forecast icons should always show daytime weather
              />
              {[
                [`${Math.round(day.precipChance)}%`, 'rain'],
                [day.rain.toFixed(1), 'mm'],
              ].map(([amount, unit]) => (
                <View
                  key={unit}
                  testID="forecast-precipitation-row"
                  style={styles.precipRow}
                >
                  <Text style={[styles.precipChance, { textAlign: 'right' }]}>
                    {amount}
                  </Text>
                  <Text style={[styles.precipChance, { textAlign: 'left' }]}>
                    {unit}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </GlassSurface>
    </View>
  );
}

// Forecast shares the persistent Weather workspace in the adaptive navigator.
export default function ForecastRoute() {
  return null;
}
