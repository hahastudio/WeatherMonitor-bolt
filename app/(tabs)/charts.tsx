import React from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Thermometer, 
  CloudRain, 
  Wind, 
  Gauge, 
  Droplets,
  TrendingUp,
  Clock
} from 'lucide-react-native';
import { useWeather } from '../../contexts/WeatherContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorDisplay } from '../../components/ErrorDisplay';
import { CustomChart } from '../../components/CustomChart';
import { formatTime, formatDate } from '../../utils/weatherTheme';

const { width: screenWidth } = Dimensions.get('window');

export default function ChartsScreen() {
  const { 
    forecast, 
    loading, 
    error, 
    theme, 
    refreshWeather,
    cityName
  } = useWeather();

  if (loading && !forecast) {
    return <LoadingSpinner message="Loading forecast charts..." />;
  }

  if (error && !forecast) {
    return <ErrorDisplay error={error} onRetry={refreshWeather} />;
  }

  if (!forecast || !forecast.list || forecast.list.length === 0) {
    return <LoadingSpinner message="Loading chart data..." />;
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
    timeRange: {
      color: theme.textSecondary,
      fontSize: 14,
      textAlign: 'center',
      marginTop: 4,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    content: {
      paddingHorizontal: 20,
      paddingBottom: 100,
    },
    chartCard: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      // Use Android-compatible shadow approach
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        android: {
          elevation: 4,
        },
        web: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        },
      }),
    },
    chartHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    chartIcon: {
      marginRight: 12,
    },
    chartTitle: {
      color: theme.text,
      fontSize: 18,
      fontWeight: '600',
      flex: 1,
    },
    chartTrend: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    trendText: {
      color: theme.primary,
      fontSize: 14,
      fontWeight: '600',
      marginLeft: 4,
    },
    chartContainer: {
      backgroundColor: theme.background + '10',
      borderRadius: 12,
      padding: 8,
      marginVertical: 8,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: theme.textSecondary + '15',
    },
    statItem: {
      alignItems: 'center',
      flex: 1,
    },
    statLabel: {
      color: theme.textSecondary,
      fontSize: 12,
      marginBottom: 4,
      textTransform: 'uppercase',
      fontWeight: '500',
    },
    statValue: {
      color: theme.text,
      fontSize: 16,
      fontWeight: '700',
    },
    errorText: {
      color: theme.accent,
      fontSize: 14,
      textAlign: 'center',
      marginTop: 20,
      fontWeight: '500',
    },
  });

  // Get next 48 hours of data (16 data points, 3 hours each)
  const next48Hours = forecast.list.slice(0, 16);

  // Ensure we have data to work with
  if (next48Hours.length === 0) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[theme.gradientStart, theme.gradientEnd]}
          style={styles.gradient}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Weather Charts</Text>
            <Text style={styles.subtitle}>{cityName}</Text>
          </View>
          <View style={styles.content}>
            <Text style={[styles.subtitle, { textAlign: 'center' }]}>
              No forecast data available
            </Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  // Prepare data for charts with proper number formatting
  const temperatureData = next48Hours.map((item, index) => {
    const temp = item.main?.temp;
    return {
      x: index,
      y: typeof temp === 'number' ? parseFloat(temp.toFixed(1)) : 0,
      label: index % 4 === 0 ? formatTime(item.dt) : '',
    };
  });

  const precipitationData = next48Hours.map((item, index) => {
    const rain = item.rain?.['3h'] || 0;
    const snow = item.snow?.['3h'] || 0;
    const precip = rain + snow;
    return {
      x: index,
      y: typeof precip === 'number' ? parseFloat(precip.toFixed(2)) : 0,
      label: index % 4 === 0 ? formatTime(item.dt) : '',
    };
  });

  const windData = next48Hours.map((item, index) => {
    const windSpeed = item.wind?.speed || 0;
    const windKmh = windSpeed * 3.6; // Convert m/s to km/h
    return {
      x: index,
      y: typeof windKmh === 'number' ? parseFloat(windKmh.toFixed(1)) : 0,
      label: index % 4 === 0 ? formatTime(item.dt) : '',
    };
  });

  const pressureData = next48Hours.map((item, index) => {
    const pressure = item.main?.pressure;
    return {
      x: index,
      y: typeof pressure === 'number' ? parseFloat(pressure.toFixed(0)) : 1013,
      label: index % 4 === 0 ? formatTime(item.dt) : '',
    };
  });

  const humidityData = next48Hours.map((item, index) => {
    const humidity = item.main?.humidity;
    return {
      x: index,
      y: typeof humidity === 'number' ? parseFloat(humidity.toFixed(0)) : 0,
      label: index % 4 === 0 ? formatTime(item.dt) : '',
    };
  });

  // Calculate statistics with proper number handling
  const calculateStats = (data: any[]) => {
    const values = data.map(d => d.y).filter(v => typeof v === 'number' && !isNaN(v));
    if (values.length === 0) return null;
    
    return {
      min: parseFloat(Math.min(...values).toFixed(1)),
      max: parseFloat(Math.max(...values).toFixed(1)),
      avg: parseFloat((values.reduce((sum, v) => sum + v, 0) / values.length).toFixed(1)),
    };
  };

  const tempStats = calculateStats(temperatureData);
  const precipStats = {
    total: parseFloat(precipitationData.reduce((sum, d) => sum + d.y, 0).toFixed(1)),
    max: parseFloat(Math.max(...precipitationData.map(d => d.y)).toFixed(1)),
  };
  const windStats = calculateStats(windData);
  const pressureStats = calculateStats(pressureData);
  const humidityStats = calculateStats(humidityData);

  const renderChart = (
    title: string,
    icon: React.ReactNode,
    data: any[],
    color: string,
    unit: string,
    chartType: 'line' | 'area' | 'bar' = 'line',
    stats?: any
  ) => {
    return (
      <View key={title} style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <View style={styles.chartIcon}>
            {icon}
          </View>
          <Text style={styles.chartTitle}>{title}</Text>
          <View style={styles.chartTrend}>
            <TrendingUp size={16} color={theme.primary} />
            <Text style={styles.trendText}>48h</Text>
          </View>
        </View>
        
        <View style={styles.chartContainer}>
          <CustomChart
            data={data}
            color={color}
            unit={unit}
            type={chartType}
            showGrid={true}
          />
        </View>

        {stats && (
          <View style={styles.statsRow}>
            {Object.entries(stats).map(([key, value]) => (
              <View key={key} style={styles.statItem}>
                <Text style={styles.statLabel}>{key}</Text>
                <Text style={styles.statValue}>
                  {typeof value === 'number' ? value.toFixed(1) : value}{unit}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.gradientStart, theme.gradientEnd]}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Weather Charts</Text>
          <Text style={styles.subtitle}>{cityName}</Text>
          <View style={styles.timeRange}>
            <Clock size={14} color={theme.textSecondary} />
            <Text style={[styles.timeRange, { marginLeft: 6 }]}>
              Next 48 Hours Forecast
            </Text>
          </View>
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
          {renderChart(
            'Temperature',
            <Thermometer size={24} color={theme.primary} />,
            temperatureData,
            theme.primary,
            '°C',
            'area',
            tempStats
          )}

          {renderChart(
            'Precipitation',
            <CloudRain size={24} color='#4A90E2' />,
            precipitationData,
            '#4A90E2',
            'mm',
            'bar',
            precipStats
          )}

          {renderChart(
            'Wind Speed',
            <Wind size={24} color='#50C878' />,
            windData,
            '#50C878',
            ' km/h',
            'line',
            windStats
          )}

          {renderChart(
            'Atmospheric Pressure',
            <Gauge size={24} color='#FF6B6B' />,
            pressureData,
            '#FF6B6B',
            ' hPa',
            'line',
            pressureStats
          )}

          {renderChart(
            'Humidity',
            <Droplets size={24} color='#20B2AA' />,
            humidityData,
            '#20B2AA',
            '%',
            'area',
            humidityStats
          )}

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