import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Activity, AlertTriangle, CloudFog } from 'lucide-react-native';
import { useWeather } from '../contexts/WeatherContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ScrollingScreen } from '../components/ScrollingScreen';
import { getAqiDescription } from '../utils/aqiUtils';

export default function AirQualityScreen() {
  const router = useRouter();
  const { weatherAirQuality, theme, loading } = useWeather();

  if (loading && !weatherAirQuality) {
    return (
      <ScrollingScreen
        theme={theme}
        title="Air Quality"
        onBack={() => router.back()}
        bottomInset
      >
        <LoadingSpinner message="Loading air quality data..." />
      </ScrollingScreen>
    );
  }

  if (!weatherAirQuality) {
    return (
      <ScrollingScreen
        theme={theme}
        title="Air Quality"
        onBack={() => router.back()}
        bottomInset
      >
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.textSecondary }]}>
            No air quality data available
          </Text>
        </View>
      </ScrollingScreen>
    );
  }

  const { aqi, pm25, pm10, o3, so2, no2, co } = weatherAirQuality;
  const aqiValue = aqi.usa; // Default to US AQI for main display
  const status = getAqiDescription(aqiValue);

  const pollutants = [
    {
      label: 'PM2.5',
      value: pm25,
      unit: 'µg/m³',
      icon: <CloudFog size={24} color={theme.primary} />,
    },
    {
      label: 'PM10',
      value: pm10,
      unit: 'µg/m³',
      icon: <CloudFog size={24} color={theme.primary} />,
    },
    {
      label: 'O₃',
      value: o3,
      unit: 'µg/m³',
      icon: <Activity size={24} color={theme.primary} />,
    },
    {
      label: 'NO₂',
      value: no2,
      unit: 'µg/m³',
      icon: <AlertTriangle size={24} color={theme.primary} />,
    },
    {
      label: 'SO₂',
      value: so2,
      unit: 'µg/m³',
      icon: <AlertTriangle size={24} color={theme.primary} />,
    },
    {
      label: 'CO',
      value: co,
      unit: 'mg/m³',
      icon: <AlertTriangle size={24} color={theme.primary} />,
    },
  ].filter((item) => item.value !== undefined);

  return (
    <ScrollingScreen
      theme={theme}
      title="Air Quality Details"
      compactTitle="Air Quality"
      onBack={() => router.back()}
      bottomInset
    >
      <View style={styles.mainCard}>
        <View style={[styles.aqiCircle, { borderColor: status.color }]}>
          <Text style={[styles.aqiValue, { color: theme.text }]}>
            {Math.round(aqiValue)}
          </Text>
          <Text style={[styles.aqiLabel, { color: theme.textSecondary }]}>
            US AQI
          </Text>
        </View>
        <View
          style={[styles.statusContainer, { backgroundColor: status.color }]}
        >
          <Text style={styles.statusText}>{status.label}</Text>
        </View>
        <Text style={[styles.description, { color: theme.text }]}>
          {status.description}
        </Text>
      </View>

      <View
        style={[styles.chinaAqiCard, { backgroundColor: theme.surface + '60' }]}
      >
        <Text style={[styles.chinaAqiLabel, { color: theme.textSecondary }]}>
          China AQI
        </Text>
        <Text style={[styles.chinaAqiValue, { color: theme.text }]}>
          {aqi.chn}
        </Text>
      </View>

      <Text style={[styles.sectionTitle, { color: theme.text }]}>
        Pollutants
      </Text>

      <View style={styles.grid}>
        {pollutants.map((item, index) => (
          <View
            key={index}
            style={[styles.gridItem, { backgroundColor: theme.surface + '80' }]}
          >
            <View style={styles.pollutantHeader}>
              {item.icon}
              <Text
                style={[styles.pollutantLabel, { color: theme.textSecondary }]}
              >
                {item.label}
              </Text>
            </View>
            <Text style={[styles.pollutantValue, { color: theme.text }]}>
              {item.value}
              <Text style={{ fontSize: 12, color: theme.textSecondary }}>
                {' '}
                {item.unit}
              </Text>
            </Text>
          </View>
        ))}
      </View>
    </ScrollingScreen>
  );
}

const styles = StyleSheet.create({
  mainCard: {
    alignItems: 'center',
    marginBottom: 30,
  },
  aqiCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  aqiValue: {
    fontSize: 56,
    fontWeight: '800',
  },
  aqiLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  statusContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000', // Status text usually black for contrast on colored bg
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.9,
    maxWidth: '90%',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  pollutantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  pollutantLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  pollutantValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
  },
  chinaAqiCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chinaAqiLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  chinaAqiValue: {
    fontSize: 20,
    fontWeight: '700',
  },
});
