import React from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
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
    },
    timeInfo: {
      flex: 1,
      marginRight: 12,
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
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
      width: 50,
    },
    weatherInfo: {
      alignItems: 'center',
      marginRight: 16,
      minWidth: 60,
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
      alignItems: 'center',
      minWidth: 50,
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
    // 5-Day Forecast Card Styles
    dayCard: {
      backgroundColor: theme.surface + '90',
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    dayHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    dayTitle: {
      color: theme.text,
      fontSize: 18,
      fontWeight: '600',
    },
    dayContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    dayLeftContent: {
      flex: 1,
      marginRight: 16,
    },
    dayTemperature: {
      color: theme.text,
      fontSize: 24,
      fontWeight: '700',
      marginBottom: 4,
    },
    dayDescription: {
      color: theme.textSecondary,
      fontSize: 14,
      marginBottom: 8,
    },
    dayDetails: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    dayDetailItem: {
      alignItems: 'center',
    },
    dayDetailLabel: {
      color: theme.textSecondary,
      fontSize: 12,
      marginBottom: 2,
    },
    dayDetailValue: {
      color: theme.text,
      fontSize: 14,
      fontWeight: '600',
    },
    dayIconContainer: {
      alignItems: 'center',
      justifyContent: 'center',
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
              <View key={date} style={styles.dayCard}>
                <View style={styles.dayHeader}>
                  <Text style={styles.dayTitle}>{formatDate(dayItem.dt)}</Text>
                </View>
                
                <View style={styles.dayContent}>
                  <View style={styles.dayLeftContent}>
                    <Text style={styles.dayTemperature}>
                      {Math.round(dayItem.main.temp)}°C
                    </Text>
                    <Text style={styles.dayDescription}>
                      {dayItem.weather[0].description}
                    </Text>
                    
                    <View style={styles.dayDetails}>
                      <View style={styles.dayDetailItem}>
                        <Text style={styles.dayDetailLabel}>High</Text>
                        <Text style={styles.dayDetailValue}>{Math.round(maxTemp)}°</Text>
                      </View>
                      <View style={styles.dayDetailItem}>
                        <Text style={styles.dayDetailLabel}>Low</Text>
                        <Text style={styles.dayDetailValue}>{Math.round(minTemp)}°</Text>
                      </View>
                      <View style={styles.dayDetailItem}>
                        <Text style={styles.dayDetailLabel}>Humidity</Text>
                        <Text style={styles.dayDetailValue}>{dayItem.main.humidity}%</Text>
                      </View>
                      <View style={styles.dayDetailItem}>
                        <Text style={styles.dayDetailLabel}>Wind</Text>
                        <Text style={styles.dayDetailValue}>{dayItem.wind.speed} m/s</Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.dayIconContainer}>
                    <WeatherIcon 
                      weatherMain={dayItem.weather[0].main}
                      size={64}
                      color={theme.primary}
                    />
                  </View>
                </View>
              </View>
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