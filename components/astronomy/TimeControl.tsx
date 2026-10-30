import React, { useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
} from 'lucide-react-native';
import type { AstronomyDay, ObserverZone } from '../../types/astronomy';
import {
  addLocalDays,
  formatObserverDate,
  formatObserverTime,
  zoneLabel,
} from '../../utils/astronomyTime';
import type { WeatherTheme } from '../../utils/weatherTheme';
import { skyColors, skyStyles as s } from './skyStyles';

export function TimeControl({
  day,
  today,
  atUtcMs,
  zone,
  isLive,
  theme,
  onTime,
  onDate,
  onNow,
}: {
  day: AstronomyDay;
  today: string;
  atUtcMs: number;
  zone: ObserverZone;
  isLive: boolean;
  theme: WeatherTheme;
  onTime: (time: number) => void;
  onDate: (direction: -1 | 1) => void;
  onNow: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [width, setWidth] = useState(300);
  const track = useRef<View>(null);
  const trackPageX = useRef(0);
  const span = day.endUtcMs - day.startUtcMs;
  const max = span - 60_000;
  const elapsed = Math.max(0, Math.min(max, atUtcMs - day.startUtcMs));
  const fraction = elapsed / max;
  const color = skyColors(theme).sun;
  const previewAt = (pageX: number) =>
    onTime(
      day.startUtcMs +
        Math.max(
          0,
          Math.min(1, (pageX - trackPageX.current - 12) / (width - 24)),
        ) *
          max,
    );
  const step = (direction: number) =>
    onTime(
      Math.max(
        day.startUtcMs,
        Math.min(day.endUtcMs - 60_000, atUtcMs + direction * 15 * 60_000),
      ),
    );
  const keys =
    Platform.OS === 'web'
      ? {
          onKeyDown: (event: { key: string; preventDefault: () => void }) => {
            if (
              [
                'ArrowLeft',
                'ArrowDown',
                'ArrowRight',
                'ArrowUp',
                'Home',
                'End',
              ].includes(event.key)
            ) {
              event.preventDefault();
              if (event.key === 'Home') onTime(day.startUtcMs);
              else if (event.key === 'End') onTime(day.endUtcMs - 60_000);
              else
                step(['ArrowLeft', 'ArrowDown'].includes(event.key) ? -1 : 1);
            }
          },
        }
      : {};
  const actionStyle = [s.button, { borderColor: skyColors(theme).line }];
  const ToggleIcon = expanded ? ChevronUp : ChevronDown;
  return (
    <View
      style={[s.section, { backgroundColor: theme.surface }]}
      testID="sky-time-controls"
    >
      <Pressable
        testID="sky-time-toggle"
        accessibilityRole="button"
        accessibilityLabel={`${isLive ? 'Live' : 'Preview'} time, ${formatObserverDate(day.localDate)}, ${formatObserverTime(atUtcMs, zone, true)}. ${zoneLabel(zone, atUtcMs)}. ${expanded ? 'Hide' : 'Show'} time controls`}
        accessibilityState={{ expanded }}
        aria-expanded={expanded}
        onPress={() => setExpanded((value) => !value)}
        style={styles.summary}
      >
        <View style={{ flex: 1 }}>
          <Text
            testID="selected-sky-time"
            style={[s.value, { color: theme.text }]}
          >
            {formatObserverTime(
              atUtcMs,
              zone,
              span !== 86_400_000 || zone.kind !== 'iana',
            )}
          </Text>
          <Text
            testID="sky-time-status"
            style={[s.caption, { color: theme.textSecondary }]}
          >
            {isLive ? 'Live' : `Preview · ${formatObserverDate(day.localDate)}`}
          </Text>
        </View>
        <ToggleIcon size={20} color={theme.textSecondary} />
      </Pressable>
      {expanded && (
        <View testID="sky-time-panel" style={{ marginTop: 12 }}>
          <View style={styles.dateRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Previous date"
              disabled={day.localDate <= today}
              accessibilityState={{ disabled: day.localDate <= today }}
              onPress={() => onDate(-1)}
              style={[
                actionStyle,
                { opacity: day.localDate <= today ? 0.35 : 1 },
              ]}
            >
              <ChevronLeft size={20} color={theme.text} />
            </Pressable>
            <Text
              style={[
                s.body,
                {
                  color: theme.text,
                  textAlign: 'center',
                  flex: 1,
                  fontWeight: '600',
                },
              ]}
            >
              {formatObserverDate(day.localDate)}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Next date"
              disabled={day.localDate >= addLocalDays(today, 7)}
              accessibilityState={{
                disabled: day.localDate >= addLocalDays(today, 7),
              }}
              onPress={() => onDate(1)}
              style={[
                actionStyle,
                { opacity: day.localDate >= addLocalDays(today, 7) ? 0.35 : 1 },
              ]}
            >
              <ChevronRight size={20} color={theme.text} />
            </Pressable>
          </View>
          <View
            {...keys}
            ref={track}
            testID="sky-time-slider"
            accessible
            accessibilityRole="adjustable"
            aria-valuemin={0}
            aria-valuemax={max / 60_000}
            aria-valuenow={Math.floor(elapsed / 60_000)}
            aria-valuetext={formatObserverTime(atUtcMs, zone, true)}
            accessibilityLabel="Time of day"
            accessibilityHint="Adjust by fifteen minutes, or drag to preview. All sky views share this time."
            accessibilityValue={{
              min: 0,
              max: max / 60_000,
              now: Math.floor(elapsed / 60_000),
              text: formatObserverTime(atUtcMs, zone, true),
            }}
            accessibilityActions={[
              { name: 'increment' },
              { name: 'decrement' },
            ]}
            onAccessibilityAction={(e) =>
              step(e.nativeEvent.actionName === 'increment' ? 1 : -1)
            }
            tabIndex={0}
            onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
            onStartShouldSetResponder={() => true}
            onResponderGrant={(e) => {
              const pageX = e.nativeEvent.pageX;
              track.current?.measureInWindow((x) => {
                trackPageX.current = x;
                previewAt(pageX);
              });
            }}
            onResponderMove={(e) => previewAt(e.nativeEvent.pageX)}
            onResponderTerminationRequest={() => true}
            style={styles.slider}
          >
            <View
              pointerEvents="none"
              style={[styles.rail, { backgroundColor: skyColors(theme).line }]}
            />
            <View
              pointerEvents="none"
              style={[
                styles.fill,
                {
                  width: Math.max(0, width - 24) * fraction,
                  backgroundColor: color,
                },
              ]}
            />
            <View
              pointerEvents="none"
              style={[
                styles.thumb,
                {
                  left: Math.max(0, width - 24) * fraction,
                  backgroundColor: color,
                  borderColor: theme.surface,
                },
              ]}
            />
          </View>
          <View style={s.spread}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Preview fifteen minutes earlier"
              onPress={() => step(-1)}
              style={actionStyle}
            >
              <Text style={{ color: theme.text }}>−15 min</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Now, resume live time"
              onPress={onNow}
              style={actionStyle}
            >
              <Text style={{ color: theme.text }}>Now</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Preview fifteen minutes later"
              onPress={() => step(1)}
              style={actionStyle}
            >
              <Text style={{ color: theme.text }}>+15 min</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  summary: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  slider: { height: 48, justifyContent: 'center', marginVertical: 4 },
  rail: {
    position: 'absolute',
    height: 4,
    left: 12,
    right: 12,
    borderRadius: 2,
  },
  fill: { position: 'absolute', height: 4, left: 12, borderRadius: 2 },
  thumb: {
    position: 'absolute',
    height: 24,
    width: 24,
    borderRadius: 12,
    borderWidth: 2,
  },
});
