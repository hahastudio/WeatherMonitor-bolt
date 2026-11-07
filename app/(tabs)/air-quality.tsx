import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { useWeather } from '../../contexts/WeatherContext';
import { GlassSurface } from '../../components/GlassSurface';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { getAqiDescription } from '../../utils/aqiUtils';

export function AirQualityContent() {
  const { weatherAirQuality: quality, theme, loading } = useWeather();
  if (!quality)
    return (
      <GlassSurface theme={theme} style={s.panel}>
        {loading ? (
          <LoadingSpinner message="Loading air quality data..." />
        ) : (
          <Text style={{ color: theme.textSecondary }}>
            No air quality data available
          </Text>
        )}
      </GlassSurface>
    );
  const status =
    typeof quality.aqi?.usa === 'number'
      ? getAqiDescription(quality.aqi.usa)
      : null;
  const pollutants = [
    ['PM2.5', quality.pm25, 'µg/m³'],
    ['PM10', quality.pm10, 'µg/m³'],
    ['O₃', quality.o3, 'µg/m³'],
    ['NO₂', quality.no2, 'µg/m³'],
    ['SO₂', quality.so2, 'µg/m³'],
    ['CO', quality.co, 'mg/m³'],
  ] as const;
  return (
    <GlassSurface theme={theme} testID="air-quality-panel" style={s.panel}>
      <Text
        accessibilityRole="header"
        style={[s.heading, { color: theme.text }]}
      >
        Air Quality
      </Text>
      <View style={s.indices}>
        {[
          ['US AQI', quality.aqi?.usa],
          ['China AQI', quality.aqi?.chn],
        ].map(([label, amount]) => (
          <View key={label} style={{ flex: 1 }}>
            <Text style={{ color: theme.textSecondary, fontSize: 14 }}>
              {label}
            </Text>
            <Text
              style={{ color: theme.text, fontSize: 40, fontWeight: '700' }}
            >
              {amount ?? 'Unavailable'}
            </Text>
          </View>
        ))}
      </View>
      {status && (
        <View style={{ marginBottom: 20 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              marginBottom: 8,
            }}
          >
            <View
              style={{
                width: 14,
                height: 14,
                borderRadius: 7,
                backgroundColor: status.color,
                borderWidth: 1,
                borderColor: theme.divider,
              }}
            />
            <Text
              style={{ color: theme.text, fontSize: 18, fontWeight: '700' }}
            >
              {status.label}
            </Text>
          </View>
          <Text
            style={{ color: theme.textSecondary, fontSize: 16, lineHeight: 24 }}
          >
            {status.description}
          </Text>
        </View>
      )}
      <Text
        accessibilityRole="header"
        style={[s.heading, { color: theme.text }]}
      >
        Pollutants
      </Text>
      {pollutants
        .filter(([, amount]) => amount !== undefined && amount !== null)
        .map(([label, amount, unit]) => (
          <View
            key={label}
            style={[s.pollutant, { borderTopColor: theme.divider }]}
          >
            <Text style={{ color: theme.textSecondary, fontSize: 16 }}>
              {label}
            </Text>
            <Text
              style={{ color: theme.text, fontSize: 18, fontWeight: '600' }}
            >
              {amount}
              <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                {' '}
                {unit}
              </Text>
            </Text>
          </View>
        ))}
    </GlassSurface>
  );
}
// AQI keeps its public deep link while sharing Weather's mounted panes.
export default function AirQualityRoute() {
  return null;
}
const s = StyleSheet.create({
  panel: { padding: 16, flexGrow: 1 },
  heading: { fontSize: 20, fontWeight: '600', marginBottom: 12 },
  indices: { flexDirection: 'row', gap: 12, marginVertical: 12 },
  pollutant: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
});
