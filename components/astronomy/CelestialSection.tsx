import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Moon, Sun } from 'lucide-react-native';
import type {
  AstronomyDay,
  AstronomyEvent,
  AstronomyInstant,
  ObserverZone,
} from '../../types/astronomy';
import { bearingLabel } from '../../services/astronomyService';
import { formatObserverTime } from '../../utils/astronomyTime';
import type { WeatherTheme } from '../../utils/weatherTheme';
import { CelestialPathChart } from './CelestialPathChart';
import { MoonPhase } from './MoonPhase';
import { GlassSurface } from '../GlassSurface';
import { skyColors, skyStyles as s } from './skyStyles';

export function CelestialSection({
  body,
  day,
  instant,
  zone,
  theme,
  fitHeight = false,
}: {
  body: 'sun' | 'moon';
  day: AstronomyDay;
  instant: AstronomyInstant;
  zone: ObserverZone;
  theme: WeatherTheme;
  fitHeight?: boolean;
}) {
  const isSun = body === 'sun';
  const position = instant[body];
  const state = isSun ? day.sunState : day.moonState;
  const events = isSun
    ? [day.events.sunrise, day.events.sunset]
    : [day.events.moonrise, day.events.moonset];
  const eventLabel = (event: AstronomyEvent) =>
    event.status === 'unknown'
      ? 'Unknown'
      : event.status === 'none_on_date'
        ? 'None on this date'
        : event.timesUtcMs
            .map((t) =>
              formatObserverTime(
                t,
                zone,
                day.endUtcMs - day.startUtcMs !== 86_400_000,
              ),
            )
            .join(' · ');
  const Icon = isSun ? Sun : Moon;
  const minutes =
    day.daylightMs === null ? null : Math.round(day.daylightMs / 60_000);
  return (
    <GlassSurface
      theme={theme}
      testID={`${body}-section`}
      style={[
        s.section,
        fitHeight && { flex: 1, minHeight: 0, marginBottom: 0 },
      ]}
    >
      <ScrollView
        testID={`${body}-section-scroll`}
        scrollEnabled={fitHeight}
        nestedScrollEnabled
        style={{ flexGrow: fitHeight ? 1 : 0, flexShrink: fitHeight ? 1 : 0 }}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={fitHeight}
      >
        <View style={s.row}>
          <Icon size={22} color={skyColors(theme)[body]} />
          <Text
            accessibilityRole="header"
            style={[s.heading, { color: theme.text }]}
          >
            {isSun ? 'Sun' : 'Moon'}
          </Text>
        </View>
        {!isSun && (
          <MoonPhase
            theme={theme}
            phase={instant.moonPhaseCycle}
            fraction={instant.moonIlluminatedFraction}
            compact={fitHeight}
          />
        )}
        <Text style={[s.body, { color: theme.text, marginTop: isSun ? 8 : 0 }]}>
          {position.altitudeDeg.toFixed(1)}° elevation ·{' '}
          {bearingLabel(position.azimuthDeg)}
        </Text>
        {state !== 'crosses' && (
          <Text
            testID={`${body}-visibility`}
            style={[s.caption, { color: theme.textSecondary }]}
          >
            {state === 'always_up'
              ? 'Above horizon all day'
              : state === 'always_down'
                ? 'Below horizon all day'
                : 'Horizon state unavailable'}
          </Text>
        )}
        <CelestialPathChart
          body={body}
          day={day}
          selected={position}
          atUtcMs={instant.atUtcMs}
          zone={zone}
          theme={theme}
          compact={fitHeight}
        />
        <View
          style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}
        >
          {events.map((event, index) => (
            <View key={index} style={{ flex: 1, minWidth: 0 }}>
              <Text style={[s.caption, { color: theme.textSecondary }]}>
                {isSun
                  ? index
                    ? 'Sunset'
                    : 'Sunrise'
                  : index
                    ? 'Moonset'
                    : 'Moonrise'}
              </Text>
              <Text style={[s.body, { color: theme.text, fontWeight: '600' }]}>
                {eventLabel(event)}
              </Text>
            </View>
          ))}
          {isSun && (
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[s.caption, { color: theme.textSecondary }]}>
                Daylight
              </Text>
              <Text style={[s.body, { color: theme.text, fontWeight: '600' }]}>
                {minutes === null
                  ? 'Unknown'
                  : `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </GlassSurface>
  );
}
