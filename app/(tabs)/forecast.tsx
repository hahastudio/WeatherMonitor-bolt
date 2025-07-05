import React from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, Platform } from 'react-native';
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
      paddingBottom: 100,
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
      flex: 1,
      marginRight: 16,
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
      marginBottom: 8,
    },
    tempHigh: {
      color: theme.text,
      fontSize: 18,
      fontWeight: '700',
      marginRight: 8,
    },
    tempLow: {
      color: theme.textSecondary,
      fontSize: 16,
      fontWeight: '500',
    },
    tempBar: {
      height: 4,
      backgroundColor: theme.textSecondary + '20',
      borderRadius: 2,
      marginBottom: 4,
      width: 60,
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

  // Group forecast by days
  const groupedForecast = forecast.list.reduce((acc, item) => {
    const date = new Date(item.dt * 1000).toDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(item);
    return acc;
  }, {} as Record<string, typeof forecast.list>);

  // Get next 24 hours forecast (8 data points, 3 hours each)
  const next24Hours = forecast.list.slice(0, 8);

  // Get 5-day forecast data
  const dailyForecast = Object.entries(groupedForecast).slice(0, 5).map(([date, items]) => {
    const dayItems = items.filter(item => {
      const hour = new Date(item.dt * 1000).getHours();
      return hour >= 6 && hour <= 18; // Daytime hours
    });
    
    const representativeItem = dayItems.length > 0 
      ? dayItems[Math.floor(dayItems.length / 2)] 
      : items[0];
    
    const maxTemp = Math.max(...items.map(item => item.main.temp_max));
    const minTemp = Math.min(...items.map(item => item.main.temp_min));
    const avgPrecipChance = Math.round(items.reduce((sum, item) => sum + item.pop, 0) / items.length * 100);
    
    return {
      date: representativeItem.dt,
      weather: representativeItem.weather[0],
      maxTemp,
      minTemp,
      precipChance: avgPrecipChance,
    };
  });

  // Calculate temperature range for the bar visualization
  const allTemps = dailyForecast.flatMap(day => [day.maxTemp, day.minTemp]);
  const globalMin = Math.min(...allTemps);
  const globalMax = Math.max(...allTemps);
  const tempRange = globalMax - globalMin || 1;

  const getTempBarGradient = (minTemp: number, maxTemp: number) => {
    const minPosition = ((minTemp - globalMin) / tempRange) * 100;
    const maxPosition = ((maxTemp - globalMin) / tempRange) * 100;
    
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
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { weekday: 'long' });
    }
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
          {/* 24-Hour Forecast */}
          <View style={styles.hourlyContainer}>
            <Text style={styles.sectionTitle}>Next 24 Hours</Text>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.hourlyScrollView}
              contentContainerStyle={{ paddingRight: 20 }}
            >
              {next24Hours.map((item, index) => (
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
                </View>
              ))}
            </ScrollView>
          </View>

          {/* 5-Day Forecast */}
          <Text style={styles.sectionTitle}>5-Day Forecast</Text>

          <View style={styles.dailyContainer}>
            {dailyForecast.map((day, index) => (
              <View key={index} style={styles.dailyItem}>
                <View style={styles.dailyLeft}>
                  <Text style={styles.dailyDate}>
                    {formatDayName(day.date)}
                  </Text>
                  <Text style={styles.dailyDesc}>
                    {day.weather.description}
                  </Text>
                </View>
                
                <View style={styles.dailyCenter}>
                  <WeatherIcon 
                    weatherMain={day.weather.main}
                    size={40}
                    color={theme.primary}
                  />
                </View>
                
                <View style={styles.dailyRight}>
                  <View style={styles.tempRange}>
                    <Text style={styles.tempHigh}>
                      {Math.round(day.maxTemp)}°
                    </Text>
                    <Text style={styles.tempLow}>
                      {Math.round(day.minTemp)}°
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
                  
                  <Text style={styles.precipChance}>
                    {day.precipChance}% rain
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