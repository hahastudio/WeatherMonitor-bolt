import React, { useLayoutEffect, useReducer, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutRectangle,
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
import { formatTemperature, heroLetterShadow } from '../utils/weatherTheme';
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
  compact,
  heroInset,
  stackReadings,
  minHeroHeight = 0,
  onLayout,
  onHeroLayout,
  onReadingsLayout,
}: {
  compact: boolean;
  heroInset: number;
  stackReadings: boolean;
  minHeroHeight?: number;
  onLayout?: ViewProps['onLayout'];
  onHeroLayout?: ViewProps['onLayout'];
  onReadingsLayout: (readings: LayoutRectangle[]) => void;
}) {
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
  const [conditionHeight, setConditionHeight] = useState(0);
  const heroRef = useRef<View>(null);
  const readingRef = useRef<View>(null);
  const conditionRef = useRef<View>(null);
  const supportRef = useRef<View>(null);
  const [layoutVersion, layoutChanged] = useReducer(
    (version: number) => version + 1,
    0,
  );
  // Wrapping can move a sibling without resizing it. Measure all three against
  // the same hero after layout, including the condition's baseline adjustment.
  useLayoutEffect(() => {
    const parent = heroRef.current;
    if (!parent) return;
    let active = true;
    const readings: LayoutRectangle[] = [];
    for (const ref of [readingRef, conditionRef, supportRef]) {
      ref.current?.measureLayout(parent, (x, y, width, height) => {
        if (!active) return;
        readings.push({ x, y, width, height });
        if (readings.length === 3) onReadingsLayout(readings);
      });
    }
    return () => {
      active = false;
    };
  }, [layoutVersion, conditionHeight, stackReadings, onReadingsLayout]);
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
  const temperature = formatTemperature(weather.main.temp);
  const unitStart = temperature.indexOf('°');
  const temperatureSize = compact ? 74 : 88;
  const { main, description } = weather.weather[0];
  const conditionSize = (compact ? 18 : 20) * fontScale;
  const conditionLineHeight = Math.ceil(1.2 * conditionSize);
  // Flex rows align the first text baseline. Reserve space for any additional
  // lines above the shared baseline so the last line aligns with the numeral.
  const conditionOffset = stackReadings
    ? 0
    : Math.max(0, Math.round(conditionHeight / conditionLineHeight) - 1) *
      conditionLineHeight;
  const heroText = { color: theme.heroText };
  const secondaryText = { color: theme.heroSecondary };
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
    <View style={{ flexGrow: 1, gap: 12 }} onLayout={onLayout}>
      <View
        testID="current-weather-hero"
        ref={heroRef}
        collapsable={false}
        onLayout={onHeroLayout}
        style={[
          s.hero,
          { paddingHorizontal: heroInset },
          columns && {
            minHeight: Math.max(220 * Math.max(1, fontScale), minHeroHeight),
          },
        ]}
      >
        <View
          testID="current-weather-primary"
          onLayout={layoutChanged}
          style={[
            s.heroRow,
            compact && s.compactRow,
            stackReadings && s.stackedRow,
          ]}
        >
          <View
            accessible
            accessibilityLabel={temperature}
            style={s.reading}
            ref={readingRef}
            collapsable={false}
            onLayout={layoutChanged}
          >
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[
                s.temperature,
                heroLetterShadow,
                heroText,
                {
                  fontSize: temperatureSize,
                  lineHeight: temperatureSize,
                  letterSpacing: -0.06 * temperatureSize,
                },
              ]}
            >
              {temperature.slice(0, unitStart)}
            </Text>
            <Text
              style={[
                s.unit,
                heroLetterShadow,
                heroText,
                {
                  fontSize: Math.round(temperatureSize * 0.34),
                  marginTop: Math.round(temperatureSize * fontScale * 0.08),
                },
              ]}
            >
              {temperature.slice(unitStart)}
            </Text>
          </View>
          <View
            ref={conditionRef}
            collapsable={false}
            onLayout={layoutChanged}
            style={[
              s.condition,
              {
                columnGap: conditionSize * 0.32,
                top: -conditionOffset,
                marginTop: conditionOffset,
                marginBottom: -conditionOffset,
              },
              stackReadings && s.stackedCondition,
            ]}
          >
            <View style={[s.conditionIcon, { height: conditionLineHeight }]}>
              <WeatherIcon
                weatherMain={main}
                size={(compact ? 20 : 22) * fontScale}
                color={theme.heroText}
                isNight={theme.isNight}
              />
            </View>
            <Text
              allowFontScaling={false}
              onLayout={({ nativeEvent }) =>
                setConditionHeight(nativeEvent.layout.height)
              }
              style={[
                s.conditionText,
                heroLetterShadow,
                heroText,
                {
                  fontSize: conditionSize,
                  lineHeight: conditionLineHeight,
                  letterSpacing: -0.025 * conditionSize,
                },
              ]}
            >
              {description.charAt(0).toUpperCase() + description.slice(1)}
            </Text>
          </View>
        </View>
        <View
          style={[s.support, { borderTopColor: theme.divider }]}
          ref={supportRef}
          collapsable={false}
          onLayout={layoutChanged}
        >
          <Text style={[s.metric, heroLetterShadow, secondaryText]}>
            Feels like{' '}
            <Text style={[s.metricValue, heroText]}>
              {formatTemperature(weather.main.feels_like)}
            </Text>
          </Text>
          <View style={s.range}>
            <Text style={[s.metric, heroLetterShadow, secondaryText]}>
              High{' '}
              <Text style={[s.metricValue, heroText]}>
                {formatTemperature(weather.main.temp_max)}
              </Text>
            </Text>
            <Text style={[s.metric, heroLetterShadow, secondaryText]}>
              Low{' '}
              <Text style={[s.metricValue, heroText]}>
                {formatTemperature(weather.main.temp_min)}
              </Text>
            </Text>
          </View>
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
    paddingVertical: 10,
    justifyContent: 'center',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
  },
  compactRow: { columnGap: 8 },
  stackedRow: { flexDirection: 'column', alignItems: 'flex-start' },
  reading: {
    flexDirection: 'row',
    alignItems: 'baseline',
    maxWidth: '100%',
    gap: 3,
  },
  temperature: {
    flexShrink: 1,
    includeFontPadding: false,
    fontWeight: '300',
    fontVariant: ['lining-nums', 'tabular-nums'],
  },
  unit: {
    alignSelf: 'flex-start',
    includeFontPadding: false,
    letterSpacing: -1,
    fontWeight: '500',
  },
  condition: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexShrink: 1,
    minWidth: 0,
    maxWidth: '58%',
  },
  stackedCondition: { maxWidth: '100%' },
  conditionIcon: { alignSelf: 'flex-start', justifyContent: 'center' },
  conditionText: {
    flexShrink: 1,
    minWidth: 0,
    includeFontPadding: false,
    fontWeight: '600',
  },
  support: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: 6,
    columnGap: 10,
    marginTop: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  range: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    justifyContent: 'flex-end',
    marginStart: 'auto',
    gap: 4,
    columnGap: 10,
  },
  metric: { fontSize: 15, lineHeight: 21, includeFontPadding: false },
  metricValue: { fontWeight: '600', fontVariant: ['tabular-nums'] },
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
