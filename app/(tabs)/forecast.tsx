import React from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, Platform, FlexStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useWeather } from '../../contexts/WeatherContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorDisplay } from '../../components/ErrorDisplay';
import { WeatherIcon } from '../../components/WeatherIcon';
import { formatDate, formatTime } from '../../utils/weatherTheme';

export default function ForecastScreen() {
  const { 
    forecast, 
    loading, 
    error, 
    theme, 
    refreshWeather 
  } = useWeather();

  if (loading && !forecast) {
    return <LoadingSpinner message="Loading forecast data..." />;
  }

  if (error && !forecast) {
    return <ErrorDisplay error={error} onRetry={refreshWeather} />;
  }

  if (!forecast) {
    return <LoadingSpinner message="Loading forecast..." />;
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    gradient: {
      flex: 1,
      paddingTop: 60,
    },
    header: {
      paddingHorizontal: 20,
      marginBottom: 20,
    },
    title: {
      color: theme.text,
      fontSize: 28,
      fontWeight: '700',
      textAlign: 'center',
    },
    content: {
      paddingHorizontal: 20,
      paddingBottom: 0,
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 20,
      fontWeight: '600',
      marginBottom: 16,
      marginTop: 20,
    },
    // 24-hour forecast styles
    hourlyContainer: {
      marginBottom: 32,
    },
    hourlyScrollView: {
      paddingVertical: 8,
    },
    hourlyItem: {
      backgroundColor: theme.surface + '90',
      borderRadius: 12,
      padding: 12,
      marginRight: 12,
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
      fontSize: 11,
      fontWeight: '500',
    },
    // 5-day forecast styles
    dailyContainer: {
      gap: 12,
      paddingBottom: 40
    },
    dailyItem: {
      backgroundColor: theme.surface + '90',
      borderRadius: 16,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      // Remove shadow/elevation to prevent Android grey borders
    },
    dailyLeft: {
      minWidth: 80,
      marginRight: 4,
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
      marginRight: 16,
    },
    dailyRight: {
      alignItems: 'flex-end',
      minWidth: 80,
    },
    tempRange: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
      width: '80%',
    },
    tempLow: {
      color: theme.textSecondary,
      fontSize: 16,
      fontWeight: '500',
      marginRight: 8,
    },
    tempHigh: {
      color: theme.text,
      fontSize: 18,
      fontWeight: '700',
    },
    tempBar: {
      height: 4,
      backgroundColor: theme.textSecondary + '20',
      borderRadius: 2,
      marginBottom: 4,
      width: '80%',
    },
    tempBarFill: {
      height: '100%',
      borderRadius: 2,
    },
    precipChance: {
      color: theme.primary,
      fontSize: 12,
      fontWeight: '500',
    },
    errorText: {
      color: theme.accent,
      fontSize: 14,
      textAlign: 'center',
      marginTop: 20,
      fontWeight: '500',
    },
  });

  // Get next 48 hours forecast
  const next48Hours = forecast.hourly;

  // Get 5-day forecast data
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
  const allTemps = dailyForecast.flatMap(day => [day.maxTemp, day.minTemp]);
  const globalMin = Math.min(...allTemps);
  const globalMax = Math.max(...allTemps);
  const globalMiddle = (globalMin + globalMax) / 2.0;
  const tempRange = Math.max(globalMax - globalMin, 10.0);
  const fixedGlobalMin = globalMiddle - tempRange / 2.0;
  const fixedGlobalMax = globalMiddle + tempRange / 2.0;

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
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.gradientStart, theme.gradientEnd]}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Weather Forecast</Text>
        </View>

        <ScrollView 
          style={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={refreshWeather}
              tintColor={theme.primary}
              colors={[theme.primary]}
            />
          }
        >
          {/* 48-Hour Forecast */}
          <View style={styles.hourlyContainer}>
            <Text style={styles.sectionTitle}>Next 48 Hours</Text>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.hourlyScrollView}
              contentContainerStyle={{ paddingRight: 20 }}
            >
              {next48Hours.map((item, index) => (
                <View key={index} style={styles.hourlyItem}>
                  <Text style={styles.hourlyTime}>
                    {index === 0 ? 'Now' : formatTime(item.dt)}
                  </Text>
                  
                  <View style={styles.hourlyIcon}>
                    <WeatherIcon 
                      weatherMain={item.weather[0].main}
                      size={32}
                      color={theme.primary}
                    />
                  </View>
                  
                  <Text style={styles.hourlyTemp}>
                    {Math.round(item.main.temp)}°
                  </Text>
                  
                  <Text style={styles.hourlyPrecip}>
                    {Math.round(item.pop * 100)}%
                  </Text>

                  <Text style={styles.hourlyPrecip}>
                    {((item.rain?.['1h'] || 0) + (item.snow?.['1h'] || 0)).toFixed(1)}mm
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* 7-Day Forecast */}
          <Text style={styles.sectionTitle}>7-Day Forecast</Text>

          <View style={styles.dailyContainer}>
            {dailyForecast.map((day, index) => (
              <View key={index} style={styles.dailyItem}>
                <View style={styles.dailyLeft}>
                  <Text style={styles.dailyDate}>
                    {formatDayName(day.date)}
                  </Text>
                  <Text style={styles.dailyDate}>
                    {formatDate(day.date)}
                  </Text>
                </View>
                
                <View style={styles.dailyCenter}>
                  <View style={styles.tempRange}>
                    <Text style={styles.tempLow}>
                      {Math.round(day.minTemp)}°
                    </Text>
                    <Text style={styles.tempHigh}>
                      {Math.round(day.maxTemp)}°
                    </Text>
                  </View>
                  
                  <View style={styles.tempBar}>
                    <LinearGradient
                      colors={[theme.primary + '60', theme.primary]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[
                        styles.tempBarFill,
                        getTempBarGradient(day.minTemp, day.maxTemp)
                      ]}
                    />
                  </View>
                </View>

                <View style={styles.dailyRight}>
                  <WeatherIcon 
                    weatherMain={day.weather.main}
                    size={32}
                    color={theme.primary}
                  />
                  <Text style={styles.precipChance}>
                    {Math.round(day.precipChance)}% rain
                  </Text>
                  <Text style={styles.precipChance}>
                    {day.rain.toFixed(1)} mm
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {error && (
            <Text style={styles.errorText}>
              ⚠️ {error}
            </Text>
          )}
        </ScrollView>
      </LinearGradient>
    </View>
  );
}