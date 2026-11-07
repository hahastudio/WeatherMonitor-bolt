import React, { memo } from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { phaseName } from '../../services/astronomyService';
import type { WeatherTheme } from '../../utils/weatherTheme';
import { skyColors, skyStyles as s } from './skyStyles';

export const MoonPhase = memo(function MoonPhase({
  phase,
  fraction,
  theme,
  compact = false,
}: {
  phase: number;
  fraction: number;
  theme: WeatherTheme;
  compact?: boolean;
}) {
  const colors = skyColors(theme);
  const sign = phase < 0.5 ? 1 : -1;
  const points: [number, number][] = [];
  for (let i = 0; i <= 48; i++) {
    const y = -24 + i;
    points.push([28 + sign * Math.sqrt(Math.max(0, 24 ** 2 - y ** 2)), 28 + y]);
  }
  for (let i = 48; i >= 0; i--) {
    const y = -24 + i;
    points.push([
      28 + sign * (1 - 2 * fraction) * Math.sqrt(Math.max(0, 24 ** 2 - y ** 2)),
      28 + y,
    ]);
  }
  const d =
    points.map(([x, y], i) => `${i ? 'L' : 'M'}${x},${y}`).join(' ') + 'Z';
  return (
    <View
      testID="moon-phase"
      style={[s.row, { marginVertical: compact ? 8 : 12 }]}
    >
      <Svg
        width={compact ? 40 : 56}
        height={compact ? 40 : 56}
        viewBox="0 0 56 56"
        accessible={false}
      >
        <Circle cx={28} cy={28} r={24} fill={colors.phaseDark} />
        <Path d={d} fill={colors.phaseLit} />
        <Circle
          cx={28}
          cy={28}
          r={24}
          stroke={theme.textSecondary}
          strokeWidth={0.5}
          fill="none"
        />
      </Svg>
      <View style={{ flex: 1, minWidth: 140 }}>
        <Text style={[s.heading, { color: theme.text }]}>
          {phaseName(phase)}
        </Text>
        <Text style={[s.body, { color: theme.text }]}>
          {(fraction * 100).toFixed(1)}% illuminated
        </Text>
      </View>
    </View>
  );
});
