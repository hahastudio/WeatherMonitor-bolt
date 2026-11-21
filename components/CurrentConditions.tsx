import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewProps,
} from 'react-native';
import {
  AirVent,
  ChevronRight,
  CloudRain,
  CloudSnow,
  Droplets,
  Eye,
  Gauge,
  MousePointer2,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useWeather } from '../contexts/WeatherContext';
import { useAdaptiveLayout } from '../hooks/useAdaptiveLayout';
import {
  capitalizeWords,
  formatTemperature,
  heroLetterShadow,
} from '../utils/weatherTheme';
import { WeatherIcon } from './WeatherIcon';
import { WeatherSummary } from './WeatherSummary';
import { WeatherAlerts } from './WeatherAlerts';
import { GlassSurface } from './GlassSurface';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorDisplay } from './ErrorDisplay';

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
];
const value = (n: number | undefined, unit: string, factor = 1) =>
  typeof n === 'number' && Number.isFinite(n)
    ? `${(n * factor).toFixed(1)}${unit}`
    : 'Unavailable';

export function CurrentConditions({
  onHeroLayout,
  onTextLayout,
}: {
  onHeroLayout?: ViewProps['onLayout'];
  onTextLayout?: ViewProps['onLayout'];
} = {}) {
  const {
    currentWeather: weather,
    weatherAirQuality,
    weatherAlerts,
    loading,
    error,
    theme,
    refreshWeather,
  } = useWeather();
  const { rail, columns, fontScale } = useAdaptiveLayout();
  const [primaryHeight, setPrimaryHeight] = useState(104);
  const router = useRouter();
  if (!weather)
    return error ? (
      <ErrorDisplay error={error} onRetry={refreshWeather} />
    ) : (
      <LoadingSpinner
        message={
          loading
            ? 'Getting your location and weather...'
            : 'Loading weather data...'
        }
      />
    );
  const rain = weather.rain?.['1h'];
  const snow = weather.snow?.['1h'];
  const hasRain = rain !== undefined && rain > 0;
  const hasSnow = snow !== undefined && snow > 0;
  const PrecipIcon = hasSnow ? CloudSnow : CloudRain;
  const bearing = Number.isFinite(weather.wind.deg)
    ? windSectors[Math.floor((((weather.wind.deg % 360) + 360) % 360) / 22.5)]
    : '';
  const details = [
    {
      label: hasSnow ? (hasRain ? 'Rain/Snow (1h)' : 'Snow (1h)') : 'Rain (1h)',
      value: value((rain ?? 0) + (snow ?? 0), ' mm'),
      icon: <PrecipIcon size={24} color={theme.primary} />,
    },
    {
      label: 'Wind',
      value: `${value(weather.wind.speed, ' km/h', 3.6)} ${bearing}`,
      icon: (
        <View
          style={{ transform: [{ rotate: `${weather.wind.deg + 225}deg` }] }}
        >
          <MousePointer2 size={24} color={theme.primary} />
        </View>
      ),
    },
    {
      label: 'Air Quality',
      value:
        weatherAirQuality?.aqi?.usa !== undefined
          ? `AQI ${value(weatherAirQuality.aqi.usa, '')}`
          : 'Unavailable',
      icon: <AirVent size={24} color={theme.primary} />,
      action: rail ? undefined : () => router.navigate('/air-quality'),
    },
    {
      label: 'Visibility',
      value: value(weather.visibility, ' km', 0.001),
      icon: <Eye size={24} color={theme.primary} />,
    },
    {
      label: 'Humidity',
      value: value(weather.main.humidity, '%'),
      icon: <Droplets size={24} color={theme.primary} />,
    },
    {
      label: 'Pressure',
      value: value(weather.main.pressure, ' hPa'),
      icon: <Gauge size={24} color={theme.primary} />,
    },
  ];
  return (
    <View style={{ flex: 1, gap: 12 }}>
      <View
        testID="current-weather-hero"
        onLayout={onHeroLayout}
        style={[s.hero, columns && { minHeight: 220 * Math.max(1, fontScale) }]}
      >
        <View style={[s.heroRow, fontScale > 1.4 && { flexWrap: 'wrap' }]}>
          <View style={{ flexShrink: 1 }} onLayout={onTextLayout}>
            <View
              testID="current-weather-primary"
              onLayout={(event) =>
                setPrimaryHeight(event.nativeEvent.layout.height)
              }
            >
              <Text
                style={[
                  s.temperature,
                  heroLetterShadow,
                  { color: theme.heroText },
                ]}
              >
                {formatTemperature(weather.main.temp)}
              </Text>
              <Text
                style={{
                  ...heroLetterShadow,
                  color: theme.heroText,
                  fontSize: 20,
                  fontWeight: '600',
                }}
              >
                {capitalizeWords(weather.weather[0].description)}
              </Text>
            </View>
            <Text
              style={{
                ...heroLetterShadow,
                color: theme.heroSecondary,
                fontSize: 16,
                marginTop: 8,
              }}
            >
              Feels like {formatTemperature(weather.main.feels_like)}
            </Text>
            <Text
              style={{
                ...heroLetterShadow,
                color: theme.heroSecondary,
                fontSize: 16,
                textAlign: 'left',
                marginTop: 8,
              }}
            >
              High{' '}
              <Text style={{ fontWeight: '700' }}>
                {formatTemperature(weather.main.temp_max)}
              </Text>{' '}
              / Low{' '}
              <Text style={{ fontWeight: '700' }}>
                {formatTemperature(weather.main.temp_min)}
              </Text>
            </Text>
          </View>
          <WeatherIcon
            weatherMain={weather.weather[0].main}
            size={Math.min(primaryHeight, 120 * fontScale)}
            color={theme.heroText}
            isNight={theme.isNight}
          />
        </View>
      </View>
      <WeatherSummary />
      {weatherAlerts.length > 0 && <WeatherAlerts alerts={weatherAlerts} />}
      {error && (
        <GlassSurface theme={theme} style={{ padding: 12 }}>
          <Text accessibilityRole="alert" style={{ color: theme.text }}>
            {error}
          </Text>
        </GlassSurface>
      )}
      <GlassSurface
        theme={theme}
        testID="weather-details"
        style={[s.details, columns && { flexGrow: 1 }]}
      >
        <Text
          accessibilityRole="header"
          style={[s.heading, { color: theme.text }]}
        >
          Details
        </Text>
        {[0, 2, 4].map((start) => (
          <View
            key={start}
            style={[
              s.detailRow,
              columns && { flex: 1 },
              start > 0 && { borderTopWidth: 1, borderTopColor: theme.divider },
            ]}
          >
            {details.slice(start, start + 2).map((item, index) => (
              <Pressable
                key={item.label}
                disabled={!item.action}
                onPress={item.action}
                accessibilityRole={item.action ? 'button' : undefined}
                accessibilityLabel={
                  item.action
                    ? `${item.label}, ${item.value}, show details`
                    : undefined
                }
                style={[
                  s.detail,
                  index === 1 && {
                    borderLeftWidth: 1,
                    borderLeftColor: theme.divider,
                  },
                ]}
              >
                <View style={s.detailHeader}>
                  {item.icon}
                  <Text
                    style={{
                      color: theme.textSecondary,
                      fontSize: 14,
                      flexShrink: 1,
                    }}
                  >
                    {item.label}
                  </Text>
                  {item.action && (
                    <ChevronRight size={16} color={theme.primary} />
                  )}
                </View>
                <Text
                  style={{
                    color: theme.text,
                    fontSize: 18,
                    fontWeight: '700',
                    marginTop: 12,
                  }}
                >
                  {item.value}
                </Text>
              </Pressable>
            ))}
          </View>
        ))}
      </GlassSurface>
    </View>
  );
}

const DETAIL_DIVIDER_INSET = 8;
const s = StyleSheet.create({
  hero: {
    paddingVertical: 18,
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 12,
  },
  temperature: { fontSize: 66, fontWeight: '300', letterSpacing: -3 },
  heading: { fontSize: 20, fontWeight: '600', padding: 14, paddingBottom: 2 },
  details: { overflow: 'hidden', paddingBottom: DETAIL_DIVIDER_INSET },
  detailRow: { flexDirection: 'row', marginHorizontal: DETAIL_DIVIDER_INSET },
  detail: {
    flex: 1,
    minWidth: 0,
    padding: 12,
    minHeight: 100,
    justifyContent: 'center',
  },
  detailHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
