import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useWeather } from '../../contexts/WeatherContext';
import { useAdaptiveLayout } from '../../hooks/useAdaptiveLayout';
import { ScrollingScreen } from '../../components/ScrollingScreen';
import { GlassSurface } from '../../components/GlassSurface';
import { CustomChart, type DataPoint } from '../../components/CustomChart';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorDisplay } from '../../components/ErrorDisplay';
import type { HourlyForecast } from '../../types/weather';

interface Series {
  name: string;
  color: string;
  data: DataPoint[];
}
function ChartPanel({
  title,
  unit,
  series,
  bar,
  headerHeight,
  onHeader,
  onInteractionChange,
}: {
  title: string;
  unit: string;
  series: Series[];
  bar?: boolean;
  headerHeight: number;
  onHeader: (height: number) => void;
  onInteractionChange: (active: boolean) => void;
}) {
  const { theme } = useWeather();
  const [guides, setGuides] = useState<0 | 1>(0);
  return (
    <GlassSurface
      theme={theme}
      testID="weather-chart-panel"
      style={{ padding: 14, flex: 1 }}
    >
      <View style={{ minHeight: headerHeight }}>
        <View onLayout={(e) => onHeader(e.nativeEvent.layout.height)}>
          <View style={s.heading}>
            <Text
              style={{
                color: theme.text,
                fontWeight: '600',
                fontSize: 18,
                flex: 1,
              }}
            >
              {title}
            </Text>
            <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
              {unit}
            </Text>
          </View>
          <View style={s.stats}>
            <Text style={s.seriesName} />
            {(bar ? ['Total', 'Max'] : ['Min', 'Max', 'Avg']).map((label) => (
              <Text
                key={label}
                style={[s.stat, { color: theme.textSecondary, fontSize: 12 }]}
              >
                {label}
              </Text>
            ))}
          </View>
          {series.map((item, index) => {
            const values = item.data.map((p) => p.y).filter(Number.isFinite);
            const total = values.reduce((a, b) => a + b, 0);
            const stats = values.length
              ? bar
                ? [total, Math.max(...values)]
                : [
                    Math.min(...values),
                    Math.max(...values),
                    total / values.length,
                  ]
              : bar
                ? [null, null]
                : [null, null, null];
            return (
              <Pressable
                key={item.name}
                disabled={series.length < 2}
                accessibilityRole={series.length > 1 ? 'button' : undefined}
                accessibilityLabel={`${item.name}, ${bar ? 'total, maximum' : 'minimum, maximum, average'} ${stats.map((v) => v?.toFixed(1) ?? 'Unavailable').join(', ')}${series.length > 1 ? '. Select min and max guides' : ''}`}
                accessibilityState={
                  series.length > 1 ? { selected: guides === index } : undefined
                }
                aria-pressed={series.length > 1 ? guides === index : undefined}
                onPress={() => setGuides(index as 0 | 1)}
                style={[s.stats, { minHeight: series.length > 1 ? 28 : 20 }]}
              >
                <Text
                  style={[
                    s.seriesName,
                    {
                      color: item.color,
                      fontSize: 12,
                      fontWeight: guides === index ? '700' : '500',
                    },
                  ]}
                >
                  {item.name}
                </Text>
                {stats.map((amount, i) => (
                  <Text
                    key={i}
                    style={[
                      s.stat,
                      { color: theme.text, fontSize: 14, fontWeight: '600' },
                    ]}
                  >
                    {amount?.toFixed(1) ?? '—'}
                  </Text>
                ))}
              </Pressable>
            );
          })}
        </View>
      </View>
      <CustomChart
        data={series[0].data}
        data2={series[1]?.data}
        color={series[0].color}
        color2={series[1]?.color}
        unit={unit}
        type={bar ? 'bar' : 'line'}
        guideSeries={guides}
        seriesNames={[series[0].name, series[1]?.name]}
        onInteractionChange={onInteractionChange}
      />
    </GlassSurface>
  );
}
export default function ChartsScreen() {
  const { forecast, theme, loading, error, refreshWeather } = useWeather();
  const { rail, columns, contentWidth } = useAdaptiveLayout();
  const [width, setWidth] = useState(contentWidth - 32);
  const [inspecting, setInspecting] = useState(false);
  const [headerHeights, setHeaderHeights] = useState<Record<string, number>>(
    {},
  );
  if (!forecast)
    return error ? (
      <ErrorDisplay error={error} onRetry={refreshWeather} />
    ) : (
      <LoadingSpinner message="Loading forecast charts..." />
    );
  const data = forecast.hourly;
  const series = (
    name: string,
    color: string,
    read: (item: HourlyForecast) => number | undefined,
  ): Series => ({
    name,
    color,
    data: data.map((item, i) => {
      const amount = read(item);
      const date = new Date(item.dt * 1000);
      const midnight = date.getHours() === 0;
      const dateLabel = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      return {
        x: i,
        y: typeof amount === 'number' ? amount : NaN,
        label:
          date.getHours() % 12 === 0
            ? midnight
              ? dateLabel
              : date.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })
            : '',
        dateLabel: midnight ? dateLabel : undefined,
        timeOfDay: midnight
          ? 'midnight'
          : date.getHours() === 12
            ? 'noon'
            : undefined,
        description: date.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        }),
      };
    }),
  });
  // Darker variants retain the same series meanings on a light reading surface.
  const colors = theme.isDark
    ? [
        '#8CC8FF',
        '#FFBC69',
        '#84E0AB',
        '#D4ADFF',
        '#FFB0B0',
        '#7DE1E3',
        '#FFAB96',
        '#8EDDD4',
      ]
    : [
        '#1256A0',
        '#935000',
        '#17663D',
        '#7439A4',
        '#A63246',
        '#00666B',
        '#A13824',
        '#086C62',
      ];
  const charts = [
    {
      title: 'Temperature',
      unit: '°C',
      series: [
        series('Temperature', colors[0], (i) => i.main?.temp),
        series('Feels like', colors[1], (i) => i.main?.feels_like),
      ],
    },
    {
      title: 'Precipitation',
      unit: 'mm',
      bar: true,
      series: [
        series(
          'Rain / snow',
          colors[0],
          (i) => (i.rain?.['1h'] ?? 0) + (i.snow?.['1h'] ?? 0),
        ),
      ],
    },
    {
      title: 'Wind Speed',
      unit: 'km/h',
      series: [
        series('Wind', colors[2], (i) =>
          i.wind?.speed === undefined ? undefined : i.wind.speed * 3.6,
        ),
        series('Gust', colors[3], (i) =>
          i.wind?.gust === undefined ? undefined : i.wind.gust * 3.6,
        ),
      ],
    },
    {
      title: 'Atmospheric Pressure',
      unit: 'hPa',
      series: [series('Pressure', colors[4], (i) => i.main?.pressure)],
    },
    {
      title: 'Air Quality Index',
      unit: '',
      series: [
        series('China AQI', colors[5], (i) => i.air_quality?.chn),
        series('US AQI', colors[6], (i) => i.air_quality?.usa),
      ],
    },
    {
      title: 'Humidity',
      unit: '%',
      series: [series('Humidity', colors[7], (i) => i.main?.humidity)],
    },
  ];
  const sharedHeight = columns
    ? Math.max(0, ...Object.values(headerHeights))
    : 0;
  return (
    <ScrollingScreen
      theme={theme}
      title="Weather Charts"
      onRefresh={refreshWeather}
      refreshBusy={loading}
      scrollEnabled={!inspecting}
      subtitle={
        <Text
          style={{
            color: theme.heroSecondary,
            textAlign: rail ? 'left' : 'center',
            marginTop: 6,
          }}
        >
          Next 48 Hours Forecast
        </Text>
      }
    >
      <View
        style={s.grid}
        onLayout={(e) => {
          if (e.nativeEvent.layout.width > 0)
            setWidth(e.nativeEvent.layout.width);
        }}
      >
        {charts.map((chart) => (
          <View
            key={chart.title}
            style={{ width: columns ? (width - 12) / 2 : '100%' }}
          >
            <ChartPanel
              {...chart}
              headerHeight={sharedHeight}
              onInteractionChange={setInspecting}
              onHeader={(height) =>
                setHeaderHeights((prev) =>
                  prev[chart.title] === height
                    ? prev
                    : { ...prev, [chart.title]: height },
                )
              }
            />
          </View>
        ))}
      </View>
      {error && (
        <GlassSurface theme={theme} style={{ padding: 12, marginTop: 12 }}>
          <Text style={{ color: theme.danger }}>{error}</Text>
        </GlassSurface>
      )}
    </ScrollingScreen>
  );
}
const s = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'stretch',
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  stats: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  seriesName: { flex: 1.5, minWidth: 0 },
  stat: { flex: 1, textAlign: 'right', fontVariant: ['tabular-nums'] },
});
