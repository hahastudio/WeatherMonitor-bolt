import React, { memo, useId, useMemo, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  Line,
  Path,
  Rect,
  Text as SvgText,
} from 'react-native-svg';
import type {
  AstronomyDay,
  ObserverZone,
  SkyPosition,
} from '../../types/astronomy';
import { formatObserverTime } from '../../utils/astronomyTime';
import { bearingLabel } from '../../services/astronomyService';
import type { WeatherTheme } from '../../utils/weatherTheme';
import { skyColors } from './skyStyles';

export const CelestialPathChart = memo(function CelestialPathChart({
  body,
  day,
  selected,
  atUtcMs,
  zone,
  theme,
}: {
  body: 'sun' | 'moon';
  day: AstronomyDay;
  selected: SkyPosition;
  atUtcMs: number;
  zone: ObserverZone;
  theme: WeatherTheme;
}) {
  const [width, setWidth] = useState(300);
  const { fontScale } = useWindowDimensions();
  const textScale = Math.max(1, Math.min(2, fontScale));
  const fontSize = 11 * textScale;
  const height = 175 + 60 * (textScale - 1);
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const colors = skyColors(theme);
  const left = 38 * textScale,
    right = width - 8,
    top = 18 * textScale,
    bottom = height - 34 * textScale;
  const x = (t: number) =>
    left +
    ((t - day.startUtcMs) / (day.endUtcMs - day.startUtcMs)) * (right - left);
  const y = (a: number) => top + ((90 - a) / 180) * (bottom - top);
  const path = useMemo(
    () =>
      day.samples
        .map(
          (p, i) =>
            `${i ? 'L' : 'M'}${(left + ((p.atUtcMs - day.startUtcMs) / (day.endUtcMs - day.startUtcMs)) * (right - left)).toFixed(2)},${(top + ((90 - p[body].altitudeDeg) / 180) * (bottom - top)).toFixed(2)}`,
        )
        .join(' '),
    [day.samples, day.startUtcMs, day.endUtcMs, left, right, top, bottom, body],
  );
  const tickFractions =
    width < 360 && textScale > 1.3
      ? [0, 1]
      : width < 360 || textScale > 1.3
        ? [0, 0.5, 1]
        : [0, 0.25, 0.5, 0.75, 1];
  const events =
    body === 'sun'
      ? [day.events.sunrise, day.events.sunset]
      : [day.events.moonrise, day.events.moonset];
  const label = `${body === 'sun' ? 'Sun' : 'Moon'} path. ${formatObserverTime(atUtcMs, zone, true)}: geometric elevation ${selected.altitudeDeg.toFixed(1)} degrees, bearing ${bearingLabel(selected.azimuthDeg)} from true north. Solid above the zero-degree horizon, dashed below. Vertical dotted lines mark rise and set; the cursor is the shared selected time.`;
  return (
    <View
      testID={`${body}-path`}
      accessible
      accessibilityRole="image"
      accessibilityLabel={label}
      onLayout={(e) => setWidth(Math.max(160, e.nativeEvent.layout.width))}
    >
      <Svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        accessible={false}
      >
        <Defs>
          <ClipPath id={`${id}above`}>
            <Rect x={0} y={0} width={width} height={y(0)} />
          </ClipPath>
          <ClipPath id={`${id}below`}>
            <Rect x={0} y={y(0)} width={width} height={height - y(0)} />
          </ClipPath>
        </Defs>
        {[60, 0, -60].map((a) => (
          <React.Fragment key={a}>
            <Line
              x1={left}
              x2={right}
              y1={y(a)}
              y2={y(a)}
              stroke={colors.line}
              strokeWidth={a === 0 ? 1.2 : 0.6}
            />
            <SvgText
              x={left - 6}
              y={y(a) + 4 * textScale}
              textAnchor="end"
              fontSize={fontSize}
              fill={theme.textSecondary}
            >
              {a}°
            </SvgText>
          </React.Fragment>
        ))}
        <SvgText
          x={right}
          y={y(0) - 5}
          textAnchor="end"
          fontSize={fontSize}
          fill={theme.textSecondary}
        >
          Horizon
        </SvgText>
        {events.flatMap((event, i) =>
          event.timesUtcMs.map((time) => (
            <Line
              key={`${i}-${time}`}
              x1={x(time)}
              x2={x(time)}
              y1={top}
              y2={bottom}
              stroke={theme.textSecondary}
              opacity={0.35}
              strokeDasharray="2 4"
            />
          )),
        )}
        <Path
          d={path}
          stroke={colors[body]}
          strokeWidth={2.2}
          fill="none"
          clipPath={`url(#${id}above)`}
        />
        <Path
          d={path}
          stroke={colors[body]}
          strokeWidth={1.7}
          strokeDasharray="4 4"
          fill="none"
          clipPath={`url(#${id}below)`}
        />
        <Line
          x1={x(atUtcMs)}
          x2={x(atUtcMs)}
          y1={top}
          y2={bottom}
          stroke={theme.textSecondary}
          strokeWidth={1}
        />
        <Circle
          cx={x(atUtcMs)}
          cy={y(selected.altitudeDeg)}
          r={4.5}
          fill={colors[body]}
          stroke={theme.surface}
          strokeWidth={1.5}
        />
        {tickFractions.map((f) => (
          <SvgText
            key={f}
            x={left + f * (right - left)}
            y={height - 8}
            textAnchor={f === 0 ? 'start' : f === 1 ? 'end' : 'middle'}
            fontSize={fontSize}
            fill={theme.textSecondary}
          >
            {f === 1
              ? '24:00'
              : formatObserverTime(
                  day.startUtcMs + (day.endUtcMs - day.startUtcMs) * f,
                  zone,
                )}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
});
