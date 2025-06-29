import React from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useWeather } from '../../contexts/WeatherContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorDisplay } from '../../components/ErrorDisplay';
import { WeatherCard } from '../../components/WeatherCard';
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
    subtitle: {
      color: theme.textSecondary,
      fontSize: 16,
      textAlign: 'center',
      marginTop: 8,
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
    forecastItem: {
      backgroundColor: theme.surface + '90',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      // CRITICAL: Remove all shadow/elevation properties to prevent Android grey borders
    },
    timeInfo: {
      width: 80,
      marginRight: 16,
    },
    dateText: {
      color: theme.text,
      fontSize: 16,
      fontWeight: '600',
    },
    timeText: {
      color: theme.textSecondary,
      fontSize: 14,
      marginTop: 2,
    },
    weatherIconContainer: {
      width: 50,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
      // CRITICAL: Clean container with no background styling to prevent Android grey borders
    },
    weatherInfo: {
      flex: 1,
      alignItems: 'center',
      marginRight: 16,
    },
    tempText: {
      color: theme.text,
      fontSize: 18,
      fontWeight: '600',
      marginTop: 4,
    },
    descText: {
      color: theme.textSecondary,
      fontSize: 12,
      textAlign: 'center',
      marginTop: 2,
    },
    popContainer: {
      width: 60,
      alignItems: 'center',
    },
    popLabel: {
      color: theme.textSecondary,
      fontSize: 10,
      marginBottom: 2,
    },
    popText: {
      color: theme.primary,
      fontSize: 14,
      fontWeight: '600',
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

  // Get next 24 hours forecast
  const next24Hours = forecast.list.slice(0, 8);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.gradientStart, theme.gradientEnd]}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Weather Forecast</Text>
          <Text style={styles.subtitle}>
            {forecast.city.name}, {forecast.city.country}
          </Text>
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
          <Text style={styles.sectionTitle}>Next 24 Hours</Text>
          
          {next24Hours.map((item, index) => (
            <View key={index} style={styles.forecastItem}>
              <View style={styles.timeInfo}>
                <Text style={styles.dateText}>
                  {index === 0 ? 'Now' : formatTime(item.dt)}
                </Text>
                <Text style={styles.timeText}>
                  {formatDate(item.dt)}
                </Text>
              </View>
              
              <View style={styles.weatherIconContainer}>
                <WeatherIcon 
                  weatherMain={item.weather[0].main}
                  size={40}
                  color={theme.primary}
                />
              </View>
              
              <View style={styles.weatherInfo}>
                <Text style={styles.tempText}>
                  {Math.round(item.main.temp)}°
                </Text>
                <Text style={styles.descText}>
                  {item.weather[0].description}
                </Text>
              </View>
              
              <View style={styles.popContainer}>
                <Text style={styles.popLabel}>Rain</Text>
                <Text style={styles.popText}>
                  {Math.round(item.pop * 100)}%
                </Text>
              </View>
            </View>
          ))}

          <Text style={styles.sectionTitle}>5-Day Forecast</Text>

          {Object.entries(groupedForecast).slice(0, 5).map(([date, items]) => {
            const dayItems = items.filter(item => {
              const hour = new Date(item.dt * 1000).getHours();
              return hour >= 6 && hour <= 18; // Daytime hours
            });
            
            if (dayItems.length === 0) return null;
            
            const dayItem = dayItems[Math.floor(dayItems.length / 2)]; // Middle of the day
            const maxTemp = Math.max(...items.map(item => item.main.temp_max));
            const minTemp = Math.min(...items.map(item => item.main.temp_min));

            return (
              <WeatherCard
                key={date}
                title={formatDate(dayItem.dt)}
                temperature={dayItem.main.temp}
                description={dayItem.weather[0].description}
                weatherMain={dayItem.weather[0].main}
                showDetails={true}
                humidity={dayItem.main.humidity}
                windSpeed={dayItem.wind.speed}
              />
            );
          })}

          {error && (
            <View style={{ marginTop: 20 }}>
              <Text style={[styles.sectionTitle, { color: theme.accent }]}>
                ⚠️ {error}
              </Text>
            </View>
          )}
        </ScrollView>
      </LinearGradient>
    </View>
  );
}