import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Activity,
  AlertTriangle,
  CloudFog,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWeather } from '../contexts/WeatherContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { getAqiDescription } from '../utils/aqiUtils';
import { CaiyunAirQuality } from '../types/weather';
import { WeatherTheme } from '../utils/weatherTheme';

export default function AirQualityScreen() {
  const router = useRouter();
  const { weatherAirQuality, theme, loading } = useWeather();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();

  // Snapshot data so context re-renders during the back-navigation
  // animation do not cause the LinearGradient to unmount/remount and flash white.
  const snapshotAirQuality = useRef<CaiyunAirQuality | null>(weatherAirQuality);
  const snapshotTheme = useRef<WeatherTheme>(theme);

  useEffect(() => {
    if (isFocused) {
      snapshotAirQuality.current = weatherAirQuality;
      snapshotTheme.current = theme;
    }
  }, [isFocused, weatherAirQuality, theme]);

  // Always render using the snapshot so the view never changes mid-animation.
  const displayAirQuality = snapshotAirQuality.current;
  const displayTheme = snapshotTheme.current;

  if (loading && !displayAirQuality) {
    return <LoadingSpinner message="Loading air quality data..." />;
  }

  if (!displayAirQuality) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: displayTheme.gradientStart },
        ]}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color={displayTheme.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: displayTheme.text }]}>
            Air Quality
          </Text>
        </View>
        <View style={styles.errorContainer}>
          <Text
            style={[styles.errorText, { color: displayTheme.textSecondary }]}
          >
            No air quality data available
          </Text>
        </View>
      </View>
    );
  }

  const { aqi, pm25, pm10, o3, so2, no2, co } = displayAirQuality;
  const aqiValue = aqi.usa; // Default to US AQI for main display
  const status = getAqiDescription(aqiValue);

  const pollutants = [
    {
      label: 'PM2.5',
      value: pm25,
      unit: 'µg/m³',
      icon: <CloudFog size={24} color={displayTheme.primary} />,
    },
    {
      label: 'PM10',
      value: pm10,
      unit: 'µg/m³',
      icon: <CloudFog size={24} color={displayTheme.primary} />,
    },
    {
      label: 'O₃',
      value: o3,
      unit: 'µg/m³',
      icon: <Activity size={24} color={displayTheme.primary} />,
    },
    {
      label: 'NO₂',
      value: no2,
      unit: 'µg/m³',
      icon: <AlertTriangle size={24} color={displayTheme.primary} />,
    },
    {
      label: 'SO₂',
      value: so2,
      unit: 'µg/m³',
      icon: <AlertTriangle size={24} color={displayTheme.primary} />,
    },
    {
      label: 'CO',
      value: co,
      unit: 'mg/m³',
      icon: <AlertTriangle size={24} color={displayTheme.primary} />,
    },
  ].filter((item) => item.value !== undefined);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: displayTheme.gradientStart },
      ]}
    >
      <LinearGradient
        colors={[displayTheme.gradientStart, displayTheme.gradientEnd]}
        style={[styles.gradient, { paddingTop: insets.top + 10 }]}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color={displayTheme.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: displayTheme.text }]}>
            Air Quality Details
          </Text>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        >
          <View style={styles.mainCard}>
            <View style={[styles.aqiCircle, { borderColor: status.color }]}>
              <Text style={[styles.aqiValue, { color: displayTheme.text }]}>
                {Math.round(aqiValue)}
              </Text>
              <Text
                style={[styles.aqiLabel, { color: displayTheme.textSecondary }]}
              >
                US AQI
              </Text>
            </View>
            <View
              style={[
                styles.statusContainer,
                { backgroundColor: status.color },
              ]}
            >
              <Text style={styles.statusText}>{status.label}</Text>
            </View>
            <Text style={[styles.description, { color: displayTheme.text }]}>
              {status.description}
            </Text>
          </View>

          <View
            style={[
              styles.chinaAqiCard,
              { backgroundColor: displayTheme.surface + '60' },
            ]}
          >
            <Text
              style={[
                styles.chinaAqiLabel,
                { color: displayTheme.textSecondary },
              ]}
            >
              China AQI
            </Text>
            <Text style={[styles.chinaAqiValue, { color: displayTheme.text }]}>
              {aqi.chn}
            </Text>
          </View>

          <Text style={[styles.sectionTitle, { color: displayTheme.text }]}>
            Pollutants
          </Text>

          <View style={styles.grid}>
            {pollutants.map((item, index) => (
              <View
                key={index}
                style={[
                  styles.gridItem,
                  { backgroundColor: displayTheme.surface + '80' },
                ]}
              >
                <View style={styles.pollutantHeader}>
                  {item.icon}
                  <Text
                    style={[
                      styles.pollutantLabel,
                      { color: displayTheme.textSecondary },
                    ]}
                  >
                    {item.label}
                  </Text>
                </View>
                <Text
                  style={[styles.pollutantValue, { color: displayTheme.text }]}
                >
                  {item.value}
                  <Text
                    style={{ fontSize: 12, color: displayTheme.textSecondary }}
                  >
                    {' '}
                    {item.unit}
                  </Text>
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    // paddingTop is now handled dynamically in the component style prop if needed,
    // or we can remove it here and add it to the View/SafeAreaView.
    // But since we have `useSafeAreaInsets` hook, let's use style prop on LinearGradient.
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
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
